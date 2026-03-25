import type { ParsedMail } from "mailparser";

export interface ParsedEmailData {
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  subject: string | null;
  fromEmail: string;
  fromName: string;
  toEmails: string[];
  ccEmails: string[];
  textContent: string;
}

export function parseEmail(parsed: ParsedMail): ParsedEmailData {
  const from = parsed.from?.value?.[0];
  const toAddrs = parsed.to
    ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
        .flatMap((t) => t.value.map((v) => v.address).filter(Boolean) as string[])
    : [];
  const ccAddrs = parsed.cc
    ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
        .flatMap((c) => c.value.map((v) => v.address).filter(Boolean) as string[])
    : [];

  // テキスト本文を取得（HTMLの場合はテキスト版にフォールバック）
  let textContent = parsed.text || "";
  if (!textContent && parsed.html) {
    // HTMLからテキストを簡易抽出
    textContent = stripHtml(parsed.html);
  }

  // メール署名の区切り線以降を折りたたみ用にマーク（将来対応）
  textContent = textContent.trim();

  return {
    messageId: parsed.messageId || null,
    inReplyTo: typeof parsed.inReplyTo === "string" ? parsed.inReplyTo : null,
    references: parsed.references
      ? (Array.isArray(parsed.references)
          ? parsed.references.join(" ")
          : parsed.references)
      : null,
    subject: parsed.subject || null,
    fromEmail: from?.address || "unknown@unknown",
    fromName: from?.name || from?.address || "不明",
    toEmails: toAddrs,
    ccEmails: ccAddrs,
    textContent,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
