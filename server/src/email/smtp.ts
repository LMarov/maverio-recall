import nodemailer from 'nodemailer';
import { env } from '../env';
import type { EmailAdapter, EmailMessage } from './index';

export class SmtpEmail implements EmailAdapter {
  private transport;

  constructor() {
    if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
      throw new Error('EMAIL_DRIVER=smtp requires SMTP_HOST, SMTP_USER and SMTP_PASS to be set.');
    }
    this.transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transport.sendMail({ from: env.emailFrom, to: message.to, subject: message.subject, text: message.text });
  }
}
