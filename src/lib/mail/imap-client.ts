import { ImapFlow } from "imapflow";
import { simpleParser, ParsedMail } from "mailparser";

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
}

export interface FetchedEmail {
  uid: string;
  parsed: ParsedMail;
}

export async function testImapConnection(config: ImapConfig): Promise<boolean> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.tls,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
    return true;
  } catch {
    return false;
  }
}

export async function fetchNewEmails(
  config: ImapConfig,
  lastUid?: string
): Promise<FetchedEmail[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.tls,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  const emails: FetchedEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // lastUid以降のメールを取得（なければ最新10件）
      const range = lastUid ? `${parseInt(lastUid, 10) + 1}:*` : "*";
      const searchCriteria = lastUid
        ? { uid: range }
        : { seen: false };

      let messages;
      try {
        messages = client.fetch(searchCriteria, {
          uid: true,
          source: true,
        });
      } catch {
        // 新着なし
        return emails;
      }

      for await (const msg of messages) {
        // lastUidと同じものはスキップ
        if (lastUid && msg.uid.toString() === lastUid) continue;
        if (!msg.source) continue;

        const parsed = await simpleParser(msg.source) as ParsedMail;
        emails.push({
          uid: msg.uid.toString(),
          parsed,
        });
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    console.error("IMAP fetch error:", error);
    try { await client.logout(); } catch { /* ignore */ }
  }

  return emails;
}
