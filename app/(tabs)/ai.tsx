import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useChart } from "@/contexts/ChartContext";
import { useAi, AiProviderId, AiProviderConfig } from "@/contexts/AiContext";
import { callAi, ChatMessage } from "@/utils/ai/clients";
import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import { Bot, KeyRound, Send, Settings2, Sparkles } from "lucide-react-native";

type UiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatChartContext(input: ReturnType<typeof useChart>["chartData"]) {
  if (!input) return "No birth chart data is available.";

  const planets = input.planets
    .map((p) => {
      const retro = p.isRetrograde ? " (Rx)" : "";
      return `${p.name}: ${p.signName} ${p.degree.toFixed(2)}° | House ${p.house} | Nakshatra ${p.nakshatra} pada ${p.pada}${retro}`;
    })
    .join("\n");

  const topShad = [...input.shadBala]
    .sort((a, b) => b.totalRupas - a.totalRupas)
    .slice(0, 5)
    .map((s) => `${s.planetName}: ${s.totalRupas.toFixed(2)} rupas (${s.strength})`)
    .join("\n");

  const sarva = input.sarvashtakavarga.map((v, i) => `${i + 1}:${v}`).join(" ");

  return [
    `Name: ${input.birthData.name || "Seeker"}`,
    `DOB: ${input.birthData.date.toISOString()}`,
    `Place: ${input.birthData.place || ""} (lat ${input.birthData.latitude}, lon ${input.birthData.longitude}) tz ${input.birthData.timezone}`,
    `Ascendant: ${input.ascendant.toFixed(4)}° | Sign ${input.ascendantSign}`,
    `Kundli Score (existing deterministic): ${input.kundliScore}/100`,
    "",
    "Planets:",
    planets,
    "",
    "Top Shad Bala:",
    topShad,
    "",
    "Dosh (deterministic):",
    `Mangal: ${input.doshAnalysis.hasMangalDosh ? `YES (${input.doshAnalysis.mangalDoshSeverity})` : "NO"} | ${input.doshAnalysis.mangalDoshDetails}`,
    `Shani: ${input.doshAnalysis.hasShaniDosh ? "YES" : "NO"} | ${input.doshAnalysis.shaniDoshDetails}`,
    `Rahu/Ketu: ${input.doshAnalysis.hasRahuKetuDosh ? "YES" : "NO"} | ${input.doshAnalysis.rahuKetuDoshDetails}`,
    "",
    "Sarvashtakavarga (sign:points):",
    sarva,
  ].join("\n");
}

function getSystemPrompt(chartContext: string) {
  return [
    "Role: Senior AI architect + Vedic astrology scholar + Lal Kitab expert + data scientist.",
    "You are AstroGPT. You must be explainable and traceable.",
    "Critical constraints:",
    "- Do NOT override deterministic calculations. Use them as ground truth.",
    "- No vague predictions. No mystical fluff.",
    "- Every claim must cite evidence from the provided chart context: Shad Bala, houses, ashtakavarga, dosh flags, and planet placements.",
    "Output format:",
    "1) Direct answer (concise)",
    "2) Trace (bullet list of exact factors + numbers)",
    "3) Confidence (0-100) and why",
    "4) If remedies requested: safe, minimum-risk Lal Kitab first; warn on potential backfire",
    "",
    "Deterministic chart context:",
    chartContext,
  ].join("\n");
}

function providerLabel(p: AiProviderId) {
  switch (p) {
    case "rork":
      return "Rork";
    case "openai":
      return "ChatGPT";
    case "gemini":
      return "Gemini";
    case "anthropic":
      return "Claude";
  }
}

function defaultModelForProvider(provider: AiProviderId): AiProviderConfig {
  if (provider === "rork") return { provider: "rork", model: "rork-default" };
  if (provider === "openai") return { provider, model: "gpt-4o-mini", apiKey: "" };
  if (provider === "gemini") return { provider, model: "gemini-1.5-flash", apiKey: "" };
  return { provider, model: "claude-3-5-haiku-latest", apiKey: "" };
}

