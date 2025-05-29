export function isDayTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 6 && hour < 23;
}

export function getRefreshInterval(baseInterval: number): number {
  return isDayTime() ? baseInterval : baseInterval * 6; // 6x längre på natten
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export function getDayName(date: Date): string {
  const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  return days[date.getDay()];
}

export function getShortDayName(date: Date): string {
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  return days[date.getDay()];
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

export function getRelativeDay(date: Date): string {
  if (isToday(date)) return 'Idag';
  if (isTomorrow(date)) return 'Imorgon';
  return getShortDayName(date);
}

export function calculateDelay(scheduledTime: string, realTime: string): number {
  const scheduled = new Date(scheduledTime);
  const real = new Date(realTime);
  return Math.round((real.getTime() - scheduled.getTime()) / (1000 * 60));
}

export function getDelayStatus(delay: number): 'onTime' | 'delayed' | 'cancelled' {
  if (delay === -1) return 'cancelled';
  if (delay <= 2) return 'onTime';
  return 'delayed';
}
