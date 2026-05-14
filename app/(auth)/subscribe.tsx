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
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, Check, X, Sparkles } from "lucide-react-native";
import type { ProductSubscription } from "react-native-iap";
import {
  PRODUCT_IDS,
  fetchSubscriptionProducts,
  formatPrice,
  purchaseSubscription,
} from "../../lib/iap";
import {
  Colors,
  Fonts,
  FontSizes,
  Radius,
  Spacing,
  Glow,
} from "../../constants/theme";
import { BrandLogo, PrimaryButton, GlassCard } from "../../components/ui";

const { height: SCREEN_H } = Dimensions.get("window");

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
    <View style={styles.root}>
      <LinearGradient
        colors={["#1a0000", "#000000", "#000000"] as readonly [string, string, string]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glowBlob} pointerEvents="none" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <X size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <BrandLogo size="md" />
        </View>

        <View style={styles.crownCircle}>
          <Crown size={40} color={Colors.gold} fill={Colors.gold} />
        </View>

        <Text style={styles.eyebrow}>· UNLOCK THE NETWORK ·</Text>
        <Text style={styles.title}>GO UNHINGED</Text>
        <Text style={styles.subtitle}>Every show. Every season. No limits.</Text>

        <View style={styles.perks}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <View style={styles.perkCheck}>
                <Check size={12} color={Colors.white} strokeWidth={3} />
              </View>
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: "center", marginTop: Spacing.xl }}>
            <ActivityIndicator color={Colors.red} size="large" />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <View style={styles.plans}>
            {yearly && (
              <PlanCard
                title="YEARLY"
                subtitle="Best value — save 15%"
                price={formatPrice(yearly)}
                cadence="/year"
                featured
                badge="SAVE 15%"
                loading={purchasing === PRODUCT_IDS.yearly}
                disabled={!!purchasing}
                onPress={() => handleSubscribe(PRODUCT_IDS.yearly)}
              />
            )}
            {monthly && (
              <PlanCard
                title="MONTHLY"
                subtitle="Pay as you go"
                price={formatPrice(monthly)}
                cadence="/month"
                loading={purchasing === PRODUCT_IDS.monthly}
                disabled={!!purchasing}
                onPress={() => handleSubscribe(PRODUCT_IDS.monthly)}
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
          Payment will be charged to your{" "}
          {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account at confirmation.
          Subscriptions auto-renew unless canceled at least 24 hours before the end of the
          current period. Manage or cancel anytime in your{" "}
          {Platform.OS === "ios" ? "App Store account settings" : "Play Store subscriptions"}.
        </Text>
        <Text style={styles.legalLinks}>
          unhingetv.com/terms  ·  unhingetv.com/privacy
        </Text>
      </ScrollView>
    </View>
  );
}

function PlanCard({
  title,
  subtitle,
  price,
  cadence,
  featured,
  badge,
  loading,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
  price: string;
  cadence: string;
  featured?: boolean;
  badge?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={disabled}>
      <GlassCard redTint={featured} glow={featured} radius={Radius.lg}>
        <View style={[styles.plan, featured && styles.planFeatured]}>
          {badge && (
            <View style={styles.planBadge}>
              <Sparkles size={10} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.planBadgeText}>{badge}</Text>
            </View>
          )}
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
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  glowBlob: {
    position: "absolute",
    top: -SCREEN_H * 0.1,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: Colors.red,
    opacity: 0.2,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 64,
    paddingBottom: 48,
  },
  closeBtn: { position: "absolute", top: 56, right: Spacing.lg, zIndex: 2, padding: 6 },
  brandWrap: { alignSelf: "center", marginBottom: Spacing.lg },
  crownCircle: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontFamily: Fonts.barlow,
    color: Colors.red,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    fontFamily: Fonts.bebas,
    fontSize: 48,
    color: Colors.white,
    textAlign: "center",
    letterSpacing: 2.5,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    textAlign: "center",
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  perks: { gap: 12, marginBottom: Spacing.xl, alignSelf: "center" },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    ...Glow.redSm,
  },
  perkText: { color: Colors.white, fontSize: FontSizes.md, flex: 1, lineHeight: 22 },
  plans: { gap: Spacing.sm, marginTop: Spacing.sm },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    minHeight: 86,
  },
  planFeatured: {},
  planBadge: {
    position: "absolute",
    top: -12,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontFamily: Fonts.barlow,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.black,
    letterSpacing: 1.2,
  },
  planTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 24,
    color: Colors.white,
    letterSpacing: 1.5,
    includeFontPadding: false,
  },
  planTitleFeatured: { color: Colors.redAccent },
  planSubtitle: { fontSize: FontSizes.xs, color: Colors.textSub, marginTop: 2 },
  planPriceWrap: { alignItems: "flex-end", minWidth: 88 },
  planPrice: {
    fontFamily: Fonts.bebas,
    fontSize: 26,
    color: Colors.white,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  planCadence: { fontSize: FontSizes.xs, color: Colors.textSub, marginTop: 2 },
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
    letterSpacing: 0.5,
  },
  error: {
    color: Colors.red,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontSize: FontSizes.sm,
  },
});