export default function AiScreen() {
  const { chartData } = useChart();
  const { config, saveConfig, isByokConfigured } = useAi();

  const [draftProvider, setDraftProvider] = useState<AiProviderId>(config.provider);
  const [draftModel, setDraftModel] = useState<string>(config.model);
  const [draftKey, setDraftKey] = useState<string>(config.provider === "rork" ? "" : config.apiKey);

  const [composerText, setComposerText] = useState<string>("");
  const [uiMessages, setUiMessages] = useState<UiMessage[]>([
    {
      id: "sys-hello",
      role: "assistant",
      text:
        "Ask a specific question (e.g., 'Why marriage delay?' or 'Which planet is blocking finances?'). I will answer with traceable factors from your chart.",
    },
  ]);

  const [isSending, setIsSending] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  const chartContext = useMemo(() => formatChartContext(chartData), [chartData]);
  const systemPrompt = useMemo(() => getSystemPrompt(chartContext), [chartContext]);

  const rork = useRorkAgent({
    tools: {},
  } as any);

  const setProvider = useCallback(
    (provider: AiProviderId) => {
      setDraftProvider(provider);
      const def = defaultModelForProvider(provider);
      setDraftModel(def.model);
      setDraftKey(def.provider === "rork" ? "" : def.apiKey);
    },
    [setDraftProvider]
  );

  const availableModels = useMemo(() => {
    if (draftProvider === "rork") return [{ id: "rork-default", label: "Rork (auto)" }];
    if (draftProvider === "openai") return [
      { id: "gpt-4o-mini", label: "gpt-4o-mini" },
      { id: "gpt-4o", label: "gpt-4o" },
    ];
    if (draftProvider === "gemini") return [
      { id: "gemini-1.5-flash", label: "gemini-1.5-flash" },
      { id: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    ];
    return [
      { id: "claude-3-5-haiku-latest", label: "claude-3-5-haiku-latest" },
      { id: "claude-3-5-sonnet-latest", label: "claude-3-5-sonnet-latest" },
    ];
  }, [draftProvider]);

  const saveProviderSettings = useCallback(async () => {
    const next: AiProviderConfig =
      draftProvider === "rork"
        ? { provider: "rork", model: "rork-default" }
        : ({
            provider: draftProvider,
            model: draftModel as any,
            apiKey: draftKey,
          } as AiProviderConfig);

    await saveConfig(next);
    setUiMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        text: `Switched to ${providerLabel(next.provider)} (${next.model}).`,
      },
    ]);
  }, [draftKey, draftModel, draftProvider, saveConfig]);

  const send = useCallback(async () => {
    const text = composerText.trim();
    if (!text) return;

    setComposerText("");
    setUiMessages((prev) => [...prev, { id: uid(), role: "user", text }]);

    if (isSending) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsSending(true);

    try {
      if (config.provider === "rork") {
        console.log("AstroGPT using Rork provider");
        const payload = `${systemPrompt}\n\nUser question: ${text}`;
        await rork.sendMessage(payload);

        const last = rork.messages
          .slice()
          .reverse()
          .find((m) => m.role === "assistant");

        const lastText =
          last?.parts
            ?.map((p: any) => (p?.type === "text" ? p.text : ""))
            .filter(Boolean)
            .join("") ??
          "";

        if (!lastText.trim()) {
          setUiMessages((prev) => [...prev, { id: uid(), role: "assistant", text: "I did not get a response. Try again." }]);
          return;
        }

        setUiMessages((prev) => [...prev, { id: uid(), role: "assistant", text: lastText }]);
        return;
      }

      if (!isByokConfigured) {
        setUiMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            text: "This provider needs an API key. Add it in Settings above.",
          },
        ]);
        return;
      }

      console.log("AstroGPT using BYOK provider:", { provider: config.provider, model: config.model });

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...uiMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.text } as ChatMessage)),
        { role: "user", content: text },
      ];

      const reply = await callAi({
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        messages,
        signal: ac.signal,
      });

      setUiMessages((prev) => [...prev, { id: uid(), role: "assistant", text: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("AstroGPT send error:", msg);
      setUiMessages((prev) => [...prev, { id: uid(), role: "assistant", text: `Error: ${msg}` }]);
    } finally {
      setIsSending(false);
    }
  }, [composerText, config, isByokConfigured, isSending, rork, systemPrompt, uiMessages]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Bot size={18} color={Colors.cosmic.background} />
            </View>
            <View>
              <Text style={styles.title}>AstroGPT</Text>
              <Text style={styles.subtitle}>Explainable AI, grounded in your chart</Text>
            </View>
          </View>
          <View style={styles.headerPill}>
            <Sparkles size={14} color={Colors.cosmic.primary} />
            <Text style={styles.headerPillText}>{providerLabel(config.provider)}</Text>
          </View>
        </View>

        <View style={styles.settingsCard} testID="ai.settings">
          <View style={styles.settingsTitleRow}>
            <Settings2 size={16} color={Colors.cosmic.textSecondary} />
            <Text style={styles.settingsTitle}>Model</Text>
          </View>

          <View style={styles.providerRow}>
            {(["rork", "openai", "gemini", "anthropic"] as const).map((p) => {
              const active = draftProvider === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.providerPill, active && styles.providerPillActive]}
                  onPress={() => setProvider(p)}
                  testID={`ai.provider.${p}`}
                >
                  <Text style={[styles.providerPillText, active && styles.providerPillTextActive]}>{providerLabel(p)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.modelRow}>
            {availableModels.map((m) => {
              const active = draftModel === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modelChip, active && styles.modelChipActive]}
                  onPress={() => setDraftModel(m.id)}
                  testID={`ai.model.${m.id}`}
                >
                  <Text style={[styles.modelChipText, active && styles.modelChipTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {draftProvider !== "rork" && (
            <View style={styles.keyRow}>
              <View style={styles.keyLabelRow}>
                <KeyRound size={14} color={Colors.cosmic.textSecondary} />
                <Text style={styles.keyLabel}>API key (stored securely on device)</Text>
              </View>
              <TextInput
                value={draftKey}
                onChangeText={setDraftKey}
                placeholder={`Paste your ${providerLabel(draftProvider)} API key`}
                placeholderTextColor={Colors.cosmic.textMuted}
                style={styles.keyInput}
                secureTextEntry
                autoCapitalize="none"
                testID="ai.apiKey"
              />
            </View>
          )}

          <TouchableOpacity style={styles.saveSettingsButton} onPress={saveProviderSettings} testID="ai.save">
            <Text style={styles.saveSettingsText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent} testID="ai.chat">
          {uiMessages.map((m) => {
            const isUser = m.role === "user";
            return (
              <View key={m.id} style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAi]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                  <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAi]}>{m.text}</Text>
                </View>
              </View>
            );
          })}

          {isSending && (
            <View style={styles.loadingRow} testID="ai.loading">
              <ActivityIndicator color={Colors.cosmic.primary} />
              <Text style={styles.loadingText}>Thinking…</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.composer} testID="ai.composer">
          <TextInput
            value={composerText}
            onChangeText={setComposerText}
            placeholder="Ask about marriage, career, health, remedies…"
            placeholderTextColor={Colors.cosmic.textMuted}
            style={styles.composerInput}
            multiline
            testID="ai.input"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!composerText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={send}
            disabled={!composerText.trim() || isSending}
            testID="ai.send"
          >
            <Send size={18} color={Colors.cosmic.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cosmic.background,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.cosmic.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: Colors.cosmic.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.cosmic.textSecondary,
    marginTop: 2,
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.cosmic.card,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerPillText: {
    color: Colors.cosmic.text,
    fontSize: 12,
    fontWeight: "800" as const,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
    padding: 14,
  },
  settingsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.cosmic.textSecondary,
  },
  providerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  providerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.cosmic.cardLight,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  providerPillActive: {
    backgroundColor: Colors.cosmic.primary,
    borderColor: Colors.cosmic.primary,
  },
  providerPillText: {
    color: Colors.cosmic.text,
    fontSize: 12,
    fontWeight: "800" as const,
  },
  providerPillTextActive: {
    color: Colors.cosmic.background,
  },
  modelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modelChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: Colors.cosmic.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
  },
  modelChipActive: {
    borderColor: Colors.cosmic.secondary,
  },
  modelChipText: {
    color: Colors.cosmic.textSecondary,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  modelChipTextActive: {
    color: Colors.cosmic.text,
  },
  keyRow: {
    marginTop: 12,
  },
  keyLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  keyLabel: {
    fontSize: 12,
    color: Colors.cosmic.textSecondary,
    fontWeight: "700" as const,
  },
  keyInput: {
    backgroundColor: Colors.cosmic.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.cosmic.text,
  },
  saveSettingsButton: {
    marginTop: 12,
    backgroundColor: Colors.cosmic.secondary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveSettingsText: {
    color: Colors.cosmic.background,
    fontWeight: "900" as const,
    fontSize: 13,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAi: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "86%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: Colors.cosmic.primary,
    borderTopRightRadius: 6,
  },
  bubbleAi: {
    backgroundColor: Colors.cosmic.card,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
    borderTopLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextUser: {
    color: Colors.cosmic.background,
    fontWeight: "700" as const,
  },
  bubbleTextAi: {
    color: Colors.cosmic.text,
    fontWeight: "600" as const,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
  },
  loadingText: {
    color: Colors.cosmic.textSecondary,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  composer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cosmic.border,
    backgroundColor: Colors.cosmic.backgroundSecondary,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.cosmic.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cosmic.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.cosmic.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.cosmic.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
