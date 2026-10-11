const LADDER: { min: number; title: string }[] = [
  { min: 30, title: 'Hall of Famer' },
  { min: 27, title: 'Cooperstown Bound' },
  { min: 20, title: 'MVP' },
  { min: 13, title: 'All-Star' },
  { min: 7, title: 'Starter' },
  { min: 3, title: 'Call-Up' },
  { min: 0, title: 'Rookie' },
];

export function rankTitle(visited: number): string {
  return (LADDER.find((r) => visited >= r.min) ?? LADDER[LADDER.length - 1]).title;
}
