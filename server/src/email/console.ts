import type { EmailAdapter, EmailMessage } from './index';

/** Dev-safe default: no account, no delivery — just logs so you can copy a link/code by hand. */
export class ConsoleEmail implements EmailAdapter {
  async send(message: EmailMessage): Promise<void> {
    console.log('--- EMAIL (EMAIL_DRIVER=console, not actually sent) ---');
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(message.text);
    console.log('---------------------------------------------------------');
  }
}
