// ⚠️ SECURITY NOTE regarding local crypto:
// The static SECRET_KEY and XOR cipher are used as a lightweight obfuscation layer to prevent simple plaintext sniffing from localStorage.
// However, they DO NOT provide robust, industry-grade cryptography (e.g. against targeted local XSS/physical analysis).
// For strict production safety:
// 1. Avoid storing sensitive API credentials (like VITE_TELEGRAM_BOT_TOKEN) in localStorage.
// 2. Transition sensitive actions to secure serverless endpoints (e.g., Supabase Edge Functions) that hold the secrets safely in backend environment variables.
// ⚠️ SECURITY WARNING:
// The static key defined below acts ONLY as an obfuscation layer to prevent direct plaintext local storage inspection.
// It DOES NOT protect against active local XSS or determined physical access analysis.
// To mitigate risks in production:
// 1. Transition all sensitive operations (like Telegram Dispatch) to Supabase Edge Functions.
// 2. Do not store sensitive Telegram tokens or webhook endpoints in client-side LocalStorage.
const DEPRECATED_OBFUSCATION_KEY = 'clickhub_secret_key_10g_network_upgrade';

export const STORAGE_KEYS = {
  TELEGRAM_WEBHOOK_URL: 'ch_tg_wh_enc',
  TELEGRAM_BOT_TOKEN: 'ch_tg_bt_enc',
  TELEGRAM_CHAT_ID: 'ch_tg_ci_enc'
};

/**
 * Encrypts plaintext using XOR cipher with static key for lightweight client-side obfuscation.
 * @deprecated Avoid using for sensitive secrets in high-security production. Use secure server/backend handling instead.
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const charCodes = Array.from(text).map((char, index) => {
    return char.charCodeAt(0) ^ DEPRECATED_OBFUSCATION_KEY.charCodeAt(index % DEPRECATED_OBFUSCATION_KEY.length);
  });
  return charCodes.map(code => code.toString(16).padStart(2, '0')).join('');
}

export function decrypt(cipherHex: string): string {
  if (!cipherHex) return '';
  try {
    const charCodes: number[] = [];
    for (let i = 0; i < cipherHex.length; i += 2) {
      const hex = cipherHex.substring(i, i + 2);
      charCodes.push(parseInt(hex, 16));
    }
    return charCodes.map((code, index) => {
      return String.fromCharCode(code ^ DEPRECATED_OBFUSCATION_KEY.charCodeAt(index % DEPRECATED_OBFUSCATION_KEY.length));
    }).join('');
  } catch (e) {
    console.error('Decryption failed', e);
    return '';
  }
}

export function getEncryptedItem(key: string, oldKey?: string): string {
  const encValue = localStorage.getItem(key);
  if (encValue) {
    return decrypt(encValue);
  }
  if (oldKey) {
    const oldVal = localStorage.getItem(oldKey);
    if (oldVal) {
      // Migrate
      const encrypted = encrypt(oldVal);
      localStorage.setItem(key, encrypted);
      localStorage.removeItem(oldKey);
      return oldVal;
    }
  }
  return '';
}

export function setEncryptedItem(key: string, value: string): void {
  localStorage.setItem(key, encrypt(value));
}
