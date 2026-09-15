import test from 'tape';
import {
  decryptCompanyFile,
  encryptCompanyFile,
} from '../companyFileEncryption';

test('company file encryption: round trip', async (t) => {
  const plaintext = Buffer.from('ContraBooks confidential company data');
  const encrypted = await encryptCompanyFile(plaintext, 'correct horse battery staple');
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

  await t.rejects(
    decryptCompanyFile(encrypted, 'wrong-password'),
    /incorrect password or corrupted file/
  );
  t.end();
});

test('company file encryption: tampering fails authentication', async (t) => {
  const encrypted = await encryptCompanyFile(Buffer.from('private data'), 'password');
  encrypted[encrypted.length - 1] ^= 1;

  await t.rejects(
    decryptCompanyFile(encrypted, 'password'),
    /incorrect password or corrupted file/
  );
  t.end();
});

test('company file encryption: missing password is rejected', async (t) => {
  await t.rejects(
    encryptCompanyFile(Buffer.from('private data'), ''),
    /password is required/
  );
  t.end();
});
