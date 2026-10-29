/** Loopback-only Messages/chat fixture. Does not execute model reasoning. */
import http from 'node:http';
import { once } from 'node:events';

export async function startMockModel() {
  const requests = [];
  const paths = [];
  const authHeaders = [];
  const sockets = new Set();
  const pending = new Set();
  let onRequest = () => {};
  const server = http.createServer(async (req, res) => {
    paths.push(req.url);
    const messagesApi = req.url.endsWith('/v1/messages');
    if (req.method !== 'POST' || (!messagesApi && !req.url.endsWith('/chat/completions'))) {
      res.writeHead(404).end('Not found'); return;
    }
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 2_000_000) { res.writeHead(413).end(); return; }
    }
    const body = JSON.parse(raw);
    requests.push(body);
    authHeaders.push(req.headers['x-api-key'] ?? req.headers.authorization);
    onRequest(body);
    // pi-ai may append a separate user-role runtime-context snapshot.
    const last = [...body.messages].reverse().find(message => message.role === 'user' && /ENE_(SYNTHETIC_TOKEN|RESUME_TEST|ERROR_TEST|SLOW_TEST)/.test(JSON.stringify(message.content)));
    const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content ?? '');
    const slow = content.includes('ENE_SLOW_TEST');
    if (content.includes('ENE_ERROR_TEST')) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'Synthetic service unavailable' } }));
      return;
    }
    const reply = content.includes('ENE_RESUME_TEST') ? 'ENE_RESUMED_OK' : 'ENE_SYNTHETIC_OK';
    const usage = { prompt_tokens: 32, completion_tokens: 8, total_tokens: 40, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 32 };
    if (messagesApi) {
      const message = { id: 'ene-test', type: 'message', role: 'assistant', model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 32, output_tokens: 0 } };
      if (!body.stream) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...message, content: [{ type: 'text', text: reply }], stop_reason: 'end_turn', usage: { input_tokens: 32, output_tokens: 8 } }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
      const sendEvent = (type, payload) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...payload })}\n\n`);
      sendEvent('message_start', { message });
      sendEvent('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
      if (slow) {
        pending.add(res); res.on('close', () => pending.delete(res)); return;
      }
      sendEvent('content_block_delta', { index: 0, delta: { type: 'text_delta', text: reply.slice(0, 6) } });
      await new Promise(resolve => setTimeout(resolve, 40));
      sendEvent('content_block_delta', { index: 0, delta: { type: 'text_delta', text: reply.slice(6) } });
      sendEvent('content_block_stop', { index: 0 });
      sendEvent('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 8 } });
      sendEvent('message_stop', {});
      res.end(); return;
    }
    if (!body.stream) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'ene-test', object: 'chat.completion', created: 1, model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }], usage }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    const send = (delta, finish_reason = null, includeUsage = false) => res.write(`data: ${JSON.stringify({ id: 'ene-test', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason }], ...(includeUsage ? { usage } : {}) })}\n\n`);
    send({ role: 'assistant', content: '' });
    if (slow) {
      pending.add(res);
      res.on('close', () => pending.delete(res));
      return;
    }
    send({ content: reply.slice(0, 6) });
    await new Promise(resolve => setTimeout(resolve, 40));
    send({ content: reply.slice(6) });
    send({}, 'stop', true);
    res.end('data: [DONE]\n\n');
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    requests,
    paths,
    authHeaders,
    waitForRequest(predicate, timeout = 10000) {
      if (requests.some(predicate)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { onRequest = () => {}; reject(new Error('Mock model request timed out')); }, timeout);
        onRequest = body => { if (predicate(body)) { clearTimeout(timer); onRequest = () => {}; resolve(); } };
      });
    },
    async close() {
      for (const res of pending) res.destroy();
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    },
  };
}
