/**
 * react-native-iap wrapper for UnhingeTV.
 *
 * Flow:
 *   1. App startup: initConnection() once (lazy on first paywall mount is fine too).
 *   2. Paywall: getProducts() → present prices.
 *   3. User taps Subscribe: requestSubscription({ sku }) → native sheet.
 *   4. purchaseUpdatedListener fires on success → POST our server /api/iap/validate
 *      with the platform-specific receipt → server is authoritative source of truth.
 *   5. On success: finishTransaction(purchase, isConsumable=false) to remove from queue.
 *
 * IMPORTANT: never grant entitlement based on what RNIAP tells the client. Wait for
 * the server's response from /api/iap/validate.
 */
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Subscription,
  type SubscriptionPurchase,
  type PurchaseError,
  type SubscriptionAndroid,
  type SubscriptionIOS,
} from "react-native-iap";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://unhingetv.vercel.app";

export const PRODUCT_IDS = {
  monthly: "com.unhingetv.monthly",
  yearly: "com.unhingetv.yearly",
} as const;

export const ALL_SKUS = [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];

let connected = false;
let updateSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;

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

export async function fetchProducts(): Promise<Subscription[]> {
  await connect();
  return getSubscriptions({ skus: ALL_SKUS });
}

/** Format a price for display, preferring the localized price string. */
export function formatPrice(sub: Subscription): string {
  if (Platform.OS === "ios") {
    const ios = sub as SubscriptionIOS;
    return ios.localizedPrice ?? `$${ios.price ?? "?"}`;
  }
  const a = sub as SubscriptionAndroid;
  const offer = a.subscriptionOfferDetails?.[0];
  const phase = offer?.pricingPhases?.pricingPhaseList?.[0];
  return phase?.formattedPrice ?? "—";
}

export type ValidateResponse = {
  ok: boolean;
  provider: "apple" | "google" | "amazon";
  plan: "MONTHLY" | "YEARLY";
  status: string;
  currentPeriodEnd: string | null;
};

/**
 * Detect if this purchase came from the Amazon Appstore (Fire TV / Amazon-sideloaded
 * Android build) rather than Google Play. Amazon purchases carry a `userIdAmazon`
 * field; Google Play purchases carry `purchaseToken`. We discriminate on shape rather
 * than install source because the latter requires an extra native call and the shape
 * check is authoritative for what we're about to validate.
 */
function isAmazonPurchase(p: SubscriptionPurchase): p is SubscriptionPurchase & {
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
      Cookie: `next-auth.session-token=${sessionToken}`,
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
    updateSub = purchaseUpdatedListener(async (purchase: SubscriptionPurchase) => {
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
  // Amazon subscription objects don't carry `subscriptionOfferDetails`, so absence
  // of that field is our signal that we're on Amazon and can request the plain SKU.
  if (Platform.OS === "android") {
    const subs = await getSubscriptions({ skus: [sku] });
    const a = subs[0] as SubscriptionAndroid | undefined;
    const offerToken = a?.subscriptionOfferDetails?.[0]?.offerToken;
    if (offerToken) {
      await requestSubscription({
        sku,
        subscriptionOffers: [{ sku, offerToken }],
      });
    } else {
      // Amazon Appstore path — no offer token, just request the SKU.
      await requestSubscription({ sku });
    }
  } else {
    await requestSubscription({ sku });
  }

  return result;
}

async function validateAndFinish(
  purchase: SubscriptionPurchase,
  sessionToken: string
): Promise<ValidateResponse> {
  let response: ValidateResponse;

  if (Platform.OS === "ios") {
    // StoreKit 2 path: purchase.transactionId is the signed JWS transaction id.
    response = await postValidate(
      { platform: "apple", transactionId: purchase.transactionId },
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
    const purchaseToken = (purchase as { purchaseToken?: string }).purchaseToken;
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
