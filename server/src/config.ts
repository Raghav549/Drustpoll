import { strict as assert } from 'node:assert';

function required(name: string): string {
  const value = process.env[name];
  assert(value, `${name} is required`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_PEPPER'),
  passwordPepper: required('PASSWORD_PEPPER'),
  publicOrigin: process.env.PUBLIC_ORIGIN ?? 'https://drustpoll.app',
  secureCookies: process.env.NODE_ENV !== 'development',
};

export const durations = {
  sessionMs: 1000 * 60 * 60 * 24 * 30,
  absoluteSessionMs: 1000 * 60 * 60 * 24 * 180,
  otpMs: 1000 * 60 * 5,
  passwordResetMs: 1000 * 60 * 15,
};
