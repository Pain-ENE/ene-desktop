import { packager } from "@electron/packager";
import { readFile, access } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(
  await readFile(resolve(root, "node_modules/electron/package.json"), "utf8"),
).version;
const archives = resolve(root, "../../runtime/downloads");
const name = `electron-v${version}-win32-x64.zip`;
const official = JSON.parse(
  await readFile(resolve(root, "node_modules/electron/checksums.json"), "utf8"),
)[name];
const hash = createHash("sha256");
for await (const chunk of createReadStream(resolve(archives, name)))
  hash.update(chunk);
if (hash.digest("hex") !== official)
  throw new Error("Official Electron archive checksum mismatch");
await access(resolve(root, "native/host/NODE-LICENSE.txt"));
// Packager's default dependency walker drops npm auto-installed peer dependencies.
// Use npm's resolved production graph, including peers, instead.
const npmCli = resolve(
  dirname(process.execPath),
  "node_modules/npm/bin/npm-cli.js",
);
const productionPaths = new Set(
  execFileSync(
    process.execPath,
    [npmCli, "ls", "--omit=dev", "--all", "--parseable"],
    { cwd: root, encoding: "utf8", windowsHide: true },
  )
    .trim()
    .split(/\r?\n/)
    .map((path) => "/" + relative(root, path).replaceAll("\\", "/")),
);
function ignore(name) {
  if (/\/node_modules\/@[^/]+$/.test(name)) return false;
  if (
    /^\/(src|tests|worker|scripts)(\/|$)/.test(name) ||
    /^\/(AGENTS|design-qa)\.md$/.test(name)
  )
    return true;
  if (
    /\/\.git(\/|$)|\/node_modules\/\.bin(\/|$)|\/\.env($|\.)|lock\.json$/.test(
      name,
    )
  )
    return true;
  const modules = [...name.matchAll(/\/node_modules\/(?:@[^/]+\/)?[^/]+/g)];
  const last = modules.at(-1);
  return last
    ? !productionPaths.has(name.slice(0, last.index + last[0].length))
    : false;
}
const outputs = await packager({
  dir: root,
  out: resolve(root, "../../releases/0.1.0-preview.4"),
  name: "ENE",
  executableName: "ENE",
  platform: "win32",
  arch: "x64",
  electronVersion: version,
  electronZipDir: archives,
  asar: false,
  prune: false,
  overwrite: false,
  ignore,
  appVersion: "0.1.0",
  win32metadata: {
    ProductName: "ENE Desktop Companion",
    FileDescription: "ENE prebirth local demo",
  },
});
console.log(outputs.join("\n"));
