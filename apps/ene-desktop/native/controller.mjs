import { fork, spawn } from "node:child_process";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/** Runs independently of all renderers. Owns the sole DSH worker and stop latch. */
export class RuntimeController {
  #worker;
  #pending = new Map();
  #stopped = false;
  #stopping;
  #busy = false;
  constructor({ workerPath, hostPath = process.execPath, root, onState }) {
    Object.assign(this, { workerPath, hostPath, root, onState });
  }
  get stopped() {
    return this.#stopped;
  }
  get workerPid() {
    return this.#worker?.pid;
  }
  #settle(error) {
    for (const { resolve, timer } of this.#pending.values()) {
      clearTimeout(timer);
      resolve({ error });
    }
    this.#pending.clear();
    this.#busy = false;
  }
  async run({ slow = false } = {}) {
    if (this.#stopped || this.#stopping)
      return { error: "运行已停止，请先重新启用。" };
    if (this.#busy) return { error: "已有演示正在运行。" };
    this.#busy = true;
    if (!this.#worker) {
      const env = {};
      for (const name of [
        "SystemRoot",
        "WINDIR",
        "COMSPEC",
        "PATH",
        "PATHEXT",
        "TEMP",
        "TMP",
        "USERPROFILE",
        "APPDATA",
        "LOCALAPPDATA",
        "HOME",
        "LANG",
        "TZ",
      ])
        if (process.env[name] !== undefined) env[name] = process.env[name];
      env.ELECTRON_RUN_AS_NODE = "1";
      const worker = fork(this.workerPath, [], {
        execPath: this.hostPath,
        execArgv: [],
        env,
        stdio: ["ignore", "ignore", "pipe", "ipc"],
        windowsHide: true,
        detached: process.platform !== "win32",
      });
      let diagnostics = "";
      worker.stderr.setEncoding("utf8").on("data", (chunk) => {
        diagnostics = (diagnostics + chunk).slice(-3000);
      });
      this.#worker = worker;
      worker.on("message", (result) => {
        const pending = this.#pending.get(result.id);
        if (!pending || this.#stopped) return;
        clearTimeout(pending.timer);
        this.#pending.delete(result.id);
        this.#busy = false;
        pending.resolve(result);
        this.onState(result.error ? "failed" : "idle");
      });
      worker.on("error", () => {
        this.#settle("演示进程未能启动。");
        this.onState("failed");
      });
      worker.on("exit", (code) => {
        if (this.#worker === worker) this.#worker = undefined;
        this.#settle(`演示进程已退出 (${code})。${diagnostics}`);
        if (!this.#stopped) this.onState("failed");
      });
    }
    this.onState("running");
    const id = randomUUID();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.stop().catch(() => {});
      }, 45000);
      this.#pending.set(id, { resolve, timer });
      this.#worker.send({
        type: "run",
        id,
        slow,
        root: join(this.root, "synthetic-session"),
      });
    });
  }
  resume() {
    if (this.#stopping) return false;
    this.#stopped = false;
    this.onState("idle");
    return true;
  }
  stop({ force = false } = {}) {
    if (this.#stopping) return this.#stopping;
    this.#stopped = true;
    this.#settle("已停止，迟到回复已丢弃。");
    this.onState("stopping");
    const worker = this.#worker;
    this.#stopping = (async () => {
      if (!worker || worker.exitCode !== null) return;
      await new Promise((resolve, reject) => {
        let finished = false;
        const finish = () => {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve();
          }
        };
        worker.once("exit", finish);
        const hardKill = () => {
          if (process.platform === "win32") {
            const killer = spawn(
              join(
                process.env.SystemRoot || "C:\\Windows",
                "System32/taskkill.exe",
              ),
              ["/PID", String(worker.pid), "/T", "/F"],
              { windowsHide: true, stdio: "ignore" },
            );
            killer.on("error", reject);
            killer.on("exit", (code) => {
              if (code !== 0 && worker.exitCode === null)
                reject(new Error("无法强制停止运行进程。"));
            });
          } else {
            try {
              process.kill(-worker.pid, "SIGKILL");
            } catch (error) {
              if (error.code !== "ESRCH") reject(error);
            }
          }
        };
        const timer = setTimeout(hardKill, force ? 0 : 2500);
        if (worker.connected && !force) worker.send({ type: "stop" });
        setTimeout(() => {
          if (!finished) reject(new Error("停止超时，请退出应用。"));
        }, 6000).unref();
      });
    })()
      .then(
        () => {
          this.onState("stopped");
        },
        (error) => {
          this.onState("stop-failed");
          throw error;
        },
      )
      .finally(() => {
        this.#stopping = undefined;
      });
    return this.#stopping;
  }
}
