/**
 * Client-side device fingerprint generation.
 * Creates a stable hash from browser characteristics to identify devices.
 */

/**
 * Generate a SHA-256 hash from a string.
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract a human-readable device name from the User-Agent string.
 * e.g. "Chrome on Windows", "Safari on iPhone", "Firefox on Android"
 */
export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  
  // Detect OS/Device
  let os = 'Unknown OS';
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('CrOS')) os = 'ChromeOS';
  
  return `${browser} on ${os}`;
}

/**
 * Generate a stable device fingerprint from browser characteristics.
 * This combines multiple signals to create a reasonably unique device identifier.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || '0',
    navigator.maxTouchPoints?.toString() || '0',
    // Platform provides additional device differentiation
    navigator.platform || '',
  ];
  
  const raw = components.join('|||');
  return sha256(raw);
}
