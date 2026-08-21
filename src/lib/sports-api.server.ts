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

/** Médias da temporada de um time numa liga (gols, cartões, formações, casa x fora) — futebol. */
export async function getTeamSeasonStats(teamId: number, leagueId: number, season: number) {
  const raw = (await apiSports("futebol", "/teams/statistics", {
    team: String(teamId),
    league: String(leagueId),
    season: String(season),
  })) as any;
  if (!raw || Array.isArray(raw)) return { erro: "Sem estatísticas de temporada para esse time/liga." };
  return {
    time: raw.team?.name,
    liga: raw.league?.name,
    jogos: raw.fixtures,
    gols: raw.goals,
    media_gols_feitos: raw.goals?.for?.average,
    media_gols_sofridos: raw.goals?.against?.average,
    tempo_dos_gols_feitos: raw.goals?.for?.minute,
    tempo_dos_gols_sofridos: raw.goals?.against?.minute,
    formacoes_mais_usadas: raw.lineups,
    cartoes: raw.cards,
    sequencia: raw.form,
    clean_sheets: raw.clean_sheet,
    falhou_marcar: raw.failed_to_score,
    penaltis: raw.penalty,
  };
}

/** Últimos jogos de um time com estatísticas agregadas (escanteios, finalizações, posse) — futebol. */
export async function getTeamRecentStats(teamId: number, last = 6, venue?: "home" | "away") {
  const fixtures = (await apiSports("futebol", "/fixtures", {
    team: String(teamId),
    last: String(last * (venue ? 2 : 1)),
    status: "FT",
  })) as any[];

  const filtered = venue
    ? fixtures.filter((f) =>
        venue === "home" ? f.teams?.home?.id === teamId : f.teams?.away?.id === teamId,
      )
    : fixtures;

  const chosen = filtered.slice(0, last);

  const detalhes = await Promise.all(
    chosen.map(async (f) => {
      const stats = (await apiSports("futebol", "/fixtures/statistics", {
        fixture: String(f.fixture?.id),
      }).catch(() => [])) as any[];
      const pick = (id: number) =>
        stats.find((s) => s.team?.id === id)?.statistics?.reduce((acc: any, s: any) => {
          acc[s.type] = s.value;
          return acc;
        }, {}) ?? {};
      const eu = pick(teamId);
      const adv = pick(f.teams?.home?.id === teamId ? f.teams?.away?.id : f.teams?.home?.id);
      return {
        data: f.fixture?.date,
        mandante: f.teams?.home?.id === teamId ? "casa" : "fora",
        adversario: f.teams?.home?.id === teamId ? f.teams?.away?.name : f.teams?.home?.name,
        placar: `${f.goals?.home}-${f.goals?.away}`,
        escanteios_feitos: eu["Corner Kicks"] ?? null,
        escanteios_cedidos: adv["Corner Kicks"] ?? null,
        finalizacoes: eu["Total Shots"] ?? null,
        no_alvo: eu["Shots on Goal"] ?? null,
        posse: eu["Ball Possession"] ?? null,
        chances_grandes: eu["Big Chances"] ?? null,
        xg: eu["expected_goals"] ?? null,
      };
    }),
  );

  const avg = (key: keyof (typeof detalhes)[number]) => {
    const nums = detalhes
      .map((d) => Number(String(d[key] ?? "").replace("%", "")))
      .filter((n) => Number.isFinite(n));
    return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : null;
  };

  return {
    amostra: detalhes.length,
    recorte: venue ?? "geral",
    medias: {
      escanteios_feitos: avg("escanteios_feitos"),
      escanteios_cedidos: avg("escanteios_cedidos"),
      finalizacoes: avg("finalizacoes"),
      no_alvo: avg("no_alvo"),
      posse: avg("posse"),
      xg: avg("xg"),
    },
    jogos: detalhes,
  };
}

/** Desfalques (lesões/suspensões) de uma partida ou de um time — futebol. */
export async function getInjuries(params: { fixtureId?: number; teamId?: number; season?: number }) {
  const query: Record<string, string> = {};
  if (params.fixtureId) query["fixture"] = String(params.fixtureId);
  if (params.teamId) query["team"] = String(params.teamId);
  if (params.season) query["season"] = String(params.season);
  const raw = (await apiSports("futebol", "/injuries", query)) as any[];
  return raw.slice(0, 40).map((i) => ({
    time: i.team?.name,
    jogador: i.player?.name,
    motivo: i.player?.reason,
    tipo: i.player?.type,
  }));
}

/** Escalações e esquema tático de uma partida — futebol. */
export async function getLineups(fixtureId: number) {
  const raw = (await apiSports("futebol", "/fixtures/lineups", {
    fixture: String(fixtureId),
  })) as any[];
  return raw.map((l) => ({
    time: l.team?.name,
    esquema: l.formation,
    tecnico: l.coach?.name,
    titulares: (l.startXI ?? []).map((p: any) => `${p.player?.name} (${p.player?.pos})`),
  }));
}

/** Contexto do jogo: estádio, cidade, árbitro, liga, rodada e se é mata-mata — futebol. */
export async function getFixtureContext(fixtureId: number) {
  const raw = (await apiSports("futebol", "/fixtures", { id: String(fixtureId) })) as any[];
  const f = raw[0];
  if (!f) return { erro: "Partida não encontrada" };
  const round: string = f.league?.round ?? "";
  return {
    liga: f.league?.name,
    pais: f.league?.country,
    temporada: f.league?.season,
    rodada: round,
    provavel_mata_mata: /final|semi|quarta|oitava|round of|knockout|playoff/i.test(round),
    estadio: f.fixture?.venue?.name,
    cidade: f.fixture?.venue?.city,
    arbitro: f.fixture?.referee,
    data: f.fixture?.date,
    times: {
      casa: { id: f.teams?.home?.id, nome: f.teams?.home?.name },
      fora: { id: f.teams?.away?.id, nome: f.teams?.away?.name },
    },
    placar: `${f.goals?.home ?? 0}-${f.goals?.away ?? 0}`,
    status: f.fixture?.status,
  };
}

/** Classificação da liga (posição, campanha em casa e fora) — futebol. */
export async function getStandings(leagueId: number, season: number) {
  const raw = (await apiSports("futebol", "/standings", {
    league: String(leagueId),
    season: String(season),
  })) as any[];
  const groups = raw[0]?.league?.standings ?? [];
  return groups.flat().map((t: any) => ({
    posicao: t.rank,
    time: t.team?.name,
    pontos: t.points,
    saldo: t.goalsDiff,
    forma: t.form,
    casa: t.home,
    fora: t.away,
  }));
}
