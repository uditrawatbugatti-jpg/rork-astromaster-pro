import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";

import { trpcClient } from "@/lib/trpc";

type LicenseStatus =
  | { state: "unknown" }
  | { state: "free" }
  | { state: "pro"; expiresAt: number | null };

type StoredLicense = {
  token: string;
  verifiedAt: number;
  expiresAt: number | null;
};

const STORAGE_KEY = "license_v1";

function safeParseStored(raw: string): StoredLicense | null {
  try {
    const parsed = JSON.parse(raw) as StoredLicense;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.token !== "string" || parsed.token.trim().length < 10) return null;
    if (typeof parsed.verifiedAt !== "number") return null;
    if (parsed.expiresAt != null && typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export const [ProProvider, usePro] = createContextHook(() => {
  const [status, setStatus] = useState<LicenseStatus>({ state: "unknown" });
  const [licenseToken, setLicenseToken] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string>("");

  const verifyToken = useCallback(async (token: string) => {
    setIsVerifying(true);
    setLastError("");
    console.log("[license] verify start");
    try {
      const res = await trpcClient.license.verify.query({ token });
      console.log("[license] verify response", {
        valid: res.valid,
        plan: res.plan,
        expiresAt: res.expiresAt,
      });

      if (!res.valid || res.plan !== "pro") {
        throw new Error("Invalid license");
      }

      const stored: StoredLicense = {
        token,
        verifiedAt: Date.now(),
        expiresAt: res.expiresAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      setLicenseToken(token);
      setStatus({ state: "pro", expiresAt: res.expiresAt });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const message = e instanceof Error ? e.message : "License verification failed";
      console.error("[license] verify error", message);
      setLastError(message);
      setStatus({ state: "free" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw e;
    } finally {
      setIsVerifying(false);
      console.log("[license] verify end");
    }
  }, []);

  const load = useCallback(async () => {
    setLastError("");
    console.log("[license] load start");
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? safeParseStored(raw) : null;

      if (!parsed) {
        setStatus({ state: "free" });
        return;
      }

      setLicenseToken(parsed.token);

      const isExpired = parsed.expiresAt != null && Date.now() > parsed.expiresAt;
      if (isExpired) {
        console.log("[license] stored token expired");
        await AsyncStorage.removeItem(STORAGE_KEY);
        setLicenseToken("");
        setStatus({ state: "free" });
        return;
      }

      const shouldReverify = Date.now() - parsed.verifiedAt > 1000 * 60 * 60 * 24; // 24h
      if (shouldReverify) {
        console.log("[license] reverify due");
        await verifyToken(parsed.token);
      } else {
        setStatus({ state: "pro", expiresAt: parsed.expiresAt });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "License load failed";
      console.error("[license] load error", message);
      setLastError(message);
      setStatus({ state: "free" });
    } finally {
      setIsLoaded(true);
      console.log("[license] load end");
    }
  }, [verifyToken]);

  useEffect(() => {
    load();
  }, [load]);

  const activate = useCallback(
    async (token: string) => {
      const trimmed = token.trim();
      if (trimmed.length < 10) {
        const msg = "Please enter a valid license key";
        setLastError(msg);
        throw new Error(msg);
      }
      await verifyToken(trimmed);
    },
    [verifyToken],
  );

  const signOutLicense = useCallback(async () => {
    console.log("[license] signOut");
    setLastError("");
    await AsyncStorage.removeItem(STORAGE_KEY);
    setLicenseToken("");
    setStatus({ state: "free" });
    Haptics.selectionAsync();
  }, []);

  const isPro = status.state === "pro";

  const daysLeft = useMemo(() => {
    if (status.state !== "pro" || status.expiresAt == null) return null;
    const diff = status.expiresAt - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [status]);

  return {
    status,
    isLoaded,
    isPro,
    daysLeft,
    isVerifying,
    lastError,
    licenseToken,
    activate,
    signOutLicense,
    refresh: load,
  };
});
