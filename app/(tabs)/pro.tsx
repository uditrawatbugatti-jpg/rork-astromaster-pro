import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { CheckCircle2, Copy, Crown, ExternalLink, RefreshCcw, Shield, Sparkles } from "lucide-react-native";

import Colors from "@/constants/colors";
import { usePro } from "@/contexts/ProContext";

function formatExpiry(expiresAt: number | null) {
  if (expiresAt == null) return "Never";
  try {
    return new Date(expiresAt).toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function ProScreen() {
  const {
    isLoaded,
    isPro,
    status,
    daysLeft,
    isVerifying,
    lastError,
    licenseToken,
    activate,
    signOutLicense,
    refresh,
  } = usePro();

  const [input, setInput] = useState<string>("");

  const headerSubtitle = useMemo(() => {
    if (!isLoaded) return "Checking license…";
    if (status.state === "pro") return "Pro is active";
    return "Unlock advanced astrology + AI";
  }, [isLoaded, status.state]);

  const onPasteFromClipboard = useCallback(async () => {
    try {
      const mod = await import("expo-clipboard");
      const text = await mod.getStringAsync();
      if (typeof text === "string" && text.trim().length > 0) {
        setInput(text.trim());
        Haptics.selectionAsync();
      }
    } catch (e) {
      console.error("[pro] clipboard error", e);
      Alert.alert("Clipboard", "Could not access clipboard on this device.");
    }
  }, []);

  const onActivate = useCallback(async () => {
    try {
      await activate(input);
      setInput("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Activation failed";
      Alert.alert("Activation failed", msg);
    }
  }, [activate, input]);

  const onOpenCheckout = useCallback(async () => {
    Haptics.selectionAsync();

    // Placeholder: integrate Google Pay via a payment processor (Stripe) + server-side order validation.
    // For now we open an external checkout URL if you provide it.
    const checkoutUrl = process.env.EXPO_PUBLIC_CHECKOUT_URL;

    if (!checkoutUrl) {
      Alert.alert(
        "Checkout not configured",
        "Set EXPO_PUBLIC_CHECKOUT_URL to your payment page (Stripe Checkout / your site) and try again.",
      );
      return;
    }

    try {
      console.log("[pro] opening checkout", { checkoutUrl });
      await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch (e) {
      console.error("[pro] open checkout error", e);
      Alert.alert("Could not open checkout", "Please try again.");
    }
  }, []);

  const onCopyActiveToken = useCallback(async () => {
    try {
      const mod = await import("expo-clipboard");
      await mod.setStringAsync(licenseToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("[pro] copy token error", e);
    }
  }, [licenseToken]);

  const planCard = useMemo(() => {
    const expiresAt = status.state === "pro" ? status.expiresAt : null;

    return (
      <View style={styles.planCard} testID="pro.planCard">
        <View style={styles.planRow}>
          <View style={styles.planIconWrap}>
            <Crown size={18} color={Colors.cosmic.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>Jyotish AI Pro</Text>
            <Text style={styles.planMeta}>
              Status: {isPro ? "Active" : isLoaded ? "Inactive" : "Loading"} · Expires: {formatExpiry(expiresAt)}
            </Text>
          </View>
        </View>

        {isPro ? (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <CheckCircle2 size={14} color={Colors.cosmic.success} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
            {daysLeft != null ? (
              <View style={styles.badge}>
                <Sparkles size={14} color={Colors.cosmic.primary} />
                <Text style={styles.badgeText}>{daysLeft} days left</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Shield size={14} color={Colors.cosmic.textSecondary} />
              <Text style={styles.badgeText}>Secure license verification</Text>
            </View>
          </View>
        )}

        {lastError.trim().length > 0 ? (
          <View style={styles.errorBox} testID="pro.lastError">
            <Text style={styles.errorTitle}>Issue</Text>
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { flex: 1 }]}
            onPress={() => refresh()}
            disabled={!isLoaded || isVerifying}
            testID="pro.refresh"
          >
            <View style={styles.btnInner}>
              {isVerifying ? (
                <ActivityIndicator size="small" color={Colors.cosmic.text} />
              ) : (
                <RefreshCcw size={16} color={Colors.cosmic.text} />
              )}
              <Text style={styles.secondaryBtnText}>Refresh</Text>
            </View>
          </TouchableOpacity>

          {isPro ? (
            <TouchableOpacity
              style={[styles.secondaryBtn, { flex: 1 }]}
              onPress={() => signOutLicense()}
              disabled={!isLoaded || isVerifying}
              testID="pro.deactivate"
            >
              <Text style={styles.secondaryBtnText}>Deactivate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={onOpenCheckout}
              disabled={!isLoaded || isVerifying}
              testID="pro.buy"
            >
              <View style={styles.btnInner}>
                <ExternalLink size={16} color={Colors.cosmic.background} />
                <Text style={styles.primaryBtnText}>Buy Pro</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {isPro && licenseToken.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.tokenRow}
            onPress={onCopyActiveToken}
            testID="pro.copyToken"
          >
            <Text style={styles.tokenLabel}>License</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tokenValue} numberOfLines={1}>
                {licenseToken}
              </Text>
            </View>
            <Copy size={16} color={Colors.cosmic.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [daysLeft, isLoaded, isPro, isVerifying, lastError, licenseToken, onCopyActiveToken, onOpenCheckout, refresh, signOutLicense, status]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="pro.screen">
      <LinearGradient
        colors={["#11183A", Colors.cosmic.background]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.kicker}>Licensing</Text>
            <Text style={styles.title}>Go Pro</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>

          {planCard}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activate with license key</Text>
            <Text style={styles.sectionSub}>
              After purchase, paste your license key here to unlock Pro on this device.
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="XXXX.YYYY.ZZZZ…"
                placeholderTextColor={Colors.cosmic.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!isVerifying}
                testID="pro.licenseInput"
              />
              <TouchableOpacity
                style={styles.pasteBtn}
                onPress={onPasteFromClipboard}
                disabled={isVerifying}
                testID="pro.paste"
              >
                <Text style={styles.pasteText}>Paste</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 12 }]}
              onPress={onActivate}
              disabled={isVerifying || input.trim().length < 10}
              testID="pro.activate"
            >
              <View style={styles.btnInner}>
                {isVerifying ? (
                  <ActivityIndicator size="small" color={Colors.cosmic.background} />
                ) : (
                  <Shield size={16} color={Colors.cosmic.background} />
                )}
                <Text style={styles.primaryBtnText}>Verify & Activate</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.hintRow}>
              <Text style={styles.hintText}>
                {Platform.OS === "web"
                  ? "On web, licensing is stored in localStorage via SecureStore polyfill."
                  : "On mobile, licensing is stored securely using SecureStore / AsyncStorage."}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cosmic.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  kicker: {
    color: Colors.cosmic.textMuted,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  title: {
    color: Colors.cosmic.text,
    fontSize: 34,
    fontWeight: "900" as const,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: Colors.cosmic.textSecondary,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: Colors.cosmic.card,
    borderColor: Colors.cosmic.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.cosmic.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  planTitle: {
    color: Colors.cosmic.text,
    fontSize: 16,
    fontWeight: "800" as const,
  },
  planMeta: {
    color: Colors.cosmic.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.cosmic.cardLight,
    borderColor: Colors.cosmic.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: Colors.cosmic.textSecondary,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: "rgba(255,82,82,0.10)",
    borderColor: "rgba(255,82,82,0.35)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  errorTitle: {
    color: Colors.cosmic.error,
    fontWeight: "900" as const,
    marginBottom: 6,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  errorText: {
    color: Colors.cosmic.text,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    backgroundColor: Colors.cosmic.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: Colors.cosmic.background,
    fontWeight: "900" as const,
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: Colors.cosmic.cardLight,
    borderColor: Colors.cosmic.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: Colors.cosmic.text,
    fontWeight: "800" as const,
    fontSize: 14,
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tokenRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cosmic.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tokenLabel: {
    color: Colors.cosmic.textMuted,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  tokenValue: {
    color: Colors.cosmic.text,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  section: {
    marginTop: 6,
    backgroundColor: "rgba(19,24,41,0.55)",
    borderColor: Colors.cosmic.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    color: Colors.cosmic.text,
    fontSize: 15,
    fontWeight: "900" as const,
  },
  sectionSub: {
    color: Colors.cosmic.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  inputWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cosmic.card,
    borderColor: Colors.cosmic.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.cosmic.text,
    fontWeight: "700" as const,
  },
  pasteBtn: {
    backgroundColor: Colors.cosmic.cardLight,
    borderColor: Colors.cosmic.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  pasteText: {
    color: Colors.cosmic.text,
    fontWeight: "800" as const,
    fontSize: 13,
  },
  hintRow: {
    marginTop: 10,
  },
  hintText: {
    color: Colors.cosmic.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
});
