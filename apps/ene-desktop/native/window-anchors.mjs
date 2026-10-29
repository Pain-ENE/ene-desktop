import { spawn } from "node:child_process";
import { join } from "node:path";
export class WindowAnchors {
  #follower;
  #known = new Map();
  constructor({ root, ownerPid, onGeometry, onDetach }) {
    Object.assign(this, { root, ownerPid, onGeometry, onDetach });
  }
  #spawn(args) {
    return spawn(join(this.root, "native/window-host.exe"), args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  async list() {
    if (process.platform !== "win32") return [];
    const processHandle = this.#spawn(["list", String(this.ownerPid)]);
    return new Promise((resolve, reject) => {
      let text = "",
        error = "";
      const timer = setTimeout(() => {
        processHandle.kill();
        reject(new Error("窗口列表读取超时。"));
      }, 12000);
      processHandle.stdout.setEncoding("utf8").on("data", (chunk) => {
        text += chunk;
      });
      processHandle.stderr.setEncoding("utf8").on("data", (chunk) => {
        error += chunk;
      });
      processHandle.on("error", reject);
      processHandle.on("exit", (code) => {
        clearTimeout(timer);
        if (code !== 0) return reject(new Error(error || "无法读取窗口位置。"));
        try {
          const entries = JSON.parse(text.trim());
          this.#known = new Map(entries.map((item) => [item.handle, item]));
          resolve(entries.map(({ handle, title }) => ({ handle, title })));
        } catch {
          reject(new Error("窗口列表格式异常。"));
        }
      });
    });
  }
  follow(handle) {
    const entry = this.#known.get(handle);
    if (!entry) throw new Error("请重新选择仍然打开的窗口。");
    this.detach(false);
    const follower = this.#spawn(["follow", handle]);
    this.#follower = follower;
    let buffer = "";
    follower.stdout.setEncoding("utf8").on("data", (chunk) => {
      buffer += chunk;
      let boundary;
      while ((boundary = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 1);
        try {
          const geometry = JSON.parse(line);
          if (this.#follower !== follower) return;
          if (!geometry.visible || geometry.pid !== entry.pid) this.detach();
          else this.onGeometry(geometry);
        } catch {
          this.detach();
        }
      }
    });
    follower.on("error", () => {
      if (this.#follower === follower) this.detach();
    });
    follower.on("exit", () => {
      if (this.#follower === follower) this.detach();
    });
    return entry.title;
  }
  detach(notify = true) {
    const follower = this.#follower;
    this.#follower = undefined;
    follower?.kill();
    if (notify) this.onDetach();
  }
}
