import fs from 'node:fs';
import path from 'node:path';
import { SessionSchema, type Session } from './schemas';

const AUTH_DIR = path.join(__dirname, '..', '.auth');
const SESSION_FILE = path.join(AUTH_DIR, 'session.json');

/** Browser storage state holding the shared account's token (the web app reads it from localStorage). */
export const STORAGE_STATE = path.join(AUTH_DIR, 'shared.json');

export function saveSession(session: Session, baseURL: string): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session));
  const state = {
    cookies: [],
    origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: 'token', value: session.token }] }],
  };
  fs.writeFileSync(STORAGE_STATE, JSON.stringify(state));
}

export function loadSession(): Session {
  if (!fs.existsSync(SESSION_FILE)) throw new Error('No saved session: run the "setup" project (tests/setup/session.setup.ts) first');
  return SessionSchema.parse(JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')));
}
