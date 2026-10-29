import { cp, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (process.versions.electron)
  throw new Error("Prepare using standalone Node, not Electron");
await mkdir(resolve(app, "native/host"), { recursive: true });
await cp(
  process.execPath,
  resolve(
    app,
    "native/host",
    process.platform === "win32" ? "node.exe" : "node",
  ),
);
await cp(
  resolve(dirname(process.execPath), "LICENSE"),
  resolve(app, "native/host/NODE-LICENSE.txt"),
);
await mkdir(resolve(app, "adapters/dsh"), { recursive: true });
for (const name of [
  "runtime.mjs",
  "ene-m0.cordis.yml",
  "ene-gateway-m0.cordis.yml",
])
  await cp(
    resolve(app, "../../adapters/dsh", name),
    resolve(app, "adapters/dsh", name),
  );
await mkdir(resolve(app, "test-fixtures"), { recursive: true });
await cp(
  resolve(app, "../../tests/dsh/mock-model.mjs"),
  resolve(app, "test-fixtures/mock-model.mjs"),
);
if (process.platform === "win32") {
  const compiler = resolve(
    process.env.SystemRoot || "C:\\Windows",
    "Microsoft.NET/Framework64/v4.0.30319/csc.exe",
  );
  const result = spawnSync(
    compiler,
    [
      "/nologo",
      "/target:exe",
      `/out:${resolve(app, "native/window-host.exe")}`,
      resolve(app, "native/window-host.cs"),
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.status !== 0)
    throw new Error("Windows geometry helper compilation failed");
  const speech = spawnSync(
    compiler,
    [
      "/nologo",
      "/target:exe",
      `/reference:${resolve(process.env.SystemRoot || "C:/Windows", "Microsoft.NET/assembly/GAC_MSIL/System.Speech/v4.0_4.0.0.0__31bf3856ad364e35/System.Speech.dll")}`,
      "/reference:System.Web.Extensions.dll",
      `/out:${resolve(app, "native/speech-host.exe")}`,
      resolve(app, "native/speech-host.cs"),
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (speech.status !== 0)
    throw new Error("Windows speech helper compilation failed");
}
