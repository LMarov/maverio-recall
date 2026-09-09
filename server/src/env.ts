import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT || 8787),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || 'maverio.com',

  storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
  localStorageDir: process.env.LOCAL_STORAGE_DIR || './data/audio',
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'recall-audio',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') === 'true'
  },

  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  emailDriver: (process.env.EMAIL_DRIVER || 'console') as 'console' | 'smtp',
  emailFrom: process.env.EMAIL_FROM || 'Maverio Recall <no-reply@maverio.com>',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },

  /** Base URL a human clicks to reach the app — used in emailed links. */
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  /** How long raw meeting audio is kept before the retention job deletes it (transcript/analysis are unaffected). */
  audioRetentionDays: Number(process.env.AUDIO_RETENTION_DAYS || 30),

  /**
   * Picovoice Eagle AccessKey — enables real cross-meeting voice recognition
   * (https://console.picovoice.ai/). Entirely optional: when unset, naming a
   * speaker still works exactly as before, just without voiceprint
   * enrollment/matching.
   */
  picovoiceAccessKey: process.env.PICOVOICE_ACCESS_KEY || ''
};
