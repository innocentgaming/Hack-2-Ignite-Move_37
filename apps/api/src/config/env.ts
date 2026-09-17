import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load from root .env or app-level
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/internos?schema=public'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DEFAULT_ORGANIZATION_CODE: z.string().default('apex-inst'),
  STORAGE_DRIVER: z.enum(['local', 's3', 'gcs']).default('local'),
  STORAGE_LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  LLM_PROVIDER: z.string().default('openai'),
  LLM_API_KEY: z.string().default('placeholder_not_used_in_phase_0'),
  LLM_MODEL: z.string().default('gpt-4o'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
