import { motionClock, parameters } from "./character-motion.mjs";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  globalShortcut,
  screen,
  nativeImage,
  dialog,
} from "electron";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { RuntimeController } from "./controller.mjs";
import { WindowAnchors } from "./window-anchors.mjs";
import { hitsCharacter } from "./pet-hit-test.mjs";
import { SystemSpeech } from "./speech.mjs";
import { execFileSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const smoke = process.argv.includes("--smoke-test");
const dataRoot = app.isPackaged
  ? join(dirname(app.getPath("exe")), "ENE-测试数据")
  : resolve(root, "../../runtime/desktop-dev");
app.setPath("userData", join(dataRoot, "shell"));
app.setName("ENE");
if (!app.requestSingleInstanceLock()) app.quit();
let controller,
  speech,
  anchors,
  tray,
  quitting = false,
  dragging,
  manualChat = false;
const windows = new Map();
const surfaceSizes = new Map();
let state = {
  motionEnabled: true,
  motionActive: false,
  motionOrigin: Date.now(),
  phase: "idle",
  scale: 0.8,
  pose: "idle",
  chatVisible: false,
  bubbleVisible: false,
  bubbleText: "哼，这个位置视野还不错。",
  stopShortcutAvailable: false,
  engineVersion: "0.2.2-alpha.2",
  workerPid: null,
  restEnabled: false,
  speechEnabled: false,
  speechVoice: "",
  speechRate: 0,
  speechEpoch: 0,
  speechStatus: "idle",
  speechError: "",
};
let lastInteraction = Date.now(),
  resting = false;
async function speak(text) {
  const epoch = state.speechEpoch + 1;
  broadcast({
    speechEpoch: epoch,
    speechStatus: "generating",
    speechAudio: null,
    speechError: "",
  });
  try {
    const result = await speech.render({
      voice: state.speechVoice,
      rate: state.speechRate,
      text,
    });
    if (result && epoch === state.speechEpoch && !controller.stopped) {
      broadcast({ speechStatus: "playing" });
      await speech.play(result.audio);
      if (epoch === state.speechEpoch) broadcast({ speechStatus: "idle" });
    }
  } catch (error) {
    if (epoch === state.speechEpoch)
      broadcast({ speechStatus: "error", speechError: error.message });
  }
}
function stopSpeech() {
  speech?.stop();
  broadcast({
    speechEpoch: state.speechEpoch + 1,
    speechAudio: null,
    speechStatus: "idle",
  });
}
async function restNow() {
  if (
    resting ||
    controller.stopped ||
    state.phase !== "idle" ||
    dragging ||
    state.chatVisible ||
    state.anchorTitle
  )
    return false;
  resting = true;
  try {
    await changePose(state.pose === "prone" ? "seated" : "prone");
    if (controller.stopped) return false;
    const pet = windows.get("pet"),
      a = areaFor(pet),
      b = pet.getContentBounds();
    movePetTo(
      Math.min(a.x + a.width - b.width - 24, Math.max(a.x + 24, b.x)),
      a.y + a.height - b.height - 16,
    );
    positionAccessories();
    return true;
  } finally {
    resting = false;
    lastInteraction = Date.now();
  }
}
let hitImage,
  mousePassthrough = false,
  ignored = false;
const boundsFor = (scale, pose = state.pose) => ({
  width: Math.round((pose === "prone" ? 600 : 400) * scale),
  height: Math.round((pose === "prone" ? 400 : 600) * scale),
});
function moveSurface(surface, x, y) {
  windows.get(surface)?.setContentBounds({
    x: Math.round(x),
    y: Math.round(y),
    ...surfaceSizes.get(surface),
  });
}
async function changePose(pose) {
  const pet = windows.get("pet"),
    previous = pet.getContentBounds();
  const next = boundsFor(state.scale, pose);
  pet.setResizable(true);
  pet.setContentSize(next.width, next.height);
  await new Promise((resolve) => setTimeout(resolve, 100));
  pet.setResizable(false);
  broadcast({ pose });
  tray?.setContextMenu(contextMenu());
  updateHitRegion();
  movePetTo(
    previous.x + (previous.width - next.width) / 2,
    previous.y + (previous.height - next.height) / 2,
  );
  clampWindow(pet);
  positionAccessories();
}
function movePetTo(x, y) {
  windows.get("pet").setContentBounds({
    x: Math.round(x),
    y: Math.round(y),
    ...boundsFor(state.scale),
  });
}
let bubbleTimer;
function hideBubble() {
  clearTimeout(bubbleTimer);
  windows.get("bubble")?.hide();
  broadcast({ bubbleVisible: false });
}
function scheduleBubbleHide() {
  clearTimeout(bubbleTimer);
  if (state.bubbleVisible) bubbleTimer = setTimeout(hideBubble, 5000);
}
function showSpeech(text) {
  if (state.chatVisible || controller.stopped) return;
  broadcast({ bubbleText: text, bubbleVisible: true });
  positionAccessories();
  windows.get("bubble")?.showInactive();
  scheduleBubbleHide();
}
function openHistory() {
  hideBubble();
  positionAccessories();
  windows.get("chat").show();
  windows.get("controls").showInactive();
  broadcast({ chatVisible: true });
}
function closeHistory() {
  windows.get("chat").hide();
  windows.get("controls").hide();
  broadcast({ chatVisible: false });
}
function broadcast(patch = {}) {
  state = { ...state, ...patch };
  for (const window of windows.values())
    if (!window.isDestroyed()) window.webContents.send("ene:state", state);
}
function areaFor(window) {
  return screen.getDisplayMatching(window.getBounds()).workArea;
}
function clampWindow(window) {
  const isPet = window === windows.get("pet");
  const b = isPet ? window.getContentBounds() : window.getBounds();
  const a = areaFor(window);
  const x = Math.round(Math.max(a.x, Math.min(b.x, a.x + a.width - b.width)));
  const y = Math.round(Math.max(a.y, Math.min(b.y, a.y + a.height - b.height)));
  if (isPet) movePetTo(x, y);
  else {
    const surface = [...windows.entries()].find(
      ([, candidate]) => candidate === window,
    )?.[0];
    if (surfaceSizes.has(surface)) moveSurface(surface, x, y);
    else window.setPosition(x, y);
  }
}
function positionAccessories({ resetChat = false } = {}) {
  const pet = windows.get("pet");
  if (!pet) return;
  const b = pet.getBounds(),
    a = areaFor(pet);
  const controls = windows.get("controls");
  if (controls)
    moveSurface(
      "controls",
      Math.round(
        Math.min(a.x + a.width - 264, Math.max(a.x, b.x + b.width - 264)),
      ),
      Math.round(Math.min(a.y + a.height - 78, b.y + b.height - 8)),
    );
  const bubble = windows.get("bubble");
  if (bubble)
    moveSurface(
      "bubble",
      Math.round(b.x - 242),
      Math.round(b.y + b.height * 0.18),
    );
  if (bubble) clampWindow(bubble);
  if (resetChat || !manualChat) {
    const chat = windows.get("chat");
    if (chat) moveSurface("chat", Math.round(b.x - 330), Math.round(b.y + 24));
    if (chat) clampWindow(chat);
  }
}
function updateHitRegion() {
  const image = nativeImage.createFromPath(
    join(root, `public/assets/ene-${state.pose}.png`),
  );
  const { width, height } = image.getSize(1);
  const bitmap = image.toBitmap({ scaleFactor: 1 });
  if (!width || !height || bitmap.length !== width * height * 4)
    throw new Error("Invalid character bitmap dimensions");
  hitImage = { bitmap, width, height };
}
function setPassthrough(value) {
  if (mousePassthrough === value) return;
  windows.get("pet").setIgnoreMouseEvents(value, { forward: true });
  mousePassthrough = value;
}
function updateMousePassthrough() {
  if (dragging || !hitImage || !windows.has("pet")) return;
  if (ignored) {
    setPassthrough(true);
    return;
  }
  const pet = windows.get("pet");
  if (pet.isDestroyed()) return;
  setPassthrough(
    !hitsCharacter(
      hitImage,
      pet.getContentBounds(),
      screen.getCursorScreenPoint(),
      24,
      { pose: state.pose, params: parameters(motionClock(state.motionOrigin), state.motionEnabled && state.motionActive && !["stopped", "stopping"].includes(state.phase), state.speechStatus === "playing") },
    ),
  );
}
async function createSurface(surface, options = {}) {
  surfaceSizes.set(surface, {
    width: options.width ?? 420,
    height: options.height ?? 320,
  });
  const window = new BrowserWindow({
    width: 420,
    height: 320,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    title: `ENE · ${surface}`,
    ...options,
    webPreferences: {
      preload: join(root, "native/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
    },
  });
  windows.set(surface, window);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.on("page-title-updated", (event) => event.preventDefault());
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  window.webContents.on("did-finish-load", () =>
    window.webContents.send("ene:state", state),
  );
  window.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      window.hide();
      if (surface === "chat") closeHistory();
    }
  });
  await window.loadFile(join(root, "dist/client/index.html"), {
    query: { surface },
  });
  return window;
}
async function emergencyStop(force = false) {
  stopSpeech();
  broadcast({ restEnabled: false });
  hideBubble();
  anchors?.detach();
  try {
    await controller.stop({ force });
  } catch (error) {
    dialog.showErrorBox("停止未完成", error.message);
  }
}
function contextMenu() {
  return Menu.buildFromTemplate([
    {
      label: "查看历史与聊天",
      click: openHistory,
    },
    { label: "设置…", click: () => dispatch("settings") },
    {
      label: "姿态",
      submenu: [
        ["idle", "站立"],
        ["seated", "坐姿"],
        ["prone", "趴着"],
      ].map(([value, label]) => ({
        label,
        type: "radio",
        checked: state.pose === value,
        click: () => dispatch("pose", value),
      })),
    },
    { label: "找回角色", click: () => dispatch("reset-position") },
    {
      label: "点击穿透",
      type: "checkbox",
      checked: ignored,
      click: (item) => {
        ignored = item.checked;
        setPassthrough(ignored);
      },
    },
    { type: "separator" },
    {
      label: "停止全部活动",
      accelerator: "CommandOrControl+Shift+.",
      click: () => emergencyStop(),
    },
    {
      label: "重新启用",
      enabled: state.phase === "stopped",
      click: () => controller.resume(),
    },
    { type: "separator" },
    { label: "退出 ENE", click: () => app.quit() },
  ]);
}
async function dispatch(action, value) {
  if (!["state", "bubble-height", "bubble-hold"].includes(action))
    lastInteraction = Date.now();
  const pet = windows.get("pet");
  switch (action) {
    case "rest-enabled":
      if (typeof value !== "boolean" || controller.stopped)
        throw new Error("请先重新启用。");
      broadcast({ restEnabled: value });
      break;
    case "rest-now":
      return { ok: await restNow() };
    case "speech-voices":
      return speech.voices();
    case "speech-config": {
      if (
        !value ||
        typeof value.enabled !== "boolean" ||
        typeof value.voice !== "string" ||
        !Number.isInteger(value.rate) ||
        value.rate < -4 ||
        value.rate > 4
      )
        throw new Error("无效的语音设置。");
      const voices = await speech.voices();
      if (!voices.some((voice) => voice.id === value.voice))
        throw new Error("请选择已安装音色。");
      stopSpeech();
      broadcast({
        speechEnabled: value.enabled,
        speechVoice: value.voice,
        speechRate: value.rate,
      });
      break;
    }
    case "speech-test":
      if (controller.stopped) throw new Error("请先重新启用。");
      void speak("哼，才不是特意在等你。只是刚好有空而已。记得休息，笨蛋。");
      break;
    case "speech-stop":
      stopSpeech();
      break;
    case "speech-sample": {
      if (
        ![
          "system-huihui",
          "aishell3-10",
          "aishell3-33",
          "aishell3-99",
        ].includes(value) ||
        controller.stopped
      )
        throw new Error("试听不可用。");
      stopSpeech();
      const epoch = state.speechEpoch;
      const { readFile } = await import("node:fs/promises");
      const bytes = await readFile(
        join(root, "public/assets/voice-tests", `${value}.wav`),
      );
      if (epoch !== state.speechEpoch || controller.stopped) break;
      broadcast({ speechStatus: "playing", speechError: "" });
      void speech
        .play(`data:audio/wav;base64,${bytes.toString("base64")}`)
        .then(() => {
          if (epoch === state.speechEpoch) broadcast({ speechStatus: "idle" });
        })
        .catch((error) => {
          if (epoch === state.speechEpoch)
            broadcast({ speechStatus: "error", speechError: error.message });
        });
      break;
    }
    case "motion-active":
      state.motionActive = value === true;
      break;
    case "motion-enabled":
      broadcast({ motionEnabled: value === true });
      break;
    case "state":
      return state;
    case "windows":
      return anchors.list();
    case "anchor":
      if (state.phase === "stopped" || state.phase === "stopping")
        throw new Error("请先重新启用。");
      if (typeof value !== "string") throw new Error("Invalid window");
      await changePose("seated");
      broadcast({ anchorTitle: anchors.follow(value) });
      break;
    case "detach":
      anchors.detach();
      break;
    case "send": {
      stopSpeech();
      closeHistory();
      const result = await controller.run();
      if (result.text) showSpeech(result.text);
      if (result.text && state.speechEnabled && !controller.stopped)
        void speak(result.text);
      else if (!controller.stopped) openHistory();
      return result;
    }
    case "open-history":
      openHistory();
      break;
    case "bubble-hold":
      if (value === true) clearTimeout(bubbleTimer);
      else scheduleBubbleHide();
      break;
    case "bubble-height": {
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new Error("Invalid height");
      windows
        .get("bubble")
        .setContentSize(248, Math.max(60, Math.min(156, Math.ceil(value))));
      surfaceSizes.set("bubble", {
        width: 248,
        height: Math.max(60, Math.min(156, Math.ceil(value))),
      });
      positionAccessories();
      break;
    }
    case "stop":
      await emergencyStop();
      return { ok: state.phase === "stopped" };
    case "resume":
      return { ok: controller.resume() };
    case "chat": {
      state.chatVisible ? closeHistory() : openHistory();
      break;
    }
    case "settings": {
      let settings = windows.get("settings");
      if (!settings)
        settings = await createSurface("settings", {
          width: 460,
          height: 740,
          skipTaskbar: false,
        });
      settings.show();
      break;
    }
    case "close-settings":
      windows.get("settings")?.hide();
      break;
    case "scale":
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0.55 ||
        value > 1.2
      )
        throw new Error("Invalid scale");

      pet.setResizable(true);
      pet.setContentSize(boundsFor(value).width, boundsFor(value).height);
      await new Promise((resolve) => setTimeout(resolve, 150));
      pet.setResizable(false);
      broadcast({ scale: value });
      updateHitRegion();
      clampWindow(pet);
      positionAccessories();
      break;
    case "pose":
      if (!["idle", "seated", "prone"].includes(value))
        throw new Error("Invalid pose");
      anchors.detach();
      await changePose(value);
      break;
    case "reset-position": {
      anchors?.detach();
      const a = screen.getDisplayNearestPoint(
        screen.getCursorScreenPoint(),
      ).workArea;
      movePetTo(
        a.x + a.width - pet.getBounds().width - 40,
        a.y + a.height - pet.getBounds().height - 90,
      );
      ignored = false;
      setPassthrough(false);
      manualChat = false;
      clampWindow(pet);
      positionAccessories({ resetChat: true });
      pet.showInactive();
      break;
    }
    case "drag-start":
      if (state.phase === "stopped" || state.phase === "stopping") break;
      if (!validPoint(value)) throw new Error("Invalid position");
      anchors.detach();
      dragging = {
        pointer: screen.getCursorScreenPoint(),
        bounds: pet.getContentBounds(),
      };
      setPassthrough(false);
      break;
    case "drag-move":
      if (dragging && validPoint(value)) {
        const pointer = screen.getCursorScreenPoint();
        movePetTo(
          dragging.bounds.x + pointer.x - dragging.pointer.x,
          dragging.bounds.y + pointer.y - dragging.pointer.y,
        );
        positionAccessories();
      }
      break;
    case "drag-end":
      dragging = undefined;
      clampWindow(pet);
      positionAccessories();
      break;
    case "menu":
      contextMenu().popup({ window: pet });
      break;
    case "demo-window": {
      let practice = windows.get("practice");
      if (!practice)
        practice = await createSurface("practice", {
          width: 860,
          height: 620,
          frame: true,
          transparent: false,
          backgroundColor: "#fafaf9",
          resizable: true,
          skipTaskbar: false,
          alwaysOnTop: false,
        });
      practice.show();
      break;
    }
    default:
      throw new Error("Unknown command");
  }
  return { ok: true };
}
function validPoint(value) {
  return (
    value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Math.abs(value.x) < 100000 &&
    Math.abs(value.y) < 100000
  );
}
const allowed = {
  pet: ["motion-active", "state", "chat", "menu", "drag-start", "drag-move", "drag-end"],
  chat: ["state", "send", "stop", "resume", "chat"],
  bubble: ["state", "open-history", "bubble-hold", "bubble-height"],
  controls: ["state", "chat", "settings", "stop"],
  settings: [
    "motion-enabled",
    "state",
    "scale",
    "pose",
    "reset-position",
    "demo-window",
    "stop",
    "resume",
    "close-settings",
    "windows",
    "anchor",
    "detach",
    "rest-enabled",
    "rest-now",
    "speech-voices",
    "speech-config",
    "speech-test",
    "speech-stop",
    "speech-sample",
  ],
  practice: ["state"],
};
ipcMain.handle("ene:command", async (event, action, value) => {
  const surface = [...windows.entries()].find(
    ([, window]) =>
      !window.isDestroyed() && window.webContents === event.sender,
  )?.[0];
  if (
    !surface ||
    (!(surface === "preview" && action === "state") &&
      !allowed[surface]?.includes(action))
  )
    throw new Error("Command not allowed");
  return dispatch(action, value);
});
app.on("second-instance", () => {
  if (windows.has("chat")) openHistory();
});
app
  .whenReady()
  .then(async () => {
    await mkdir(dataRoot, { recursive: true });
    speech = new SystemSpeech({
      helper: join(root, "native/speech-host.exe"),
      directory: join(dataRoot, "speech-temp"),
    });
    controller = new RuntimeController({
      workerPath: join(root, "native/runtime-worker.mjs"),
      hostPath: join(
        root,
        "native/host",
        process.platform === "win32" ? "node.exe" : "node",
      ),
      root: dataRoot,
      onState: (phase) => {
        if (phase === "stopping") dragging = undefined;
        broadcast({ phase, workerPid: controller?.workerPid ?? null });
        tray?.setContextMenu(contextMenu());
      },
    });
    anchors = new WindowAnchors({
      root,
      ownerPid: process.pid,
      onDetach: () => {
        broadcast({ anchorTitle: null });
        const pet = windows.get("pet");
        if (pet) {
          clampWindow(pet);
          positionAccessories();
        }
      },
      onGeometry: (geometry) => {
        const b = windows.get("pet").getBounds(),
          rect = screen.screenToDipRect(null, {
            x: geometry.x,
            y: geometry.y,
            width: geometry.width,
            height: geometry.height,
          });
        movePetTo(
          Math.round(rect.x + rect.width - b.width * 0.8),
          Math.round(rect.y - b.height * 0.535),
        );
        positionAccessories();
      },
    });
    const pet = await createSurface("pet", boundsFor(state.scale));
    const chat = await createSurface("chat", { width: 320, height: 220 });
    const controls = await createSurface("controls", {
      width: 264,
      height: 78,
      focusable: false,
    });
    await createSurface("bubble", { width: 248, height: 80, resizable: true });
    await dispatch("reset-position");
    updateHitRegion();
    chat.on("moved", () => {
      if (chat.isFocused()) manualChat = true;
    });
    if (!smoke) {
      pet.showInactive();
      showSpeech(state.bubbleText);
    }
    let icon = nativeImage.createFromPath(
      join(root, "public/assets/ene-idle.png"),
    );
    icon = icon
      .crop({ x: 280, y: 120, width: 470, height: 470 })
      .resize({ width: 32, height: 32 });
    tray = new Tray(icon);
    tray.setToolTip("ENE · 出生前测试版");
    tray.setContextMenu(contextMenu());
    tray.on("double-click", () => dispatch("chat"));
    broadcast({
      stopShortcutAvailable: globalShortcut.register(
        "CommandOrControl+Shift+.",
        () => emergencyStop(),
      ),
    });
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "ENE",
          submenu: [
            {
              label: "设置…",
              accelerator: "CommandOrControl+,",
              click: () => dispatch("settings"),
            },
            { label: "显示聊天", click: () => dispatch("chat") },
            {
              label: "停止全部活动",
              accelerator: "CommandOrControl+Shift+.",
              click: () => emergencyStop(),
            },
            {
              label: "退出",
              accelerator: "CommandOrControl+Q",
              click: () => app.quit(),
            },
          ],
        },
      ]),
    );
    screen.on("display-removed", () => dispatch("reset-position"));
    screen.on("display-metrics-changed", () => {
      clampWindow(pet);
      positionAccessories();
    });
    setInterval(updateMousePassthrough, 25).unref();
    setInterval(() => {
      if (
        !smoke &&
        state.restEnabled &&
        Date.now() - lastInteraction > 90000 &&
        !windows.get("settings")?.isVisible()
      )
        restNow().catch((error) => console.error("Rest:", error.message));
    }, 5000).unref();
    if (smoke) await runSmoke();
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
app.on("before-quit", (event) => {
  if (!quitting) {
    event.preventDefault();
    quitting = true;
    stopSpeech();
    clearTimeout(bubbleTimer);
    anchors?.detach(false);
    controller?.stop().finally(() => {
      globalShortcut.unregisterAll();
      app.exit();
    });
  }
});

