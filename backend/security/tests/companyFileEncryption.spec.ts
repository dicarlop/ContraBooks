import test from 'tape';
import {
  decryptCompanyFile,
  encryptCompanyFile,
} from '../companyFileEncryption';

async function expectFailure(
  action: () => Promise<unknown>,
  pattern: RegExp,
  message: string,
  t: test.Test
): Promise<void> {
  try {
    await action();
    t.fail(message);
  } catch (error) {
    t.match(error, pattern, message);
  }
}

test('company file encryption: round trip', async (t) => {
  const plaintext = Buffer.from('ContraBooks confidential company data');
  const encrypted = await encryptCompanyFile(
    plaintext,
    'correct horse battery staple'
  );
  const decrypted = await decryptCompanyFile(
    encrypted,
    'correct horse battery staple'
  );

  t.notEqual(encrypted.toString('hex'), plaintext.toString('hex'));
  t.deepEqual(decrypted, plaintext);
  t.end();
});

test('company file encryption: wrong password fails', async (t) => {
  const encrypted = await encryptCompanyFile(
    Buffer.from('private data'),
    'right-password'
  );

  await expectFailure(
    () => decryptCompanyFile(encrypted, 'wrong-password'),
    /incorrect password or corrupted file/,
    'wrong password should be rejected',
    t
  );
  t.end();
});

test('company file encryption: tampering fails authentication', async (t) => {
  const encrypted = await encryptCompanyFile(
    Buffer.from('private data'),
    'password'
  );
  encrypted[encrypted.length - 1] ^= 1;

  await expectFailure(
    () => decryptCompanyFile(encrypted, 'password'),
    /incorrect password or corrupted file/,
    'tampered ciphertext should be rejected',
    t
  );
  t.end();
});

test('company file encryption: missing password is rejected', async (t) => {
  await expectFailure(
    () => encryptCompanyFile(Buffer.from('private data'), ''),
    /password is required/,
    'missing password should be rejected',
    t
  );
  t.end();
});
