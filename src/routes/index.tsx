import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Activity, BarChart3, Radar, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import logo from "@/assets/radar-logo.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";


import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radar Ao Vivo — Analise partidas em tempo real com dados" },
      {
        name: "description",
        content:
          "Converse com um analista de IA que lê estatísticas ao vivo de futebol, basquete e mais para apontar sinais, riscos e a melhor leitura de entrada.",
      },
      { property: "og:title", content: "Radar Ao Vivo — Análise de partidas em tempo real" },
      {
        property: "og:description",
        content: "Sinais, momentum e odds ao vivo explicados por IA, com dados reais das partidas.",
      },
    ],
  }),
  component: Index,
});

const SUGESTOES = [
  { icon: Activity, label: "Quais jogos de futebol estão ao vivo agora?" },
  { icon: BarChart3, label: "Analise o jogo com mais pressão sem gol neste momento" },
  { icon: Trophy, label: "Tem algum basquete ao vivo com ritmo alto?" },
  { icon: Zap, label: "Compare odds ao vivo com as estatísticas do jogo" },
];

function Index() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "Falha ao analisar a partida"),
  });
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const enviar = (texto: string) => {
    const value = texto.trim();
    if (!value || busy) return;
    void sendMessage({ text: value });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden px-4">
      <Toaster position="top-center" />


      <header className="flex shrink-0 items-center gap-3 py-4">
        <img
          src={logo}
          alt="Radar Ao Vivo"
          width={512}
          height={512}
          className="size-10 shrink-0 rounded-xl bg-card p-1.5 glow-card"
        />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">Radar Ao Vivo</h1>
          <p className="truncate text-xs text-muted-foreground">
            Análise de partidas em tempo real, guiada por dados
          </p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          ao vivo
        </span>
      </header>


      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-6 px-0 pb-2">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Radar className="size-8 text-primary" />}
              title="Qual partida você quer ler agora?"
              description="Eu busco estatísticas, eventos e odds ao vivo e traduzo em sinais de entrada."
            >
              <div className="mt-4 grid w-full gap-2 sm:grid-cols-2">
                {SUGESTOES.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => enviar(label)}
                    className="flex items-start gap-2 rounded-xl border border-border bg-card/60 p-3 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    {label}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : null}

          {messages.map((message) => {
            const textParts = message.parts.filter((part) => part.type === "text");
            if (textParts.length === 0) return null;
            return (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {textParts.map((part, index) => (
                    <MessageResponse key={index}>
                      {(part as { text: string }).text}
                    </MessageResponse>
                  ))}
                </MessageContent>
              </Message>
            );
          })}

          {busy ? (
            <Shimmer className="text-sm">Lendo os dados da partida...</Shimmer>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-border/60 bg-background pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            enviar(message.text || input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ex.: analise Flamengo x Palmeiras ao vivo"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() && !busy} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Conteúdo informativo. Nada aqui é garantia — aposte com responsabilidade.
        </p>
      </div>

    </div>
  );
}
