import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// This backend uses installed Windows voices only. No text leaves this machine.
export class SystemSpeech {
  constructor({ helper, directory }) {
    this.helper = helper;
    this.directory = directory;
    this.children = new Set();
    this.generation = 0;
  }
  invoke(command, input) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.helper, [command], {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      this.children.add(child);
      let output = "",
        errors = "";
      const timer = setTimeout(() => child.kill(), 30000);
      child.stdout.setEncoding("utf8").on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.setEncoding("utf8").on("data", (chunk) => {
        errors += chunk;
      });
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timer);
        this.children.delete(child);
        if (code !== 0)
          reject(new Error(errors.trim() || "语音已停止或生成失败。"));
        else {
          try {
            resolve(JSON.parse(output));
          } catch {
            reject(new Error("语音返回格式错误。"));
          }
        }
      });
      child.stdin.on("error", () => {});
      child.stdin.end(
        typeof input === "string" ? input : input ? JSON.stringify(input) : "",
      );
    });
  }
  async voices() {
    return process.platform === "win32" ? this.invoke("voices") : [];
  }
  stop() {
    this.generation++;
    for (const child of this.children) child.kill();
  }
  async play(audio) {
    if (!audio?.startsWith("data:audio/wav;base64,"))
      throw new Error("无效的音频。");
    const generation = this.generation;
    const output = join(this.directory, `${randomUUID()}.wav`);
    try {
      await mkdir(this.directory, { recursive: true });
      await writeFile(output, Buffer.from(audio.split(",")[1], "base64"));
      if (generation === this.generation) await this.invoke("play", output);
    } finally {
      await rm(output, { force: true }).catch(() => {});
    }
  }
  async render({ voice, text, rate = 0 }) {
    if (
      typeof voice !== "string" ||
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 2000 ||
      !Number.isInteger(rate) ||
      rate < -4 ||
      rate > 4
    )
      throw new Error("无效的语音参数。");
    this.stop();
    const generation = this.generation;
    const voices = await this.voices();
    if (generation !== this.generation) return null;
    if (!voices.some((item) => item.id === voice))
      throw new Error("所选音色未安装。");
    await mkdir(this.directory, { recursive: true });
    if (generation !== this.generation) return null;
    const output = join(this.directory, `${randomUUID()}.wav`);
    try {
      await this.invoke("render", { voice, text, rate, output });
      if (generation !== this.generation) return null;
      const bytes = await readFile(output);
      if (bytes.subarray(0, 4).toString() !== "RIFF" || bytes.length <= 44)
        throw new Error("未生成有效音频。");
      return {
        audio: `data:audio/wav;base64,${bytes.toString("base64")}`,
        bytes: bytes.length,
      };
    } finally {
      await rm(output, { force: true }).catch(() => {});
    }
  }
}
