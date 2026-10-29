/** Run local-only DSH checks and display the resulting evidence location. */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, ['--test', 'tests/dsh/integration.test.mjs'], { cwd: root, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(`无法启动验证：${error.message}`); process.exitCode = 1; });
child.on('exit', async code => {
  process.exitCode = code ?? 1;
  if (code !== 0) {
    console.error('验证未通过。若提示本机连接 EACCES，请检查运行环境的回环网络权限。');
    return;
  }
  const report = JSON.parse(await readFile(resolve(root, 'runtime/dsh/m0-latest.json'), 'utf8'));
  const gateway = JSON.parse(await readFile(resolve(root, 'runtime/dsh/gateway-m0-latest.json'), 'utf8'));
  console.log(`\nDSH 接入验证通过。报告：${resolve(root, 'runtime/dsh/m0-latest.json')}`);
  console.log(`请求中途停止耗时：${report.stopMs} ms。仅使用本机合成回复；尚未验证真实模型。`);
  console.log(`兼容 Chat Completions 验证：${gateway.status}；停止耗时 ${gateway.stopMs} ms。报告：${resolve(root, 'runtime/dsh/gateway-m0-latest.json')}`);
  console.log('测试会话为明文合成数据，没有建立正式身份或实现记忆加密。');
});
