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
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || ''
};
