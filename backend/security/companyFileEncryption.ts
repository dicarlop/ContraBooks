import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt as scryptCallback,
} from 'crypto';

const VERSION = 1;
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 32 * 1024 * 1024;

const MAGIC = Buffer.from('CBENC', 'ascii');

export interface EncryptedCompanyFile {
  version: number;
  salt: Buffer;
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
}

export function isEncryptedCompanyFile(data: Uint8Array): boolean {
  const buffer = Buffer.from(data);
  return buffer.length >= MAGIC.length && buffer.subarray(0, MAGIC.length).equals(MAGIC);
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: SCRYPT_MAXMEM,
      },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key);
      }
    );
  });
}

export async function encryptCompanyFile(
  plaintext: Uint8Array,
  password: string
): Promise<Buffer> {
  if (!password) {
    throw new Error('Company file password is required');
  }

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(password, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([
    MAGIC,
    Buffer.from([VERSION]),
    salt,
    iv,
    tag,
    ciphertext,
  ]);
}

export async function decryptCompanyFile(
  encrypted: Uint8Array,
  password: string
): Promise<Buffer> {
  if (!password) {
    throw new Error('Company file password is required');
  }

  const data = Buffer.from(encrypted);
  const headerLength =
    MAGIC.length + 1 + SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
  if (
    data.length < headerLength ||
    !data.subarray(0, MAGIC.length).equals(MAGIC)
  ) {
    throw new Error('Invalid encrypted company file');
  }

  const version = data[MAGIC.length];
  if (version !== VERSION) {
    throw new Error(`Unsupported encrypted company file version: ${version}`);
  }

  let offset = MAGIC.length + 1;
  const salt = data.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  const iv = data.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const tag = data.subarray(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;
  const ciphertext = data.subarray(offset);

  try {
    const key = await deriveKey(password, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error(
      'Unable to decrypt company file: incorrect password or corrupted file'
    );
  }
}
