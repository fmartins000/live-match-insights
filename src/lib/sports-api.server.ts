/**
 * API-SPORTS (api-sports.io) integration — multi-sport live data.
 * Requires the API_SPORTS_KEY secret.
 */

export const SPORT_HOSTS = {
  futebol: "v3.football.api-sports.io",
  basquete: "v1.basketball.api-sports.io",
  volei: "v1.volleyball.api-sports.io",
  handebol: "v1.handball.api-sports.io",
  hoquei: "v1.hockey.api-sports.io",
  beisebol: "v1.baseball.api-sports.io",
  nfl: "v1.american-football.api-sports.io",
} as const;

export type Sport = keyof typeof SPORT_HOSTS;

export class MissingSportsKeyError extends Error {
  constructor() {
    super("API_SPORTS_KEY não configurada");
  }
}

async function apiSports(sport: Sport, path: string, params: Record<string, string>) {
  const key = process.env["API_SPORTS_KEY"];
  if (!key) throw new MissingSportsKeyError();

  const host = SPORT_HOSTS[sport];
  const url = `https://${host}${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { headers: { "x-apisports-key": key } });
  if (!res.ok) {
    throw new Error(`Erro na API de dados (${res.status})`);
  }
  const json = (await res.json()) as { response?: unknown; errors?: unknown };
  if (json.errors && Array.isArray(json.errors) === false && Object.keys(json.errors as object).length) {
    throw new Error(`API de dados retornou erro: ${JSON.stringify(json.errors)}`);
  }
  return json.response ?? [];
}

const isFootball = (sport: Sport) => sport === "futebol";

/** Partidas ao vivo do esporte escolhido. */
export async function getLiveMatches(sport: Sport, search?: string) {
  const path = isFootball(sport) ? "/fixtures" : "/games";
  const raw = (await apiSports(sport, path, { live: "all" })) as any[];

  const list = raw.map((item) => {
    if (isFootball(sport)) {
      return {
        id: item.fixture?.id,
        liga: item.league?.name,
        pais: item.league?.country,
        casa: item.teams?.home?.name,
        fora: item.teams?.away?.name,
        placar: `${item.goals?.home ?? 0}-${item.goals?.away ?? 0}`,
        minuto: item.fixture?.status?.elapsed,
        status: item.fixture?.status?.long,
      };
    }
    return {
      id: item.id,
      liga: item.league?.name,
      pais: item.country?.name,
      casa: item.teams?.home?.name,
      fora: item.teams?.away?.name,
      placar: `${item.scores?.home ?? item.scores?.home?.total ?? "?"}-${
        item.scores?.away ?? item.scores?.away?.total ?? "?"
      }`,
      minuto: item.status?.timer,
      status: item.status?.long,
    };
  });

  const filtered = search
    ? list.filter((m) =>
        [m.casa, m.fora, m.liga]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(search.toLowerCase())),
      )
    : list;

  return { total: filtered.length, partidas: filtered.slice(0, 40) };
}

/** Estatísticas + eventos detalhados de uma partida ao vivo. */
export async function getMatchDetails(sport: Sport, matchId: number) {
  if (isFootball(sport)) {
    const [stats, events, fixture] = await Promise.all([
      apiSports(sport, "/fixtures/statistics", { fixture: String(matchId) }),
      apiSports(sport, "/fixtures/events", { fixture: String(matchId) }),
      apiSports(sport, "/fixtures", { id: String(matchId) }),
    ]);
    return { partida: (fixture as any[])[0] ?? null, estatisticas: stats, eventos: events };
  }

  const [game, stats] = await Promise.all([
    apiSports(sport, "/games", { id: String(matchId) }),
    apiSports(sport, "/games/statistics", { id: String(matchId) }).catch(() => []),
  ]);
  return { partida: (game as any[])[0] ?? null, estatisticas: stats };
}

/** Odds ao vivo (mercados e preços) para a partida. */
export async function getLiveOdds(sport: Sport, matchId: number) {
  const path = isFootball(sport) ? "/odds/live" : "/odds";
  const params = isFootball(sport) ? { fixture: String(matchId) } : { game: String(matchId) };
  const raw = (await apiSports(sport, path, params)) as any[];
  return raw.slice(0, 3);
}

/** Confronto direto (histórico) entre dois times — só futebol. */
export async function getHeadToHead(homeId: number, awayId: number) {
  const raw = (await apiSports("futebol", "/fixtures/headtohead", {
    h2h: `${homeId}-${awayId}`,
    last: "10",
  })) as any[];
  return raw.map((item) => ({
    data: item.fixture?.date,
    liga: item.league?.name,
    casa: item.teams?.home?.name,
    fora: item.teams?.away?.name,
    placar: `${item.goals?.home}-${item.goals?.away}`,
  }));
}
