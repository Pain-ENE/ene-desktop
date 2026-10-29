/** Real DSH runtime tests against a synthetic loopback model. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { EneTestRuntime } from '../../adapters/dsh/runtime.mjs';
import { startMockModel } from './mock-model.mjs';

async function filesUnder(root) {
  const out = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...await filesUnder(path));
    else out.push(path);
  }
  return out;
}

test('local-only configuration rejects remote model endpoints', () => {
  assert.throws(() => new EneTestRuntime({ home: '.', workspace: '.', baseUrl: 'https://example.com' }), /loopback/);
});

for (const transport of ['deepseek-messages', 'compatible-chat']) {
test(`real DSH (${transport}): response, history restore, disabled tools, stop and write inventory`, { timeout: 120000 }, async t => {
  const parent = resolve('runtime/test-runs');
  await mkdir(parent, { recursive: true });
  const runRoot = await mkdtemp(join(parent, 'm0-'));
  const model = await startMockModel();
  const seen = [];
  const options = { home: join(runRoot, 'dsh-home'), workspace: join(runRoot, 'workspace'), baseUrl: model.baseUrl, transport, onEvent: event => seen.push(event) };
  let runtime = new EneTestRuntime(options);
  const report = { mode: 'real_dsh_with_mock_model', transport, encrypted: false, formalIdentity: false, runRoot, checks: [] };
  try {
    {
      const result = await runtime.run('ENE_SYNTHETIC_TOKEN: synthetic fixture only.', { sessionId: 'ene-m0-session' });
      assert.equal(result.text, 'ENE_SYNTHETIC_OK');
      assert.ok(result.eventCount > 0);
      assert.ok(seen.some(event => event.type === 'runtime.notification'));
      assert.ok(model.requests.every(body => !body.tools?.length), 'No model-visible tools should be advertised');
      assert.ok(model.authHeaders.every(value => value === (transport === 'compatible-chat' ? 'Bearer ' : '') + 'ene-synthetic-local-not-a-real-key'));
      assert.ok(model.paths.every(path => path.endsWith(transport === 'compatible-chat' ? '/chat/completions' : '/v1/messages')));
      report.eventTypes = result.eventTypes;
      report.notificationMethods = [...new Set(result.notifications.map(item => item.method))];
      report.checks.push('synthetic_reply', 'notifications', 'no_advertised_tools');
    }
    await runtime.stop();
    {
      runtime = new EneTestRuntime(options);
      const result = await runtime.run('ENE_RESUME_TEST: continue synthetic fixture.', { sessionId: 'ene-m0-session', resume: true });
      assert.equal(result.text, 'ENE_RESUMED_OK');
      const body = model.requests.at(-1);
      assert.ok(JSON.stringify(body.messages).includes('ENE_SYNTHETIC_TOKEN'));
      report.checks.push('history_restore');
    }
    {
      await assert.rejects(runtime.run('ENE_ERROR_TEST', { sessionId: 'ene-m0-error' }), /DSH turn failed/);
      assert.equal(runtime.state, 'failed');
      report.checks.push('provider_failure_is_not_success');
    }
    {
      const requestSeen = model.waitForRequest(body => JSON.stringify(body.messages).includes('ENE_SLOW_TEST'));
      const result = runtime.run('ENE_SLOW_TEST', { sessionId: 'ene-m0-slow' }).then(() => ({ completed: true }), error => ({ error: error.message }));
      await requestSeen;
      const started = performance.now();
      await runtime.stop();
      report.stopMs = Math.round(performance.now() - started);
      assert.equal(runtime.state, 'stopped');
      assert.ok((await result).error, 'Stopped run must not return success');
      await assert.rejects(runtime.run('Do not restart'), /stopped/);
      assert.ok(report.stopMs < 10000, 'SDK stop should be bounded in this fixture');
      report.checks.push('inflight_stop', 'restart_latched');
    }
    const files = await filesUnder(options.home);
    report.files = [];
    for (const file of files) {
      const bytes = await readFile(file);
      report.files.push({ path: file.slice(runRoot.length + 1).replaceAll('\\', '/'), bytes: bytes.length, containsSyntheticMarker: bytes.includes(Buffer.from('ENE_SYNTHETIC_TOKEN')) });
    }
    assert.ok(report.files.some(file => file.containsSyntheticMarker), 'Inventory must find the known plaintext test transcript');
    report.checks.push('plaintext_inventory_detected');
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.error = error.message; throw error;
  } finally {
    report.modelRequestPaths = model.paths;
    await runtime.stop();
    await model.close();
    await writeFile(join(runRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await writeFile(resolve(`runtime/dsh/${transport === 'compatible-chat' ? 'gateway-' : ''}m0-latest.json`), JSON.stringify(report, null, 2) + '\n');
  }
});
}
