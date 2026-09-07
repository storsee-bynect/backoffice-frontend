export function planDisplayDuration(pkg: any): string {
  return pkg?.billingLabel || durationDaysLabel(Number(pkg?.duration || 0));
}

function durationDaysLabel(days: number): string {
  if (days >= 1460) return '48 Months';
  if (days >= 730) return '24 Months';
  if (days >= 365) return '12 Months';
  if (days >= 180) return '6 Months';
  if (days >= 90) return '3 Months';
  if (days >= 30) return '1 Month';
  if (days > 0) return `${days} days`;
  return 'Plan';
}

/** @deprecated Cycles removed — plans are flat duration list. Kept for compile safety. */
export type BillingCycleId = string;

export const BILLING_CYCLES: { id: BillingCycleId; label: string }[] = [];

export function filterPackagesByCycle(packages: any[], _cycle?: BillingCycleId): any[] {
  return (packages || []).slice().sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || Number(a.amount) - Number(b.amount)
  );
}
