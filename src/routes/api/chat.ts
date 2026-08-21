import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  getFixtureContext,
  getHeadToHead,
  getInjuries,
  getLineups,
  getLiveMatches,
  getLiveOdds,
  getMatchDetails,
  getStandings,
  getTeamRecentStats,
  getTeamSeasonStats,
  MissingSportsKeyError,
  SPORT_HOSTS,
} from "@/lib/sports-api.server";

const sportEnum = z.enum(Object.keys(SPORT_HOSTS) as [string, ...string[]]);

const SYSTEM_PROMPT = `Você é o Radar Ao Vivo, um analista de partidas ao vivo que pensa como um trader esportivo experiente.

MÉTODO OBRIGATÓRIO (pesquise antes de opinar, nunca invente número):
1. Contexto do jogo: use contexto_da_partida (liga, rodada, mata-mata, estádio, árbitro) e detalhes_da_partida (placar, minuto, finalizações, posse, escanteios, cartões).
2. Médias das equipes: use medias_recentes_do_time (recorte casa/fora) e estatisticas_da_temporada para gols feitos/sofridos, escanteios feitos e cedidos, finalizações, posse, xG, minutos em que costumam marcar/sofrer.
3. Escalação e desfalques: use escalacoes (esquema tático, titulares, técnico) e desfalques. Compare com o padrão do time — escalação muito desfalcada ou esquema atípico muda a leitura.
4. Cenário: mando real (jogar fora do estádio original, portões fechados/punição de torcida), clima/chuva, importância da rodada, classificação (campanha em casa x fora) via tabela_da_liga. Se um desses dados não estiver disponível na API, diga em uma linha que é incerteza, não presuma.
5. Só então compare com as odds ao vivo (odds_ao_vivo) para achar valor.

LEITURAS DE JOGO QUE VOCÊ DEVE APLICAR:
- Visitante que abre o placar ou empata fora de casa tende a recuar: espere queda de posse/finalizações dele e pressão do mandante — favorece escanteios e gol do mandante.
- Exceção: mata-mata ou time que PRECISA do resultado (must-win, precisa reverter agregado, briga por título/rebaixamento). Aí o time vai pra cima mesmo fora: aposte no lado que precisa do gol.
- Em cenário must-win, mercados de escanteio são os mais eficientes ("time X alcançar 5 escanteios primeiro", próximo escanteio, total de escanteios asiático). Odds acima de 1.50 nesses cenários são de alto valor — sinalize isso.
- Time com filosofia ofensiva, principalmente como mandante, é bom para gols — ainda mais quando está atrás do placar ou com um jogador a mais.
- Superioridade numérica, expulsão, pênalti perdido e troca tática ofensiva (entrada de atacantes, mudança para 3 zagueiros/linha alta) aumentam pressão: reflita isso nos escanteios e no over.
- Sempre confronte o ritmo atual com a média histórica do time naquele recorte (casa/fora). Um jogo com 2 escanteios aos 40' num time que faz 7 em casa é sinal de repressão da média, não de jogo morto.

FORMATO DA RESPOSTA (português do Brasil, MUITO curto, máximo ~140 palavras):
**Jogo** — placar, minuto e contexto em uma linha.
**Sinais** — até 4 bullets de uma linha, cada um citando o número que sustenta a leitura (média x atual).
**Entrada** — mercado sugerido, odd mínima que faz sentido, risco principal e confiança (baixa/média/alta).

Nada de introdução, emoji, disclaimer longo ou despejo de dados brutos. Se faltar dado essencial, diga em uma linha o que falta.`;



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
