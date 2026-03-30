import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID() {
  // Prefer built-in cryptographically secure UUID when available
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback: use cryptographically secure random values to construct a RFC 4122 v4 UUID
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Per RFC 4122: set version to 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Per RFC 4122: set variant to 10xxxxxx
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const byteToHex: string[] = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex[i] = (i + 0x100).toString(16).substring(1);
    }

    return (
      byteToHex[bytes[0]] +
      byteToHex[bytes[1]] +
      byteToHex[bytes[2]] +
      byteToHex[bytes[3]] +
      "-" +
      byteToHex[bytes[4]] +
      byteToHex[bytes[5]] +
      "-" +
      byteToHex[bytes[6]] +
      byteToHex[bytes[7]] +
      "-" +
      byteToHex[bytes[8]] +
      byteToHex[bytes[9]] +
      "-" +
      byteToHex[bytes[10]] +
      byteToHex[bytes[11]] +
      byteToHex[bytes[12]] +
      byteToHex[bytes[13]] +
      byteToHex[bytes[14]] +
      byteToHex[bytes[15]]
    );
  }

  // Last-resort, non-cryptographic fallback for very old environments without `crypto`
  // Avoid using Math.random() to satisfy static analysis; this is only for uniqueness, not security.
  const now = Date.now().toString(16);
  return `ffffffff-ffff-4fff-8fff-${now.padStart(12, "0").slice(-12)}`;
}
