/**
 * Minimal SMTP sink for local/CI end-to-end testing.
 *
 * Accepts real SMTP sessions (EHLO/MAIL/RCPT/DATA/QUIT), stores every message,
 * extracts verification codes and writes them to a JSON file so automated smokes
 * can complete the real OTP delivery path without external providers.
 *
 * Usage: node scripts/dev-smtp-sink.mjs [port] [outFile]
 */
import net from 'node:net';
import fs from 'node:fs';

const port = Number(process.argv[2] ?? 2525);
const outFile = process.argv[3] ?? '/tmp/drustpoll-otp.json';

const store = [];
function persist(message) {
  store.push(message);
  try {
    fs.writeFileSync(outFile, JSON.stringify({ latest: store[store.length - 1], all: store.slice(-20) }, null, 2));
  } catch (error) {
    console.error('smtp-sink persist failed', error);
  }
}

const server = net.createServer((socket) => {
  let buffer = '';
  let inData = false;
  let dataLines = [];
  let current = { to: '', from: '', subject: '', text: '', raw: '' };
  socket.setTimeout(15000);
  const write = (line) => socket.write(line + '\r\n');
  write('220 drustpoll-dev ESMTP ready');

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (inData) {
        if (line === '.') {
          inData = false;
          current.raw = dataLines.join('\n');
          const codeMatch = current.raw.match(/\b(\d{6})\b/);
          current.code = codeMatch ? codeMatch[1] : null;
          const subj = current.raw.match(/^Subject:\s*(.*)$/im);
          if (subj) current.subject = subj[1];
          const body = current.raw.split(/\r?\n\r?\n/).slice(1).join('\n\n');
          current.text = body;
          persist({ ...current, at: new Date().toISOString() });
          console.log(`smtp-sink accepted message to ${current.to}${current.code ? ` code=${current.code}` : ''}`);
          dataLines = [];
          current = { to: '', from: '', subject: '', text: '', raw: '' };
          write('250 2.0.0 Ok: queued');
        } else {
          dataLines.push(line.startsWith('..') ? line.slice(1) : line);
        }
        continue;
      }
      const upper = line.toUpperCase();
      if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
        write('250-drustpoll-dev');
        write('250-8BITMIME');
        write('250 SIZE 52428800');
      } else if (upper.startsWith('MAIL FROM')) {
        current.from = line.slice(line.indexOf(':') + 1).trim();
        write('250 2.1.0 Ok');
      } else if (upper.startsWith('RCPT TO')) {
        current.to = line.slice(line.indexOf(':') + 1).trim();
        write('250 2.1.5 Ok');
      } else if (upper === 'DATA') {
        inData = true;
        write('354 End data with <CR><LF>.<CR><LF>');
      } else if (upper === 'QUIT') {
        write('221 2.0.0 Bye');
        socket.end();
      } else if (upper === 'RSET') {
        current = { to: '', from: '', subject: '', text: '', raw: '' };
        write('250 2.0.0 Ok');
      } else if (upper.startsWith('NOOP')) {
        write('250 2.0.0 Ok');
      } else if (upper.startsWith('STARTTLS')) {
        write('454 4.7.0 TLS not available in dev sink');
      } else if (upper.startsWith('AUTH')) {
        write('235 2.7.0 Authentication successful');
      } else {
        write('250 2.0.0 Ok');
      }
    }
  });
  socket.on('error', () => socket.destroy());
});

server.listen(port, '127.0.0.1', () => console.log(`smtp-sink listening on 127.0.0.1:${port}, writing ${outFile}`));
