import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.MAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("MAIL_ENCRYPTION_KEY が設定されていません");
  }
  // 32バイトに正規化（SHA-256ハッシュを使用）
  const { createHash } = require("crypto");
  return createHash("sha256").update(key).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  // iv:tag:encrypted の形式で返す
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const [ivHex, tagHex, encrypted] = ciphertext.split(":");

  if (!ivHex || !tagHex || !encrypted) {
    throw new Error("不正な暗号化データ形式");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
