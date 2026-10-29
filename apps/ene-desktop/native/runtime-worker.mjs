import { EneTestRuntime } from "../adapters/dsh/runtime.mjs";
import { startMockModel } from "../test-fixtures/mock-model.mjs";
import { join } from "node:path";
let runtime,
  model,
  closing = false;
const send = (message) => {
  if (process.connected) process.send(message);
};
async function close() {
  if (closing) return;
  closing = true;
  try {
    await runtime?.stop();
    await model?.close();
  } finally {
    process.exit(0);
  }
}
process.on("disconnect", close);
process.on("message", async (message) => {
  if (message.type === "stop") return close();
  if (message.type !== "run" || closing) return;
  try {
    if (!runtime) {
      model = await startMockModel();
      runtime = new EneTestRuntime({
        home: join(message.root, "dsh-home"),
        workspace: join(message.root, "workspace"),
        baseUrl: model.baseUrl,
        transport: "compatible-chat",
      });
    }
    // User text never crosses this boundary. Only synthetic fixture markers persist.
    const result = await runtime.run(
      message.slow
        ? "ENE_SLOW_TEST"
        : "ENE_SYNTHETIC_TOKEN: desktop fixture only.",
    );
    if (result.text !== "ENE_SYNTHETIC_OK")
      throw new Error("Unexpected synthetic reply");
    send({ id: message.id, text: "哼，这个位置视野还不错。想聊什么？" });
  } catch (error) {
    if (!closing) send({ id: message.id, error: error.message });
  }
});
