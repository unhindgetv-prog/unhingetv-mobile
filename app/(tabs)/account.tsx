import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  Crown,
  LogOut,
  ChevronRight,
  BookMarked,
  Settings,
  Star,
} from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { getSubscription } from "../../lib/api";
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";

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

  // Not logged in
  if (!authLoading && !user) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Account</Text>
        </View>
        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <User size={40} color={Colors.textFaint} />
          </View>
          <Text style={styles.guestTitle}>Sign in to UnhingeTV</Text>
          <Text style={styles.guestSub}>Access your watchlist, track progress, and manage your subscription.</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Account</Text>
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
              onPress={() => {/* Open subscribe screen or deep link */}}
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

      {/* Menu */}
      <View style={styles.menuGroup}>
        <MenuItem
          icon={<BookMarked size={18} color={Colors.textSub} />}
          label="My Watchlist"
          onPress={() => {/* Navigate to watchlist */}}
        />
        <MenuItem
          icon={<Settings size={18} color={Colors.textSub} />}
          label="Settings"
          onPress={() => {/* Navigate to settings */}}
        />
      </View>

      <View style={[styles.menuGroup, { marginTop: Spacing.sm }]}>
        <MenuItem
          icon={<LogOut size={18} color={Colors.red} />}
          label="Sign Out"
          onPress={handleLogout}
          danger
          right={<View />}
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
  pageTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 0.5,
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
    fontSize: FontSizes.xl,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 8,
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