async function runSmoke() {
  const { default: assert } = await import("node:assert/strict");
  const out = resolve(root, "../../runtime/desktop-qa");
  await mkdir(out, { recursive: true });
  const report = {
    checks: [],
    formalIdentity: false,
    realApi: false,
    windows: {},
  };
  try {
    for (const [surface, window] of windows) {
      report.windows[surface] = window.getBounds();
      assert.equal(
        window.webContents.getLastWebPreferences().nodeIntegration,
        false,
      );
    }
    assert.equal(windows.get("pet").getParentWindow(), null);
    report.checks.push("independent_secure_windows");
    const { createHash } = await import("node:crypto");
    const actor = windows.get("pet");
    const pixels = async () => (await actor.webContents.capturePage()).toPNG();
    const canvasState = () => actor.webContents.executeJavaScript(`(() => {const c=document.querySelector('canvas');return c ? {renderer:c.dataset.renderer, frames:Number(c.dataset.frames), visible:getComputedStyle(c).visibility} : null})()`);
    report.motion = {};
    for (const pose of ["idle", "seated", "prone"]) {
      await changePose(pose);
      await new Promise(resolve => setTimeout(resolve, 700));
      const before = await canvasState();
      assert.equal(before?.renderer, "flat-art-warp");
      assert.equal(before.visible, "visible");
      const frameA = await pixels();
      await new Promise(resolve => setTimeout(resolve, 700));
      const frameB = await pixels();
      const after = await canvasState();
      assert.ok(after.frames > before.frames + 5, `${pose}: drawing did not advance`);
      assert.notEqual(createHash("sha256").update(frameA).digest("hex"), createHash("sha256").update(frameB).digest("hex"), `${pose}: pixels did not change`);
      await writeFile(join(out, `motion-${pose}.png`), frameB);
      report.motion[pose] = {framesIn700ms: after.frames-before.frames, pixelsChanged:true};
    }
    report.checks.push("three_pose_GPU_animation_changes_actual_pixels");
    await dispatch("motion-enabled", false);
    await new Promise(resolve => setTimeout(resolve, 150));
    const paused = await canvasState();
    const stillA = await pixels();
    await new Promise(resolve => setTimeout(resolve, 250));
    assert.equal((await canvasState()).frames, paused.frames);
    assert.deepEqual(await pixels(), stillA);
    assert.equal(state.motionActive, false);
    report.checks.push("motion_toggle_stops_drawing_and_restores_static_image");
    await dispatch("motion-enabled", true);
    await new Promise(resolve => setTimeout(resolve, 200));
    assert.ok((await canvasState()).frames > paused.frames);
    await changePose("idle");
    const voices = await dispatch("speech-voices");
    assert.ok(voices.some((v) => v.language === "zh-CN"));
    await dispatch("speech-config", {
      enabled: false,
      voice: voices.find((v) => v.language === "zh-CN").id,
      rate: 0,
    });
    await dispatch("speech-test");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    assert.equal(state.speechStatus, "playing");
    await dispatch("speech-stop");
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(speech.children.size, 0);
    assert.equal(state.speechStatus, "idle");
    report.checks.push("native_speech_generation_playback_and_interrupt");
    const beforeRest = state.pose;
    assert.equal((await dispatch("rest-now")).ok, true);
    assert.notEqual(state.pose, beforeRest);
    await changePose(beforeRest);
    report.checks.push("desktop_rest_changes_pose_and_stays_in_workarea");
    const pet = windows.get("pet");
    const original = pet.getContentBounds();
    for (let index = 0; index < 40; index++) {
      movePetTo(original.x - (index % 5) * 15, original.y - (index % 4) * 12);
      positionAccessories();
      const moved = pet.getContentBounds();
      assert.ok(Math.abs(moved.width - boundsFor(state.scale).width) <= 1);
      assert.ok(Math.abs(moved.height - boundsFor(state.scale).height) <= 1);
      for (const name of ["chat", "controls", "bubble"]) {
        const actual = windows.get(name).getContentBounds(),
          expected = surfaceSizes.get(name);
        assert.ok(
          Math.abs(actual.width - expected.width) <= 1,
          `${name} width drift: ${actual.width}`,
        );
        assert.ok(
          Math.abs(actual.height - expected.height) <= 1,
          `${name} height drift: ${actual.height}`,
        );
      }
    }
    movePetTo(original.x, original.y);
    if (process.platform === "win32") {
      const region = JSON.parse(
        execFileSync(
          join(root, "native/window-host.exe"),
          ["region", pet.getNativeWindowHandle().readBigUInt64LE().toString()],
          { encoding: "utf8", windowsHide: true },
        ),
      );
      assert.equal(region.kind, 0, "No OS drawing clip may be installed");
      report.region = region;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
    await writeFile(
      join(out, "pet-after-moves.png"),
      (await pet.webContents.capturePage()).toPNG(),
    );
    report.checks.push(
      "repeated_move_preserves_content_size",
      "no_system_drawing_clip",
    );
    report.checks.push("all_accessory_sizes_stable_after_40_moves");
    assert.equal(windows.get("chat").isVisible(), false);
    assert.equal(windows.get("controls").isVisible(), false);
    windows.get("bubble").setIgnoreMouseEvents(true);
    showSpeech("合成气泡：点击 ENE 可查看历史。");
    assert.equal(state.bubbleVisible, true);
    await new Promise((resolve) => setTimeout(resolve, 5200));
    assert.equal(state.bubbleVisible, false);
    assert.equal(windows.get("bubble").isVisible(), false);
    windows.get("bubble").setIgnoreMouseEvents(false);
    openHistory();
    assert.equal(windows.get("chat").isVisible(), true);
    const historyBefore = await windows
      .get("chat")
      .webContents.executeJavaScript(
        'document.querySelector(".conversation").textContent',
      );
    closeHistory();
    openHistory();
    const historyAfter = await windows
      .get("chat")
      .webContents.executeJavaScript(
        'document.querySelector(".conversation").textContent',
      );
    assert.equal(historyAfter, historyBefore);
    assert.match(historyAfter, /视野/);
    closeHistory();
    report.checks.push(
      "idle_has_no_chat_or_toolbar",
      "speech_auto_hides",
      "history_survives_hide_and_reopen",
    );
    await dispatch("scale", 0.65);
    assert.ok(
      Math.abs(windows.get("pet").getBounds().width - 260) < 3,
      JSON.stringify(windows.get("pet").getBounds()),
    );
    await dispatch("pose", "seated");
    report.checks.push("scale_and_pose");
    await dispatch("pose", "prone");
    assert.equal(state.pose, "prone");
    assert.ok(Math.abs(pet.getContentBounds().width - 390) <= 1);
    assert.ok(Math.abs(pet.getContentBounds().height - 260) <= 1);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await writeFile(
      join(out, "pet-prone.png"),
      (await pet.webContents.capturePage()).toPNG(),
    );
    await dispatch("pose", "seated");
    report.checks.push("three_poses_and_landscape_prone");
    const chatShown = windows.get("chat").isVisible();
    await dispatch("chat");
    assert.notEqual(windows.get("chat").isVisible(), chatShown);
    await dispatch("chat");
    report.checks.push("separate_chat_visibility");
    const result = await controller.run();
    assert.ok(result.text, JSON.stringify(result));
    assert.match(result.text, /视野/);
    report.checks.push("real_DSH_synthetic_reply");
    const preview = await createSurface("preview", {
      width: 1440,
      height: 1024,
      alwaysOnTop: false,
      useContentSize: true,
    });
    await preview.webContents.executeJavaScript("document.fonts.ready");
    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(
      join(out, "preview.png"),
      (await preview.webContents.capturePage()).toPNG(),
    );
    await dispatch("settings");
    await windows
      .get("settings")
      .webContents.executeJavaScript("document.fonts.ready");
    await new Promise((resolve) => setTimeout(resolve, 250));
    await writeFile(
      join(out, "settings.png"),
      (await windows.get("settings").webContents.capturePage()).toPNG(),
    );
    if (process.platform === "win32") {
      await dispatch("demo-window");
      const practice = windows.get("practice");
      practice.setPosition(250, 360);
      let latest,
        detached = false;
      const bridge = new WindowAnchors({
        root,
        ownerPid: 0,
        onGeometry: (value) => {
          latest = value;
        },
        onDetach: () => {
          detached = true;
        },
      });
      const expectedHandle = practice
        .getNativeWindowHandle()
        .readBigUInt64LE()
        .toString();
      let target;
      for (let attempt = 0; attempt < 10 && !target; attempt++) {
        const choices = await bridge.list();
        target = choices.find((item) => item.handle === expectedHandle);
        if (!target) await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.ok(
        target,
        `Practice window must be discoverable (visible=${practice.isVisible()})`,
      );
      bridge.follow(target.handle);
      await new Promise((resolve) => setTimeout(resolve, 350));
      assert.ok(latest?.visible);
      const before = latest.x;
      practice.setPosition(330, 400);
      await new Promise((resolve) => setTimeout(resolve, 350));
      assert.ok(latest.x > before);
      practice.minimize();
      await new Promise((resolve) => setTimeout(resolve, 350));
      assert.ok(detached);
      bridge.detach(false);
      practice.hide();
      report.checks.push(
        "native_window_discovery",
        "window_geometry_follow",
        "minimized_window_detach",
      );
    }
    const running = controller.run({ slow: true });
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Hang only this app's renderer. The main-process stop path must remain live.
    windows
      .get("chat")
      .webContents.executeJavaScript("while (true) {}")
      .catch(() => {});
    const begin = performance.now();
    await dispatch('speech-sample', 'aishell3-33');
    await new Promise(resolve => setTimeout(resolve, 100));
    await emergencyStop(true);
    report.forcedStopMs = Math.round(performance.now() - begin);
    assert.equal(state.phase, "stopped");
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(speech.children.size, 0);
    assert.equal(state.restEnabled, false);
    report.checks.push('renderer_hang_stops_native_audio_and_rest');
    assert.ok((await running).error);
    assert.ok((await controller.run()).error);
    report.checks.push(
      "renderer_hang_independent_force_stop",
      "late_reply_discarded",
      "restart_latched",
    );
    windows.get("chat").webContents.forcefullyCrashRenderer();
    report.shortcutRegistered = state.stopShortcutAvailable;
    report.status = "passed";
  } catch (error) {
    report.status = "failed";
    report.error = error.stack;
  }
  await writeFile(
    join(out, "native-smoke.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  quitting = true;
  await controller.stop();
  app.exit(report.status === "passed" ? 0 : 1);
}
