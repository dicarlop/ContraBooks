import Store from 'electron-store';
import { safeStorage } from 'electron';
import type { SmtpConfig } from './email';

interface StoredEmailSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  encryptedPassword: string;
  from: string;
}

const store = new Store<{ email: StoredEmailSettings }>();

export type EmailSettings = Omit<SmtpConfig, 'password'> & {
  password: string;
};

export function getEmailSettings(): EmailSettings {
  const stored = store.get('email');
  if (!stored) {
    return {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      from: '',
    };
  }

  return {
    host: stored.host,
    port: stored.port,
    secure: stored.secure,
    username: stored.username,
    password: decryptPassword(stored.encryptedPassword),
    from: stored.from,
  };
}

export function setEmailSettings(settings: EmailSettings): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure credential storage is unavailable on this system');
  }

  store.set('email', {
    host: settings.host.trim(),
    port: settings.port,
    secure: settings.secure,
    username: settings.username.trim(),
    encryptedPassword: safeStorage.encryptString(settings.password),
    from: settings.from.trim(),
  });
}

function decryptPassword(value: string): string {
  if (!value || !safeStorage.isEncryptionAvailable()) return '';
  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return '';
  }
}
