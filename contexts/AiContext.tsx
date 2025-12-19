import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

export type AiProviderId = "rork" | "openai" | "gemini" | "anthropic";

export type AiProviderConfig =
  | {
      provider: "rork";
      model: "rork-default";
    }
  | {
      provider: "openai";
      model: "gpt-4o-mini" | "gpt-4o";
      apiKey: string;
    }
  | {
      provider: "gemini";
      model: "gemini-1.5-flash" | "gemini-1.5-pro";
      apiKey: string;
    }
  | {
      provider: "anthropic";
      model: "claude-3-5-sonnet-latest" | "claude-3-5-haiku-latest";
      apiKey: string;
    };

type StoredAiConfig = {
  provider: AiProviderId;
  model: string;
  apiKey?: string;
};

const STORAGE_KEY = "ai_config_v1";

function safeJsonParse(value: string): StoredAiConfig | null {
  try {
    const parsed = JSON.parse(value) as StoredAiConfig;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.provider !== "rork" && parsed.provider !== "openai" && parsed.provider !== "gemini" && parsed.provider !== "anthropic") {
      return null;
    }
    if (typeof parsed.model !== "string") return null;
    if (parsed.apiKey != null && typeof parsed.apiKey !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeConfig(stored: StoredAiConfig | null): AiProviderConfig {
  if (!stored) return { provider: "rork", model: "rork-default" };

  if (stored.provider === "rork") {
    return { provider: "rork", model: "rork-default" };
  }

  if (stored.provider === "openai") {
    const model = stored.model === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini";
    return { provider: "openai", model, apiKey: stored.apiKey ?? "" };
  }

  if (stored.provider === "gemini") {
    const model = stored.model === "gemini-1.5-pro" ? "gemini-1.5-pro" : "gemini-1.5-flash";
    return { provider: "gemini", model, apiKey: stored.apiKey ?? "" };
  }

  const model = stored.model === "claude-3-5-sonnet-latest" ? "claude-3-5-sonnet-latest" : "claude-3-5-haiku-latest";
  return { provider: "anthropic", model, apiKey: stored.apiKey ?? "" };
}

export const [AiProvider, useAi] = createContextHook(() => {
  const [config, setConfig] = useState<AiProviderConfig>({ provider: "rork", model: "rork-default" });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        const parsed = raw ? safeJsonParse(raw) : null;
        const normalized = normalizeConfig(parsed);
        setConfig(normalized);
      } catch (e) {
        console.error("AI config load error:", e instanceof Error ? e.message : e);
        setConfig({ provider: "rork", model: "rork-default" });
      } finally {
        setIsLoaded(true);
      }
    };

    load();
  }, []);

  const saveConfig = useCallback(async (next: AiProviderConfig) => {
    setConfig(next);
    try {
      const stored: StoredAiConfig =
        next.provider === "rork"
          ? { provider: "rork", model: next.model }
          : { provider: next.provider, model: next.model, apiKey: next.apiKey };

      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.error("AI config save error:", e instanceof Error ? e.message : e);
    }
  }, []);

  const isByokConfigured = useMemo(() => {
    if (config.provider === "rork") return true;
    return (config.apiKey ?? "").trim().length > 0;
  }, [config]);

  const redactConfigForLogs = useCallback(() => {
    if (config.provider === "rork") return config;
    return { provider: config.provider, model: config.model, apiKey: "***" };
  }, [config]);

  return {
    config,
    isLoaded,
    isByokConfigured,
    saveConfig,
    redactConfigForLogs,
  };
});
