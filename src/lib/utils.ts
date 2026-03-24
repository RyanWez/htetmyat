/**
 * Merge class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  const flagMap: Record<string, string> = {
    'US': '🇺🇸', 'JP': '🇯🇵', 'UK': '🇬🇧', 'GB': '🇬🇧',
    'KR': '🇰🇷', 'CN': '🇨🇳', 'TW': '🇹🇼', 'HK': '🇭🇰',
    'SG': '🇸🇬', 'AU': '🇦🇺', 'CA': '🇨🇦', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IN': '🇮🇳', 'TH': '🇹🇭', 'MM': '🇲🇲',
    'VN': '🇻🇳', 'PH': '🇵🇭', 'MY': '🇲🇾', 'ID': '🇮🇩',
  };
  return flagMap[code] || '🌐';
}

/**
 * Format a date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
