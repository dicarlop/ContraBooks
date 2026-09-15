import test from 'tape';
import {
  decryptCompanyFile,
  encryptCompanyFile,
  isEncryptedCompanyFile,
} from '../companyFileEncryption';

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

  try {
    await decryptCompanyFile(encrypted, 'wrong-password');
    t.fail('wrong password should be rejected');
  } catch (error) {
    t.match(String(error), /incorrect password or corrupted file/);
  }
  t.end();
});

test('company file encryption: tampering fails authentication', async (t) => {
  const encrypted = await encryptCompanyFile(
    Buffer.from('private data'),
    'password'
  );
  encrypted[encrypted.length - 1] ^= 1;

  try {
    await decryptCompanyFile(encrypted, 'password');
    t.fail('tampered ciphertext should be rejected');
  } catch (error) {
    t.match(String(error), /incorrect password or corrupted file/);
  }
  t.end();
});

test('company file encryption: missing password is rejected', async (t) => {
  try {
    await encryptCompanyFile(Buffer.from('private data'), '');
    t.fail('missing password should be rejected');
  } catch (error) {
    t.match(String(error), /password is required/);
  }
  t.end();
});

test('company file encryption: format detection', async (t) => {
  const encrypted = await encryptCompanyFile(
    Buffer.from('private data'),
    'password'
  );

  t.ok(isEncryptedCompanyFile(encrypted), 'encrypted files should be detected');
  t.notOk(
    isEncryptedCompanyFile(Buffer.from('SQLite format 3\u0000')),
    'plain SQLite files should not be detected as encrypted'
  );
  t.end();
});
