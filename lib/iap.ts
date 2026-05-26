/**
 * react-native-iap@15 wrapper for UnhingeTV.
 *
 * Flow:
 *   1. App startup: initConnection() once (lazy on first paywall mount is fine).
 *   2. Paywall: fetchProducts({type: 'subs'}) → present prices.
 *   3. User taps Subscribe: requestPurchase({type: 'subs', request: {...}}) → native sheet.
 *   4. purchaseUpdatedListener fires on success → POST our server /api/iap/validate
 *      with the platform-specific receipt → server is authoritative source of truth.
 *   5. On success: finishTransaction({ purchase }) to remove from queue.
 *
 * IMPORTANT: never grant entitlement based on what RNIAP tells the client. Wait for
 * the server's response from /api/iap/validate.
 */
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductSubscription,
  type ProductSubscriptionAndroid,
  type ProductSubscriptionIOS,
  type Purchase,
  type PurchaseError,
  type EventSubscription,
} from "react-native-iap";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// See lib/api.ts for the canonical resolution order — EAS Secret → app.json extra
// → apex fallback. Kept in sync via SHARED_PRODUCT_IDS.md (relevant constants table).
const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "https://unhingetv.com";

export const PRODUCT_IDS = {
  monthly: "com.unhingetv.monthly",
  yearly: "com.unhingetv.yearly",
} as const;

export const ALL_SKUS = [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];

let connected = false;
let updateSub: EventSubscription | null = null;
let errorSub: EventSubscription | null = null;

export async function connect(): Promise<void> {
  if (connected) return;
  await initConnection();
  connected = true;
}

export async function disconnect(): Promise<void> {
  updateSub?.remove();
  errorSub?.remove();
  updateSub = null;
  errorSub = null;
  if (connected) {
    await endConnection();
    connected = false;
  }
}

export async function fetchSubscriptionProducts(): Promise<ProductSubscription[]> {
  await connect();
  const result = await fetchProducts({ skus: ALL_SKUS, type: "subs" });
  // fetchProducts({type:'subs'}) returns ProductSubscription[] | null.
  return (result ?? []).filter((p): p is ProductSubscription => p?.type === "subs");
}

/** Format a price for display, preferring the localized price string. */
export function formatPrice(sub: ProductSubscription): string {
  if (sub.platform === "ios") {
    const ios = sub as ProductSubscriptionIOS;
    return ios.displayPrice ?? `$${ios.price ?? "?"}`;
  }
  const a = sub as ProductSubscriptionAndroid;
  const offer = a.subscriptionOffers?.[0] ?? a.subscriptionOfferDetailsAndroid?.[0];
  // SubscriptionOffer uses pricingPhases.list; the legacy Android offer uses pricingPhases.pricingPhaseList.
  const offerAny = offer as
    | { pricingPhases?: { pricingPhaseList?: Array<{ formattedPrice?: string }> } }
    | undefined;
  const phase = offerAny?.pricingPhases?.pricingPhaseList?.[0];
  return phase?.formattedPrice ?? a.displayPrice ?? "—";
}

export type ValidateResponse = {
  ok: boolean;
  provider: "apple" | "google" | "amazon";
  plan: "MONTHLY" | "YEARLY";
  status: string;
  currentPeriodEnd: string | null;
};

/**
 * Amazon Appstore purchases (Fire TV) carry `userIdAmazon` + `receiptId` at
 * runtime, not in the typed Purchase union. Detect on shape since that's
 * authoritative for what we're about to validate.
 */
function isAmazonPurchase(p: Purchase): p is Purchase & {
  userIdAmazon: string;
  receiptId: string;
} {
  const x = p as { userIdAmazon?: string; receiptId?: string };
  return typeof x.userIdAmazon === "string" && typeof x.receiptId === "string";
}

