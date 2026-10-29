/** Isolated, local-only DSH adapter for synthetic M0 integration tests. */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const requireRuntime = createRequire(resolve(project, 'runtime/dsh/package.json'));

/** Return only the OS environment needed to start this Windows/macOS process. */
function isolatedEnvironment(baseUrl) {
  const env = {};
  for (const name of ['SystemRoot', 'WINDIR', 'COMSPEC', 'PATH', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOME', 'LANG', 'TZ']) {
    if (process.env[name] !== undefined) env[name] = process.env[name];
  }
  env.DEEPSEEK_API_KEY = 'ene-synthetic-local-not-a-real-key';
  env.DEEPSEEK_BASE_URL = baseUrl;
  env.ENE_GATEWAY_API_KEY = 'ene-synthetic-local-not-a-real-key';
  env.ENE_GATEWAY_BASE_URL = baseUrl;
  env.NO_PROXY = '127.0.0.1,localhost,::1';
  // A packaged desktop worker uses Electron's bundled Node host for the SDK CLI.
  if (process.versions.electron) env.ELECTRON_RUN_AS_NODE = '1';
  return env;
}

/** Drive a real DSH subprocess against an explicitly local synthetic model. */
export class EneTestRuntime {
  #harness;
  #stopped = false;
  #stopTask;
  #busy = false;
  #state = 'created';
  constructor({ home, workspace, baseUrl, transport = 'deepseek-messages', onEvent = () => {} }) {
    const endpoint = new URL(baseUrl);
    if (endpoint.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new Error('M0 accepts an explicit loopback HTTP model endpoint only');
    }
    if (!['deepseek-messages', 'compatible-chat'].includes(transport)) throw new Error('Unsupported synthetic transport');
    this.transport = transport;
    this.home = resolve(home);
    this.workspace = resolve(workspace);
    this.baseUrl = endpoint.href;
    this.onEvent = onEvent;
  }
  get state() { return this.#state; }

  async start() {
    if (this.#stopped) throw new Error('Runtime is stopped; create a new instance to resume explicitly');
    if (this.#harness) return;
    this.#state = 'starting';
    await Promise.all([mkdir(this.home, { recursive: true }), mkdir(this.workspace, { recursive: true })]);
    const { DeepSeekHarness } = await import(pathToFileURL(requireRuntime.resolve('@deepseek-ai/dsh-sdk-client')).href);
    if (this.#stopped) throw new Error('Runtime stopped during startup');
    const harness = new DeepSeekHarness({
      profile: 'sdk-minimal',
      dshHome: this.home,
      cwd: this.workspace,
      processCwd: this.workspace,
      provider: this.transport === 'compatible-chat' ? 'ene-gateway' : 'deepseek-official',
      model: this.transport === 'compatible-chat' ? 'ene-synthetic-chat' : 'deepseek-v4-flash',
      maxTokens: 512,
      patches: [resolve(project, 'adapters/dsh/ene-m0.cordis.yml'), ...(this.transport === 'compatible-chat' ? [resolve(project, 'adapters/dsh/ene-gateway-m0.cordis.yml')] : [])],
      env: isolatedEnvironment(this.baseUrl),
      initializeTimeoutMs: 30000,
      requestTimeoutMs: 15000,
      shutdownTimeoutMs: 500,
      disposeEofGraceMs: 500,
      disposeGraceMs: 2000,
    });
    this.#harness = harness;
    try {
      await harness.start();
      if (this.#stopped) throw new Error('Runtime stopped during handshake');
      this.#state = 'ready';
      this.onEvent({ type: 'runtime.ready' });
    } catch (error) {
      if (!this.#stopped) {
        this.#state = 'failed';
        await harness.close();
        this.#harness = undefined;
      }
      throw error;
    }
  }

  /** A single primary run; concurrent prompts are rejected rather than mixed. */
  async run(text, { sessionId, resume = false } = {}) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('A nonempty text prompt is required');
    if (this.#busy) throw new Error('A run is already active');
    this.#busy = true;
    try {
      await this.start();
      if (this.#stopped) throw new Error('Runtime is stopped');
      this.#state = 'running';
      const session = resume
        ? await this.#harness.resumeSession(sessionId)
        : this.#harness.session(sessionId);
      const result = await session.run(text, { onNotification: notification => this.onEvent({ type: 'runtime.notification', notification }) });
      if (this.#stopped) throw new Error('Run was stopped; discard late output');
      const terminal = result.events.findLast(event => event.type === 'turn/end');
      if (terminal?.data?.reason?.kind === 'error') {
        throw new Error(`DSH turn failed: ${terminal.data.reason.error?.message ?? 'unknown runtime error'}`);
      }
      this.#state = 'ready';
      return { sessionId: result.sessionId, text: result.finalResponse, eventCount: result.events.length, eventTypes: [...new Set(result.events.map(event => event.type))], notifications: result.notifications };
    } catch (error) {
      if (!this.#stopped) this.#state = 'failed';
      throw error;
    } finally {
      this.#busy = false;
    }
  }

  /** Stop through the SDK teardown ladder and latch against implicit restart. */
  stop() {
    if (this.#stopTask) return this.#stopTask;
    this.#stopped = true;
    this.#state = 'stopping';
    this.#stopTask = (async () => {
      try {
        await this.#harness?.close();
        this.#state = 'stopped';
        this.onEvent({ type: 'runtime.stopped' });
      } catch (error) {
        this.#state = 'stop-failed';
        throw error;
      }
    })();
    return this.#stopTask;
  }
}
