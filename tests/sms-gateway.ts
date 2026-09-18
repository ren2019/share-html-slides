// Test-only external SMS boundary. Never imported by the application.
import { createServer } from 'node:http';
const messages = new Map<string, string>();
createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/send') {
    let body = ''; for await (const chunk of request) body += chunk;
    const { phoneNumber, code } = JSON.parse(body);
    messages.set(phoneNumber, code);
    response.writeHead(202).end();
  } else {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ code: messages.get(new URL(request.url!, 'http://localhost').searchParams.get('phone')!) }));
  }
}).listen(3212, '127.0.0.1');
