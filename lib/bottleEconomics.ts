import type { BottleStatus, Fragrance } from '../types/fragrance';
import { formatCurrency } from './journal';

export const ML_PER_SPRAY = 0.1;
export const DEFAULT_SPRAYS_PER_WEAR = 8;
export const ML_PER_WEAR = ML_PER_SPRAY * DEFAULT_SPRAYS_PER_WEAR; // 0.8

const NOT_OWNED_STATUSES: BottleStatus[] = ['wishlist', 'sold', 'gifted'];

export function isOwnedStatus(status: BottleStatus | null | undefined): boolean {
  if (status == null) return true;
  return !NOT_OWNED_STATUSES.includes(status);
}

export function isWearableStatus(status: BottleStatus | null | undefined): boolean {
  if (!isOwnedStatus(status)) return false;
  return status !== 'empty';
}

export function estimatedMlUsed(wearCount: number): number {
  const count = wearCount < 0 ? 0 : wearCount;
  return count * ML_PER_WEAR;
}

export function estimatedRemainingMl(
  bottleSizeMl: number | null | undefined,
  wearCount: number,
): number | null {
  if (bottleSizeMl == null || bottleSizeMl <= 0) return null;
  const used = estimatedMlUsed(wearCount);
  const remaining = bottleSizeMl - used;
  return clamp(remaining, 0, bottleSizeMl);
}

export function fillFraction(
  bottleSizeMl: number | null | undefined,
  wearCount: number,
): number | null {
  if (bottleSizeMl == null || bottleSizeMl <= 0) return null;
  const remaining = estimatedRemainingMl(bottleSizeMl, wearCount);
  if (remaining == null) return null;
  return clamp(remaining / bottleSizeMl, 0, 1);
}

export function costPerWear(
  purchasePrice: number | null | undefined,
  wearCount: number,
): number | null {
  if (purchasePrice == null || purchasePrice <= 0) return null;
  if (wearCount <= 0) return null;
  return purchasePrice / wearCount;
}

export function shelfValueByCurrency(
  fragrances: Fragrance[],
): Array<{ currency: string; total: number; count: number }> {
  const totals = new Map<string, { total: number; count: number }>();

  fragrances.forEach((fragrance) => {
    if (!isOwnedStatus(fragrance.bottle_status)) return;
    const price = fragrance.purchase_price;
    if (price == null || price <= 0) return;
    const currency = fragrance.purchase_currency ?? 'USD';
    const existing = totals.get(currency) ?? { total: 0, count: 0 };
    existing.total += price;
    existing.count += 1;
    totals.set(currency, existing);
  });

  return [...totals.entries()]
    .map(([currency, { total, count }]) => ({ currency, total, count }))
    .sort((a, b) => b.total - a.total);
}

export function formatCostPerWear(value: number | null, currency = 'USD'): string | null {
  if (value == null) return null;
  const formatted = formatCurrency(value, currency);
  if (formatted == null) return null;
  return `${formatted}/wear`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
