import { formatCurrencyINR, formatCompactCount, formatRelativeTime } from '../src/utils/formatters';

describe('Utility Formatters', () => {
  describe('formatCurrencyINR', () => {
    it('formats Indian rupees properly without decimals', () => {
      const formatted = formatCurrencyINR(150000);
      expect(formatted).toContain('1,50,000');
    });

    it('handles zero and NaN gracefully', () => {
      expect(formatCurrencyINR(0)).toContain('0');
      expect(formatCurrencyINR(NaN)).toBe('₹0');
    });
  });

  describe('formatCompactCount', () => {
    it('formats thousands, lakhs and crores', () => {
      expect(formatCompactCount(850)).toBe('850');
      expect(formatCompactCount(1500)).toBe('1.5K');
      expect(formatCompactCount(250000)).toBe('2.5 L');
      expect(formatCompactCount(12000000)).toBe('1.2 Cr');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "Just now" for recent timestamps', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('Just now');
    });
  });
});
