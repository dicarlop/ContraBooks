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

export type EmailSettingsPublic = Omit<EmailSettings, 'password'> & {
  passwordSet: boolean;
};

export function getEmailSettings(): EmailSettingsPublic {
  const stored = store.get('email');
  if (!stored) {
    return {
      host: '',
      port: 587,
      secure: false,
      username: '',
      from: '',
      passwordSet: false,
    };
  }

  return {
    host: stored.host,
    port: stored.port,
    secure: stored.secure,
    username: stored.username,
    from: stored.from,
    passwordSet: Boolean(stored.encryptedPassword),
  };
}

export function getSmtpConfig(): SmtpConfig {
  const stored = store.get('email');
  if (!stored) {
    throw new Error('Email settings are not configured');
  }

  const password = decryptPassword(stored.encryptedPassword);
  if (!password) {
    throw new Error('SMTP password is not available');
  }

  return {
    host: stored.host,
    port: stored.port,
    secure: stored.secure,
    username: stored.username,
    password,
    from: stored.from,
  };
}

export function setEmailSettings(settings: EmailSettings): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure credential storage is unavailable on this system');
  }

  const existing = store.get('email');
  const password = settings.password.trim();

  store.set('email', {
    host: settings.host.trim(),
    port: settings.port,
    secure: settings.secure,
    username: settings.username.trim(),
    encryptedPassword: password
      ? safeStorage.encryptString(password).toString('base64')
      : existing?.encryptedPassword ?? '',
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
