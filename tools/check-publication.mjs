/** Defense in depth for this source-only repository. Never print matched values. */
import { readdir, readFile, lstat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
const staged = process.argv.includes('--staged');
const excluded = new Set(['.git','node_modules','dist','__pycache__']);
const sensitiveExtensions = new Set(['.png','.jpg','.jpeg','.webp','.psd','.moc3','.wav','.mp3','.flac','.ogg','.m4a','.onnx','.safetensors','.pt','.pth','.exe','.dll','.zip','.pem','.key','.p12','.pfx','.enevault']);
const findings = [];
const approvedImages = new Set([
  'apps/ene-desktop/public/assets/ene-idle.png',
  'apps/ene-desktop/public/assets/ene-seated.png',
  'apps/ene-desktop/public/assets/ene-prone.png',
  'docs/images/窗口停靠示意.jpg',
]);
const manifestBytes = staged ? execFileSync('git',['show',':asset-manifest.json'],{cwd:root}) : await readFile(resolve(root,'asset-manifest.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const patterns = [
  ['private-key', /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/],
  ['provider-key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['aws-access-id', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['credential-url', /https?:\/\/[^\s/:]+:[^\s/@]+@/],
  ['personal-home-path', /[A-Za-z]:[\\/]Users[\\/](?!Public\b|Default\b)[A-Za-z0-9_.-]+/],
];
async function walk(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(item.name)) continue;
    const path = resolve(dir, item.name);
    if (item.isSymbolicLink()) { findings.push({file:relative(root,path),rule:'symlink-not-allowed'}); continue; }
    if (item.isDirectory()) result.push(...await walk(path)); else result.push(relative(root,path).replaceAll('\\','/'));
  }
  return result;
}
const files = staged ? execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACMR','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean) : await walk(root);
for (const name of files) {
  const lower = name.toLowerCase(), base = lower.split('/').at(-1);
  if ((sensitiveExtensions.has(extname(lower)) && !approvedImages.has(name)) || (base.startsWith('.env') && base !== '.env.example') || /(^|\/)(private|memories|releases|vendor|ene-测试数据)(\/|$)/i.test(name) || /(^|\/)(?:credentials|secrets)(?:[.-]|$)/i.test(name) || (lower.startsWith('runtime/') && !['runtime/dsh/package.json','runtime/dsh/package-lock.json'].includes(lower))) findings.push({file:name,rule:'excluded-publication-file'});
  const full = resolve(root,name);
  if (!(await lstat(full)).isFile()) { findings.push({file:name,rule:'not-a-regular-file'}); continue; }
  const bytes = staged ? execFileSync('git',['show',`:${name}`],{cwd:root,maxBuffer:5*1024*1024}) : await readFile(full);
  if (approvedImages.has(name)) {
    const validFormat = name.endsWith('.png') ? bytes.subarray(0,8).toString('hex') === '89504e470d0a1a0a' : bytes.subarray(0,3).toString('hex') === 'ffd8ff';
    if (bytes.length > 5*1024*1024 || !validFormat || manifest.images[name] !== createHash('sha256').update(bytes).digest('hex')) findings.push({file:name,rule:'unapproved-image-content'});
    continue;
  }
  if (bytes.length > 2*1024*1024 || bytes.includes(0)) { findings.push({file:name,rule:'binary-or-oversize'}); continue; }
  const content = bytes.toString('utf8');
  for (const [rule, pattern] of patterns) if (pattern.test(content)) findings.push({file:name,rule});
  if (base === '.env.example' && content.split(/\r?\n/).some(line => /^[A-Z][A-Z0-9_]*=.+/.test(line))) findings.push({file:name,rule:'nonempty-env-example'});
}
if (findings.length) {
  console.error(JSON.stringify({status:'blocked', filesChecked:files.length, findings},null,2));
  process.exitCode = 1;
} else console.log(JSON.stringify({status:'passed',filesChecked:files.length,scope:staged?'staged-content':'working-tree',note:'Pattern/file checks are not a guarantee; review the staged diff and run a dedicated secret scanner.'}));
