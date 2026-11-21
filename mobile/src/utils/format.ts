export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
}

export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || distanceKm === null) return 'Nearby';
  if (distanceKm < 1.0) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

export function calculateDiscountPct(mrpPaise: number, pricePaise: number): number {
  if (mrpPaise <= pricePaise || mrpPaise <= 0) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
