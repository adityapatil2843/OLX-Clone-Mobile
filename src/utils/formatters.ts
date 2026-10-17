/**
 * Utility formatters tailored for Indian marketplace use cases.
 */

/**
 * Format a number into Indian Rupees (e.g. ₹1,50,000)
 */
export function formatCurrencyINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format large counts using Indian metrics or standard compact (K, L, Cr)
 */
export function formatCompactCount(count: number): string {
  if (!count || count < 0) return '0';
  if (count >= 10000000) {
    return `${(count / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  }
  if (count >= 100000) {
    return `${(count / 100000).toFixed(1).replace(/\.0$/, '')} L`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
}

/**
 * Format relative date time for listings / messages
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}
