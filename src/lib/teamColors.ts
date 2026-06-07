export const NFL_COLORS: Record<string, { bg: string; text: string }> = {
  ARI: { bg: '#97233F', text: '#FFFFFF' },
  ATL: { bg: '#A71930', text: '#FFFFFF' },
  BAL: { bg: '#241773', text: '#9E7C0C' },
  BUF: { bg: '#00338D', text: '#FFFFFF' },
  CAR: { bg: '#0085CA', text: '#FFFFFF' },
  CHI: { bg: '#0B162A', text: '#C83803' },
  CIN: { bg: '#FB4F14', text: '#FFFFFF' },
  CLE: { bg: '#311D00', text: '#FF3C00' },
  DAL: { bg: '#003594', text: '#FFFFFF' },
  DEN: { bg: '#FB4F14', text: '#FFFFFF' },
  DET: { bg: '#0076B6', text: '#FFFFFF' },
  GB:  { bg: '#203731', text: '#FFB612' },
  HOU: { bg: '#03202F', text: '#FFFFFF' },
  IND: { bg: '#002C5F', text: '#FFFFFF' },
  JAX: { bg: '#006778', text: '#D7A22A' },
  KC:  { bg: '#E31837', text: '#FFFFFF' },
  LAC: { bg: '#0080C6', text: '#FFC20E' },
  LAR: { bg: '#003594', text: '#FFD100' },
  LV:  { bg: '#1A1A1A', text: '#A5ACAF' },
  MIA: { bg: '#008E97', text: '#FFFFFF' },
  MIN: { bg: '#4F2683', text: '#FFC62F' },
  NE:  { bg: '#002244', text: '#FFFFFF' },
  NO:  { bg: '#9F8958', text: '#FFFFFF' },
  NYG: { bg: '#0B2265', text: '#FFFFFF' },
  NYJ: { bg: '#125740', text: '#FFFFFF' },
  PHI: { bg: '#004C54', text: '#FFFFFF' },
  PIT: { bg: '#FFB612', text: '#000000' },
  SEA: { bg: '#002244', text: '#69BE28' },
  SF:  { bg: '#AA0000', text: '#B3995D' },
  TB:  { bg: '#D50A0A', text: '#FFFFFF' },
  TEN: { bg: '#4B92DB', text: '#FFFFFF' },
  WAS: { bg: '#5A1414', text: '#FFB612' },
};

export function teamColor(team: string | null): { bg: string; text: string } {
  if (!team) return { bg: '#27272A', text: '#FFFFFF' };
  return NFL_COLORS[team.toUpperCase()] ?? { bg: '#27272A', text: '#FFFFFF' };
}
