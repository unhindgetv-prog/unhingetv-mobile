import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  Crown,
  LogOut,
  ChevronRight,
  Star,
  RefreshCw,
  FileText,
  ShieldCheck,
  Mail,
  Trash2,
  ExternalLink,
} from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { getSubscription } from "../../lib/api";
import { restorePurchases } from "../../lib/iap";
import { Colors, Fonts, FontSizes, Radius, Spacing, Glow } from "../../constants/theme";
import { BrandLogo, PrimaryButton } from "../../components/ui";
import Constants from "expo-constants";

const WEB_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "https://unhingetv.com";

interface SubInfo {
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <View style={styles.menuRight}>
        {right ?? <ChevronRight size={16} color={Colors.textFaint} />}
      </View>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const [sub, setSub]           = useState<SubInfo | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setSubLoading(true);
      getSubscription(token)
        .then(setSub)
        .finally(() => setSubLoading(false));
    }
  }, [token]);

  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        setSub({
          status: restored.status,
          plan: restored.plan,
          currentPeriodEnd: restored.currentPeriodEnd,
        });
        Alert.alert("Purchases Restored", "Your subscription is active.");
      } else {
        Alert.alert(
          "No Purchases Found",
          "We didn't find any previous purchases on this Apple ID."
        );
      }
    } catch (err) {
      Alert.alert(
        "Restore Failed",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setRestoring(false);
    }
  }

  function handleManageSubscription() {
    // Apple requires that cancellation be directed to App Store settings, not
    // handled in-app for IAP subscriptions.
    Linking.openURL("https://apps.apple.com/account/subscriptions").catch(() => {
      Alert.alert(
        "Manage Subscription",
        "Open Settings → Apple ID → Subscriptions to manage."
      );
    });
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your account, watch history, ratings, and comments. " +
        "If you have an active App Store subscription, cancel it separately in " +
        "Settings → Apple ID → Subscriptions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setDeleting(true);
            try {
              const res = await fetch(`${WEB_URL}/api/account/delete`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Cookie: `next-auth.session-token=${token}`,
                },
              });
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
              }
              await logout();
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently removed."
              );
              router.replace("/(auth)/login");
            } catch (err) {
              Alert.alert(
                "Delete Failed",
                err instanceof Error ? err.message : "Please contact support@unhingetv.com"
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  // Not logged in
  if (!authLoading && !user) {
    return (
      <View style={styles.root}>
        <View style={styles.headerBar}>
          <BrandLogo size="md" />
          <Text style={styles.pageTitle}>ACCOUNT</Text>
        </View>
        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <User size={40} color={Colors.textFaint} />
          </View>
          <Text style={styles.guestEyebrow}>· MEMBERS AREA ·</Text>
          <Text style={styles.guestTitle}>SIGN IN</Text>
          <Text style={styles.guestSub}>
            Access your watchlist, track progress, and manage your subscription.
          </Text>
          <PrimaryButton
            label="Sign In"
            onPress={() => router.push("/(auth)/login")}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
          <TouchableOpacity
            style={styles.signUpLink}
            onPress={() => router.push("/(auth)/signup")}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpLinkText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const avatar = (user?.name ?? user?.email ?? "?")[0].toUpperCase();
  const isActive = sub?.status === "ACTIVE" || sub?.status === "TRIALING";

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBar}>
        <BrandLogo size="md" />
        <Text style={styles.pageTitle}>ACCOUNT</Text>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? "Member"}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
          <View style={styles.adminBadge}>
            <Star size={9} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        )}
      </View>

      {/* Subscription card */}
      <View style={styles.subCard}>
        <View style={styles.subTop}>
          <Crown size={20} color={isActive ? Colors.gold : Colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Subscription</Text>
            {subLoading
              ? <ActivityIndicator size="small" color={Colors.red} />
              : (
                <Text style={[styles.subStatus, { color: isActive ? Colors.green : Colors.textMuted }]}>
                  {isActive ? `Active — ${sub?.plan ?? "Standard"}` : "No active subscription"}
                </Text>
              )
            }
          </View>
          {!isActive && (
            <TouchableOpacity
              style={styles.subBtn}
              onPress={() => router.push("/(auth)/subscribe")}
              activeOpacity={0.85}
            >
              <Text style={styles.subBtnText}>Subscribe</Text>
            </TouchableOpacity>
          )}
        </View>
        {sub?.currentPeriodEnd && (
          <Text style={styles.subRenew}>
            Renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        )}
      </View>

      {/* Subscription management */}
      <View style={styles.menuGroup}>
        <MenuItem
          icon={<RefreshCw size={18} color={Colors.textSub} />}
          label="Restore Purchases"
          onPress={handleRestore}
          right={restoring ? <ActivityIndicator size="small" color={Colors.red} /> : undefined}
        />
        {isActive && (
          <MenuItem
            icon={<ExternalLink size={18} color={Colors.textSub} />}
            label="Manage Subscription"
            onPress={handleManageSubscription}
          />
        )}
      </View>

      {/* Legal */}
      <View style={[styles.menuGroup, { marginTop: Spacing.sm }]}>
        <MenuItem
          icon={<FileText size={18} color={Colors.textSub} />}
          label="Terms of Use"
          onPress={() => Linking.openURL(`${WEB_URL}/terms`)}
          right={<ExternalLink size={14} color={Colors.textFaint} />}
        />
        <MenuItem
          icon={<ShieldCheck size={18} color={Colors.textSub} />}
          label="Privacy Policy"
          onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}
          right={<ExternalLink size={14} color={Colors.textFaint} />}
        />
        <MenuItem
          icon={<Mail size={18} color={Colors.textSub} />}
          label="Contact Support"
          onPress={() => Linking.openURL(`mailto:support@unhingetv.com`)}
          right={<ExternalLink size={14} color={Colors.textFaint} />}
        />
      </View>

      {/* Account actions */}
      <View style={[styles.menuGroup, { marginTop: Spacing.sm }]}>
        <MenuItem
          icon={<LogOut size={18} color={Colors.red} />}
          label="Sign Out"
          onPress={handleLogout}
          danger
          right={<View />}
        />
        <MenuItem
          icon={<Trash2 size={18} color={Colors.red} />}
          label="Delete Account"
          onPress={handleDeleteAccount}
          danger
          right={deleting ? <ActivityIndicator size="small" color={Colors.red} /> : <View />}
        />
      </View>

      <Text style={styles.version}>UnhingeTV v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerBar: {
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Spacing.md,
  },
  pageTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 26,
    color: Colors.white,
    letterSpacing: 2,
    includeFontPadding: false,
  },
  guestEyebrow: {
    fontFamily: Fonts.barlow,
    color: Colors.red,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  // Guest
  guestWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.muted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  guestTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 38,
    color: Colors.white,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 8,
    includeFontPadding: false,
  },
  guestSub: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  signInBtn: {
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: Spacing.sm,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  signInBtnText: {
    fontSize: FontSizes.md,
    fontWeight: "800",
    color: Colors.white,
  },
  signUpLink: {
    paddingVertical: 10,
  },
  signUpLinkText: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    fontWeight: "600",
  },
  // Profile
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.red,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: "900",
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSizes.md,
    fontWeight: "800",
    color: Colors.white,
  },
  profileEmail: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: `${Colors.gold}20`,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  // Subscription
  subCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  subTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  subLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  subStatus: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  subBtn: {
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  subBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: "800",
    color: Colors.white,
  },
  subRenew: {
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
    marginTop: 6,
  },
  // Menu
  menuGroup: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  menuIcon: {
    width: 28,
    marginRight: Spacing.sm,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.white,
  },
  menuLabelDanger: {
    color: Colors.red,
  },
  menuRight: {
    marginLeft: Spacing.sm,
  },
  version: {
    textAlign: "center",
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
    marginTop: Spacing.lg,
  },
});
