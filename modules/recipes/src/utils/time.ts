export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return '';

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return hrs === 1 ? '1 hr' : `${hrs} hrs`;
  return `${hrs === 1 ? '1 hr' : `${hrs} hrs`} ${mins} min`;
}
