import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
}

export interface SendMailOptions {
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
}

export async function sendMail(
  config: SmtpConfig,
  options: SendMailOptions
): Promise<{ messageId: string }> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    tls: config.tls ? { rejectUnauthorized: false } : undefined,
  });

  const from = options.fromName
    ? `"${options.fromName}" <${options.from}>`
    : options.from;

  const info = await transporter.sendMail({
    from,
    to: options.to.join(", "),
    cc: options.cc?.join(", ") || undefined,
    subject: options.subject,
    text: options.text,
    inReplyTo: options.inReplyTo || undefined,
    references: options.references || undefined,
  });

  return { messageId: info.messageId };
}

export async function testSmtpConnection(config: SmtpConfig): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      tls: config.tls ? { rejectUnauthorized: false } : undefined,
    });
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
