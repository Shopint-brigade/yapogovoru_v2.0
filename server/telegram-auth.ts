import crypto from "crypto";

interface TelegramAuthData {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies Telegram Login Widget authentication data
 * @param authData - Data received from Telegram Login Widget
 * @param botToken - Your Telegram bot token
 * @returns true if authentication is valid, false otherwise
 */
export function verifyTelegramAuth(
  authData: TelegramAuthData,
  botToken: string
): boolean {
  const { hash, ...data } = authData;

  // Create data check string
  const dataCheckArr = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key as keyof typeof data]}`)
    .join("\n");

  // Create secret key from bot token
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Create hash
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckArr)
    .digest("hex");

  // Compare hashes
  return hmac === hash;
}

/**
 * Checks if Telegram auth data is not too old (default: 1 day)
 * @param authDate - auth_date from Telegram
 * @param maxAgeSeconds - Maximum age in seconds (default: 86400 = 1 day)
 * @returns true if auth is fresh, false if expired
 */
export function isAuthDataFresh(
  authDate: number,
  maxAgeSeconds: number = 86400
): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - authDate < maxAgeSeconds;
}
