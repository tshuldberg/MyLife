import type { ExpirationStatus } from '../types';

const DEFAULT_EXPIRING_SOON_DAYS = 3;

export function classifyExpiration(expirationDate: string | null, now?: Date): ExpirationStatus {
  if (expirationDate === null) return 'no_date';

  const days = daysUntilExpiration(expirationDate, now);
  if (days < 0) return 'expired';
  if (days <= DEFAULT_EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'fresh';
}

export function daysUntilExpiration(expirationDate: string, now?: Date): number {
  const today = now ?? new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = expirationDate.split('-').map(Number);
  const expiration = new Date(year, month - 1, day);
  return Math.round((expiration.getTime() - todayDate.getTime()) / 86_400_000);
}

export function getExpirationColor(status: ExpirationStatus): string {
  switch (status) {
    case 'fresh':
      return '#4ECDC4';
    case 'expiring_soon':
      return '#F5A623';
    case 'expired':
      return '#FF6B6B';
    case 'no_date':
      return '#6B6B8A';
  }
}

export function getExpirationLabel(status: ExpirationStatus, daysLeft: number): string {
  switch (status) {
    case 'fresh':
      return `Fresh (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)`;
    case 'expiring_soon':
      return `Expiring soon (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)`;
    case 'expired': {
      const daysAgo = Math.abs(daysLeft);
      return `Expired (${daysAgo} day${daysAgo === 1 ? '' : 's'} ago)`;
    }
    case 'no_date':
      return 'No expiration date';
  }
}
