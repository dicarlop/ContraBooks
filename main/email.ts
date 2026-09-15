import net from 'net';
import os from 'os';
import tls from 'tls';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}

export interface SmtpAttachment {
  filename: string;
  content: Uint8Array;
  contentType?: string;
}

export interface SmtpMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  attachments?: SmtpAttachment[];
}

type SmtpSocket = net.Socket | tls.TLSSocket;

export async function sendSmtpMessage(
  config: SmtpConfig,
  message: SmtpMessage
): Promise<void> {
  validateConfig(config, message);

  const socket = await connect(config);
  const client = new SmtpClient(socket);

  try {
    await client.expect(220);
    await client.command(`EHLO ${getHostname()}`, 250);

    if (!config.secure) {
      await client.command('STARTTLS', 220);
      const secureSocket = tls.connect({
        socket,
        host: config.host,
        servername: config.host,
      });
      await waitForSecureConnect(secureSocket);
      client.setSocket(secureSocket);
      await client.command(`EHLO ${getHostname()}`, 250);
    }

    await client.command('AUTH PLAIN ' + createAuthString(config), 235);
    await client.command(`MAIL FROM:<${config.from}>`, 250);

    for (const recipient of allRecipients(message)) {
      await client.command(`RCPT TO:<${recipient}>`, 250, 251);
    }

    await client.command('DATA', 354);
    client.write(buildMimeMessage(config.from, message));
    await client.expect(250);
    await client.command('QUIT', 221, 250);
  } finally {
    client.destroy();
  }
}

class SmtpClient {
  private socket: SmtpSocket;
  private buffer = '';
  private waiters: Array<{
    resolve: (code: number) => void;
    reject: (error: Error) => void;
    codes: number[];
  }> = [];

  constructor(socket: SmtpSocket) {
    this.socket = socket;
    this.attach(socket);
  }

  setSocket(socket: SmtpSocket) {
    this.socket = socket;
    this.buffer = '';
    this.attach(socket);
  }

  write(data: string) {
    this.socket.write(data);
  }

  expect(...codes: number[]): Promise<number> {
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject, codes });
      this.consumeResponses();
    });
  }

  async command(command: string, ...codes: number[]): Promise<number> {
    this.write(command + '\r\n');
    return this.expect(...codes);
  }

  destroy() {
    this.socket.destroy();
  }

  private attach(socket: SmtpSocket) {
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('error', (error) => this.rejectAll(error));
    socket.on('close', () => this.rejectAll(new Error('SMTP connection closed')));
  }

  private onData(chunk: string) {
    this.buffer += chunk;
    this.consumeResponses();
  }

  private consumeResponses() {
    while (true) {
      const newline = this.buffer.indexOf('\n');
      if (newline < 0) return;

      const line = this.buffer.slice(0, newline).replace(/\r$/, '');
      this.buffer = this.buffer.slice(newline + 1);
      const match = /^(\d{3})([ -])/.exec(line);
      if (!match || match[2] === '-') continue;

      const code = Number(match[1]);
      const waiter = this.waiters.shift();
      if (!waiter) continue;

      if (waiter.codes.includes(code)) {
        waiter.resolve(code);
      } else {
        waiter.reject(new Error(`SMTP error ${code}: ${line}`));
      }
    }
  }

  private rejectAll(error: Error) {
    const waiters = this.waiters.splice(0);
    for (const waiter of waiters) waiter.reject(error);
  }
}

function validateConfig(config: SmtpConfig, message: SmtpMessage) {
  if (!config.host.trim()) throw new Error('SMTP host is required');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('SMTP port must be between 1 and 65535');
  }
  if (!config.username.trim()) throw new Error('SMTP username is required');
  if (!config.from.trim()) throw new Error('SMTP from address is required');
  if (allRecipients(message).length === 0) {
    throw new Error('At least one recipient is required');
  }
}

function connect(config: SmtpConfig): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const socket = config.secure
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.connect({ host: config.host, port: config.port });

    const onError = (error: Error) => {
      socket.destroy();
      reject(error);
    };
    const onConnect = () => {
      socket.removeListener('error', onError);
      resolve(socket);
    };

    socket.once('error', onError);
    if (config.secure) {
      (socket as tls.TLSSocket).once('secureConnect', onConnect);
    } else {
      socket.once('connect', onConnect);
    }
    socket.setTimeout(30000, () => onError(new Error('SMTP connection timed out')));
  });
}

function waitForSecureConnect(socket: tls.TLSSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('secureConnect', () => resolve());
    socket.once('error', reject);
  });
}

function createAuthString(config: SmtpConfig) {
  return Buffer.from(`\0${config.username}\0${config.password}`).toString('base64');
}

function allRecipients(message: SmtpMessage) {
  return [...message.to, ...(message.cc ?? []), ...(message.bcc ?? [])].filter(Boolean);
}

function buildMimeMessage(from: string, message: SmtpMessage) {
  const headers = [
    `From: ${from}`,
    `To: ${message.to.join(', ')}`,
    ...(message.cc?.length ? [`Cc: ${message.cc.join(', ')}`] : []),
    `Subject: ${encodeHeader(message.subject)}`,
    'MIME-Version: 1.0',
  ];

  const attachments = message.attachments ?? [];
  if (attachments.length === 0) {
    headers.push('Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit');
    return `${headers.join('\r\n')}\r\n\r\n${dotStuff(message.text)}\r\n.`;
  }

  const boundary = `----ContraBooks-${Date.now().toString(36)}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
    ...attachments.flatMap((attachment) => [
      `--${boundary}`,
      `Content-Type: ${attachment.contentType ?? 'application/octet-stream'}`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename.replace(/["\\\r\n]/g, '_')}"`,
      '',
      wrapBase64(Buffer.from(attachment.content)),
    ]),
    `--${boundary}--`,
    '.',
  ];

  return `${headers.join('\r\n')}\r\n\r\n${dotStuff(body.join('\r\n'))}`;
}

function wrapBase64(data: Buffer) {
  const encoded = data.toString('base64');
  return encoded.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

function dotStuff(value: string) {
  return value.replace(/(^|\r\n)\./g, '$1..');
}

function encodeHeader(value: string) {
  return /^[\x00-\x7F]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
}

function getHostname() {
  return os.hostname();
}