async function postValidate(body: object, sessionToken: string): Promise<ValidateResponse> {
  const res = await fetch(`${BASE_URL}/api/iap/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `__Secure-next-auth.session-token=${sessionToken}; next-auth.session-token=${sessionToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ValidateResponse>;
}

/**
 * Buy a subscription. Presents the native sheet, awaits the purchase event,
 * validates server-side, and finishes the transaction.
 *
 * Throws on user cancel or server validation failure (in which case we do NOT
 * finish the transaction so the user can retry).
 */
export async function purchaseSubscription(sku: string): Promise<ValidateResponse> {
  await connect();

  const sessionToken = await SecureStore.getItemAsync("unhingetv_session");
  if (!sessionToken) throw new Error("Not authenticated");

  // Set up listeners BEFORE requesting purchase so we never miss the event.
  const result = new Promise<ValidateResponse>((resolve, reject) => {
    updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      try {
        const validated = await validateAndFinish(purchase, sessionToken);
        resolve(validated);
      } catch (err) {
        reject(err);
      } finally {
        updateSub?.remove();
        errorSub?.remove();
        updateSub = null;
        errorSub = null;
      }
    });
    errorSub = purchaseErrorListener((err: PurchaseError) => {
      reject(new Error(err.message || "Purchase failed"));
      updateSub?.remove();
      errorSub?.remove();
      updateSub = null;
      errorSub = null;
    });
  });

  // Google Play (Android v5+) needs subscriptionOffers; Amazon Appstore does not.
  // Amazon ProductSubscription objects don't carry subscription offers, so absence
  // of that field is our signal that we're on Amazon and can request the plain SKU.
  if (Platform.OS === "android") {
    const subs = await fetchProducts({ skus: [sku], type: "subs" });
    const a = (subs?.[0] as ProductSubscriptionAndroid | undefined);
    const offerToken =
      a?.subscriptionOffers?.[0]?.offerTokenAndroid ??
      a?.subscriptionOfferDetailsAndroid?.[0]?.offerToken;
    await requestPurchase({
      type: "subs",
      request: {
        google: {
          skus: [sku],
          ...(offerToken
            ? { subscriptionOffers: [{ sku, offerToken }] }
            : {}),
        },
      },
    });
  } else {
    await requestPurchase({
      type: "subs",
      request: { apple: { sku } },
    });
  }

  return result;
}

async function validateAndFinish(
  purchase: Purchase,
  sessionToken: string
): Promise<ValidateResponse> {
  let response: ValidateResponse;

  if (Platform.OS === "ios") {
    // StoreKit 2 path: purchase.transactionId is the signed JWS transaction id.
    const transactionId = (purchase as { transactionId?: string }).transactionId;
    response = await postValidate(
      { platform: "apple", transactionId },
      sessionToken
    );
  } else if (isAmazonPurchase(purchase)) {
    // Fire TV / Amazon Appstore install — receipt validates via Amazon RVS.
    response = await postValidate(
      {
        platform: "amazon",
        receiptId: purchase.receiptId,
        amazonUserId: purchase.userIdAmazon,
        productId: purchase.productId,
      },
      sessionToken
    );
  } else {
    const purchaseToken = (purchase as { purchaseToken?: string | null }).purchaseToken;
    if (!purchaseToken) throw new Error("Missing purchaseToken on Android purchase");
    response = await postValidate(
      {
        platform: "google",
        purchaseToken,
        productId: purchase.productId,
      },
      sessionToken
    );
  }

  // Only finish the txn after the server confirms — otherwise on retry the
  // user's queue still has it and we can re-validate.
  await finishTransaction({ purchase, isConsumable: false });
  return response;
}

/**
 * App Store Guideline 3.1.1: Restore Purchases must be available. Reads the
 * platform's existing purchase history, posts each subscription receipt to the
 * server, returns the most-recent validated response (or null if nothing to
 * restore).
 */
export async function restorePurchases(): Promise<ValidateResponse | null> {
  await connect();
  const sessionToken = await SecureStore.getItemAsync("unhingetv_session");
  if (!sessionToken) throw new Error("Not authenticated");

  const purchases = await getAvailablePurchases();
  const ours = purchases.filter((p) =>
    (ALL_SKUS as readonly string[]).includes(p.productId)
  );
  if (ours.length === 0) return null;

  let latest: ValidateResponse | null = null;
  for (const purchase of ours) {
    try {
      const validated = await validateAndFinish(purchase, sessionToken);
      latest = validated;
    } catch {
      // Skip individual failures; surface the most recent successful restore.
    }
  }
  return latest;
}

// Legacy aliases — kept for existing call-sites until they migrate.
export { fetchSubscriptionProducts as fetchProducts };
