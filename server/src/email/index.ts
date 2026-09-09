import { env } from '../env';
import { ConsoleEmail } from './console';
import { SmtpEmail } from './smtp';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

export const email: EmailAdapter = env.emailDriver === 'smtp' ? new SmtpEmail() : new ConsoleEmail();
