// Test-only SMTP receiver and HTTP inbox. Never imported by the application.
import { SMTPServer } from 'smtp-server';
import { createServer } from 'node:http';
const messages = new Map<string, string>();
const smtp = new SMTPServer({
  authOptional: false, disabledCommands: ['STARTTLS'],
  onAuth(auth, _session, callback) { callback(null, { user: auth.username }); },
  onData(stream, session, callback) {
    let message = '';
    stream.on('data', chunk => { message += chunk; });
    stream.on('end', () => {
      // Decode the UTF-8 text part produced by Nodemailer.
      const body = message.split('\r\n\r\n').slice(1).join('\r\n\r\n');
      const decoded = /Content-Transfer-Encoding: base64/i.test(message) ? Buffer.from(body, 'base64').toString('utf8') : body.replace(/=\r\n/g, '');
      const code = decoded.match(/\b(\d{6})\b/)?.[1];
      if (code) for (const address of session.envelope.rcptTo) messages.set(address.address.toLowerCase(), code);
      callback();
    });
  },
});
smtp.listen(3224, '127.0.0.1');
createServer((request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ code: messages.get(new URL(request.url!, 'http://localhost').searchParams.get('email')?.toLowerCase() || '') })); }).listen(3213, '127.0.0.1');
