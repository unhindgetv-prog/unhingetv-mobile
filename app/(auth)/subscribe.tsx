import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Crown, Check, X } from "lucide-react-native";
import type { ProductSubscription } from "react-native-iap";
import {
  PRODUCT_IDS,
  fetchSubscriptionProducts,
  formatPrice,
  purchaseSubscription,
} from "../../lib/iap";
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";

const PERKS = [
  "Unlimited streaming on every show",
  "Skip the ads — pure content",
  "Watch on phone, tablet, TV, and web",
  "Cancel anytime in your store account",
];

export default function SubscribeScreen() {
  const [products, setProducts] = useState<ProductSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSubscriptionProducts()
      .then((subs) => {
        if (!mounted) return;
        setProducts(subs);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubscribe(sku: string) {
    setPurchasing(sku);
    try {
      const result = await purchaseSubscription(sku);
      Alert.alert(
        "Subscription active",
        `${result.plan === "MONTHLY" ? "Monthly" : "Yearly"} plan is now active.`,
        [{ text: "Watch now", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      // User cancel comes through as an error string from RNIAP — silence it.
      if (!/cancel/i.test(msg)) {
        Alert.alert("Subscription failed", msg);
      }
    } finally {
      setPurchasing(null);
    }
  }

  const monthly = products.find((p) => p.id === PRODUCT_IDS.monthly);
  const yearly = products.find((p) => p.id === PRODUCT_IDS.yearly);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
        <X size={22} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.crownWrap}>
        <Crown size={44} color={Colors.gold} />
      </View>
      <Text style={styles.title}>Unlock UnhingeTV</Text>
      <Text style={styles.subtitle}>
        Stream everything. Every show, every season.
      </Text>

      <View style={styles.perks}>
        {PERKS.map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Check size={16} color={Colors.green} />
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.red} style={{ marginTop: Spacing.xl }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.plans}>
          {yearly && (
            <PlanCard
              title="Yearly"
              subtitle="Best value — save 15%"
              price={formatPrice(yearly)}
              cadence="/year"
              featured
              loading={purchasing === PRODUCT_IDS.yearly}
              onPress={() => handleSubscribe(PRODUCT_IDS.yearly)}
              disabled={!!purchasing}
            />
          )}
          {monthly && (
            <PlanCard
              title="Monthly"
              subtitle="Pay as you go"
              price={formatPrice(monthly)}
              cadence="/month"
              loading={purchasing === PRODUCT_IDS.monthly}
              onPress={() => handleSubscribe(PRODUCT_IDS.monthly)}
              disabled={!!purchasing}
            />
          )}
          {!yearly && !monthly && (
            <Text style={styles.error}>
              Subscription products unavailable. Try again later.
            </Text>
          )}
        </View>
      )}

      <Text style={styles.legal}>
        Payment will be charged to your {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account
        at confirmation. Subscriptions auto-renew unless canceled at least 24 hours before the end
        of the current period. Manage or cancel anytime in your{" "}
        {Platform.OS === "ios" ? "App Store account settings" : "Play Store subscriptions"}.
      </Text>
      <Text style={styles.legalLinks}>
        Terms: https://unhingetv.com/terms · Privacy: https://unhingetv.com/privacy
      </Text>
    </ScrollView>
  );
}

function PlanCard({
  title,
  subtitle,
  price,
  cadence,
  featured,
  loading,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
  price: string;
  cadence: string;
  featured?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.plan, featured && styles.planFeatured, disabled && styles.planDisabled]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.planTitle, featured && styles.planTitleFeatured]}>{title}</Text>
        <Text style={styles.planSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.planPriceWrap}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Text style={styles.planPrice}>{price}</Text>
            <Text style={styles.planCadence}>{cadence}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
  closeBtn: { position: "absolute", top: 50, right: Spacing.lg, zIndex: 2, padding: 6 },
  crownWrap: { alignSelf: "center", marginBottom: Spacing.md },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: "900",
    color: Colors.white,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: Spacing.xl,
  },
  perks: { gap: 10, marginBottom: Spacing.xl },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkText: { color: Colors.white, fontSize: FontSizes.sm, flex: 1 },
  plans: { gap: Spacing.sm, marginTop: Spacing.sm },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  planFeatured: { borderColor: Colors.red, backgroundColor: "#1a0000" },
  planDisabled: { opacity: 0.5 },
  planTitle: { fontSize: FontSizes.lg, fontWeight: "800", color: Colors.white },
  planTitleFeatured: { color: Colors.red },
  planSubtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  planPriceWrap: { alignItems: "flex-end", minWidth: 80 },
  planPrice: { fontSize: FontSizes.xl, fontWeight: "900", color: Colors.white },
  planCadence: { fontSize: FontSizes.xs, color: Colors.textMuted },
  legal: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xl,
    lineHeight: 14,
  },
  legalLinks: {
    fontSize: 10,
    color: Colors.textFaint,
    textAlign: "center",
    marginTop: 6,
  },
  error: {
    color: Colors.red,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontSize: FontSizes.sm,
  },
});
