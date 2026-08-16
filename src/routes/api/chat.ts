import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  getHeadToHead,
  getLiveMatches,
  getLiveOdds,
  getMatchDetails,
  MissingSportsKeyError,
  SPORT_HOSTS,
} from "@/lib/sports-api.server";

const sportEnum = z.enum(Object.keys(SPORT_HOSTS) as [string, ...string[]]);

const SYSTEM_PROMPT = `Você é o Radar Ao Vivo, um analista de partidas ao vivo orientado a dados.

Como agir:
- Sempre busque os dados reais com as ferramentas antes de opinar. Nunca invente placares, estatísticas ou odds.
- Ao analisar uma partida, cruze: placar e minuto, finalizações e finalizações no alvo, posse, escanteios, cartões, ataques perigosos, ritmo do jogo e momentum recente dos eventos.
- Explique o que os números indicam (ex.: pressão sem gol, jogo travado, time cansado) e quais mercados/leituras fazem sentido, sempre com o raciocínio por trás.
- Destaque riscos e sinais contrários com a mesma clareza dos sinais favoráveis. Dê um nível de confiança (baixo/médio/alto).
- Responda em português do Brasil, com markdown enxuto: um resumo curto, bullets de sinais, e uma seção "Leitura de entrada".
- Encerre análises com um lembrete curto de gestão de banca e que nada é garantia.
- Se faltar dado, diga o que falta em vez de especular.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Mensagens são obrigatórias", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("LOVABLE_API_KEY ausente", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);

        const wrap = async <T>(fn: () => Promise<T>) => {
          try {
            return await fn();
          } catch (error) {
            if (error instanceof MissingSportsKeyError) {
              return {
                erro:
                  "A chave da API de dados esportivos ainda não foi configurada no projeto. Peça ao usuário para adicioná-la.",
              };
            }
            return { erro: error instanceof Error ? error.message : "Falha desconhecida" };
          }
        };

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            partidas_ao_vivo: tool({
              description:
                "Lista as partidas que estão acontecendo agora no esporte indicado. Use para descobrir o ID da partida.",
              inputSchema: z.object({
                esporte: sportEnum.describe("futebol, basquete, volei, handebol, hoquei, beisebol ou nfl"),
                busca: z.string().optional().describe("Filtro por time ou liga"),
              }),
              execute: async ({ esporte, busca }) =>
                wrap(() => getLiveMatches(esporte as never, busca)),
            }),
            detalhes_da_partida: tool({
              description:
                "Estatísticas e eventos detalhados de uma partida ao vivo específica (use o ID retornado por partidas_ao_vivo).",
              inputSchema: z.object({
                esporte: sportEnum,
                id_partida: z.number(),
              }),
              execute: async ({ esporte, id_partida }) =>
                wrap(() => getMatchDetails(esporte as never, id_partida)),
            }),
            odds_ao_vivo: tool({
              description: "Odds/mercados ao vivo disponíveis para a partida.",
              inputSchema: z.object({
                esporte: sportEnum,
                id_partida: z.number(),
              }),
              execute: async ({ esporte, id_partida }) =>
                wrap(() => getLiveOdds(esporte as never, id_partida)),
            }),
            confronto_direto: tool({
              description: "Histórico de confrontos diretos entre dois times de futebol (IDs dos times).",
              inputSchema: z.object({
                id_time_casa: z.number(),
                id_time_fora: z.number(),
              }),
              execute: async ({ id_time_casa, id_time_fora }) =>
                wrap(() => getHeadToHead(id_time_casa, id_time_fora)),
            }),
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
