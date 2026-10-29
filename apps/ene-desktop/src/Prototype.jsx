import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  MessageCircle,
  Settings,
  Square,
  X,
  Minus,
  Plus,
  RotateCcw,
  Move,
  PanelTop,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Folder,
} from "lucide-react";
const role = new URLSearchParams(location.search).get("surface") || "preview";
const native = role === "preview" ? undefined : window.ene;
const initial = {
  phase: "idle",
  scale: 0.8,
  pose: role === "preview" ? "seated" : "idle",
  chatVisible: false,
  bubbleVisible: role === "preview",
  bubbleText: "哼，这个位置视野还不错。",
  bubbleHeld: false,
};
const scripted = "哼，这个位置视野还不错。想聊什么？";
function useCompanion() {
  const [state, setState] = useState(initial);
  useEffect(() => native?.subscribe(setState), []);
  useEffect(() => {
    if (native || !state.bubbleVisible || state.bubbleHeld) return;
    const timer = setTimeout(
      () => setState((previous) => ({ ...previous, bubbleVisible: false })),
      5000,
    );
    return () => clearTimeout(timer);
  }, [state.bubbleVisible, state.bubbleText, state.bubbleHeld]);
  const command = async (action, value) => {
    if (native) return native.command(action, value);
    setState((previous) => {
      if (action === "stop")
        return { ...previous, phase: "stopped", bubbleVisible: false };
      if (action === "resume") return { ...previous, phase: "idle" };
      if (action === "chat")
        return {
          ...previous,
          chatVisible: !previous.chatVisible,
          bubbleVisible: false,
        };
      if (action === "open-history")
        return { ...previous, chatVisible: true, bubbleVisible: false };
      if (action === "bubble-hold")
        return { ...previous, bubbleHeld: value === true };
      if (action === "scale") return { ...previous, scale: value };
      if (action === "pose") return { ...previous, pose: value };
      if (action === "reset-position")
        return { ...previous, scale: 0.8, pose: "seated" };
      return previous;
    });
    return { ok: true };
  };
  return [state, command, setState];
}
function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
function Chat({ state, command, setState, close }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const generation = useRef(0),
    list = useRef(null);
  const busy = state.phase === "running",
    stopped = ["stopped", "stopping"].includes(state.phase);
  useEffect(() => {
    list.current?.scrollTo({
      top: list.current.scrollHeight,
      behavior: "instant",
    });
  }, [messages, busy]);
  useEffect(() => {
    if (stopped) generation.current++;
  }, [stopped]);
  async function send(event) {
    event.preventDefault();
    if (!draft.trim() || busy || stopped) return;
    const turn = ++generation.current;
    setMessages((items) => [...items, { role: "user", text: draft.trim() }]);
    setDraft("");
    setError("");
    if (!native)
      setState((value) => ({
        ...value,
        phase: "running",
        chatVisible: false,
        bubbleVisible: false,
      }));
    try {
      const result = native
        ? await native.command("send")
        : await new Promise((resolve) =>
            setTimeout(() => resolve({ text: scripted }), 900),
          );
      if (turn !== generation.current) return;
      if (!result?.text)
        throw new Error(result?.error || "这次演示没有完成，请重试。");
      setMessages((items) => [
        ...items,
        { role: "assistant", text: result.text },
      ]);
      if (!native)
        setState((previous) => ({
          ...previous,
          bubbleText: result.text,
          bubbleVisible: true,
          bubbleHeld: false,
        }));
    } catch (failure) {
      if (turn === generation.current) {
        setError(failure.message);
        if (!native)
          setState((previous) => ({ ...previous, chatVisible: true }));
      }
    } finally {
      if (!native && turn === generation.current)
        setState((value) => ({ ...value, phase: "idle" }));
    }
  }
  return (
    <section className="chat-panel" aria-label="与 ENE 对话">
      <header className="chat-header drag-region">
        <div className="avatar">
          <img src="./assets/ene-idle.png" alt="" />
        </div>
        <div>
          <strong>ENE</strong>
          <span className="caption">本次对话历史</span>
        </div>
        <div className="chat-window-controls">
          <IconButton label="收起聊天" onClick={close}>
            <Minus size={18} />
          </IconButton>
        </div>
      </header>
      <div
        ref={list}
        className="conversation"
        role="log"
        aria-label="对话记录"
        aria-live="polite"
      >
        <p className="assistant-message">哼，这个位置视野还不错。</p>
        {messages.map((message, index) => (
          <p key={index} className={`${message.role}-message`}>
            {message.text}
          </p>
        ))}
        {busy && (
          <p className="thinking" role="status">
            正在运行本机演示…
          </p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
      {stopped && (
        <div className="stopped-notice">
          <Square size={15} />
          <span>已停止，任务不会自动恢复。</span>
          <button className="text-button" onClick={() => command("resume")}>
            重新启用
          </button>
        </div>
      )}
      <form className="composer" onSubmit={send}>
        <label className="sr-only" htmlFor="message">
          和 ENE 说点什么
        </label>
        <input
          id="message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="和 ENE 说点什么…"
          maxLength={2000}
          disabled={busy || stopped}
          autoComplete="off"
        />
        <button
          className="send-button"
          aria-label="发送演示消息"
          disabled={!draft.trim() || busy || stopped}
        >
          <ArrowUp size={20} />
        </button>
      </form>
      <footer className="chat-footnote">
        <span className="status-dot" />
        未连接模型 · 本机演示
        <span title="输入仅显示在当前窗口；DSH 只接收固定合成测试文本。">
          仅本次运行
        </span>
      </footer>
    </section>
  );
}
function SpeechBubble({ state, command }) {
  const surface = useRef(null);
  useEffect(() => {
    if (!native) return;
    const observer = new ResizeObserver(() =>
      native.command("bubble-height", surface.current.offsetHeight + 12),
    );
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={surface}
      className="speech-surface"
      onPointerEnter={() => command("bubble-hold", true)}
      onPointerLeave={() => command("bubble-hold", false)}
      onFocus={() => command("bubble-hold", true)}
      onBlur={() => command("bubble-hold", false)}
    >
      <button
        className="speech-message"
        aria-label={`ENE 说：${state.bubbleText}。点击查看历史`}
        onClick={() => command("open-history")}
      >
        <span>{state.bubbleText}</span>
      </button>
    </div>
  );
}
function Controls({ state, command, openSettings }) {
  return (
    <nav className="control-island glass" aria-label="ENE 控制">
      <IconButton label="显示或收起聊天" onClick={() => command("chat")}>
        <MessageCircle size={20} />
      </IconButton>
      <IconButton label="打开设置" onClick={openSettings}>
        <Settings size={20} />
      </IconButton>
      <span className="control-divider" />
      <button
        className="stop-button"
        onClick={() => command("stop")}
        disabled={state.phase === "stopped"}
      >
        <Square size={14} fill="currentColor" />
        {state.phase === "stopped" ? "已停止" : "停止"}
      </button>
    </nav>
  );
}
function Preferences({ state, command, close }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector("button")?.focus();
    return () => previous?.focus();
  }, []);
  function keyboard(event) {
    if (event.key === "Escape") close();
    if (event.key === "Tab") {
      const elements = [
        ...panel.current.querySelectorAll(
          "button:not(:disabled),input:not(:disabled),select",
        ),
      ];
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  const [targets, setTargets] = useState(null),
    [windowError, setWindowError] = useState("");
  async function listWindows() {
    setWindowError("");
    try {
      setTargets(await command("windows"));
    } catch {
      setWindowError("无法读取窗口，请稍后重试。");
    }
  }
  return (
    <section
      ref={panel}
      onKeyDown={keyboard}
      className="preferences"
      aria-label="ENE 设置"
    >
      <header className="settings-header drag-region">
        <h1>设置</h1>
        <IconButton label="关闭设置" onClick={close}>
          <X size={20} />
        </IconButton>
      </header>
      <div className="settings-content">
        <h2>桌面上的 ENE</h2>
        <div className="setting-group">
          <div className="setting-row">
            <label htmlFor="scale">角色大小</label>
            <output htmlFor="scale">{Math.round(state.scale * 100)}%</output>
          </div>
          <div className="slider-row">
            <Minus size={16} />
            <input
              id="scale"
              type="range"
              min="0.55"
              max="1.2"
              step="0.05"
              value={state.scale}
              onChange={(event) => command("scale", +event.target.value)}
            />
            <Plus size={16} />
          </div>
          <div className="setting-row">
            <label htmlFor="pose">姿态</label>
            <select
              id="pose"
              value={state.pose}
              onChange={(event) => command("pose", event.target.value)}
            >
              <option value="idle">站立</option>
              <option value="seated">坐姿</option>
              <option value="prone">趴着</option>
            </select>
          </div>
          <button
            className="setting-row row-action"
            onClick={() => command("reset-position")}
          >
            <Move size={18} />
            找回角色<span>回到当前屏幕</span>
          </button>
          {native && (
            <button
              className="setting-row row-action"
              onClick={() => command("demo-window")}
            >
              <PanelTop size={18} />
              打开停靠练习窗
            </button>
          )}
        </div>
        <p className="settings-note">
          拖动角色可在桌面移动。聊天与角色相互独立。Windows
          可选择已打开的窗口停靠，拖动角色即可脱离。
        </p>
        <h2>自主休息</h2>
        <div className="setting-group">
          <label className="setting-row">
            空闲时换个姿势
            <input
              type="checkbox"
              checked={state.restEnabled || false}
              disabled={!native || state.phase === "stopped"}
              onChange={(e) => command("rest-enabled", e.target.checked)}
            />
          </label>
          <button
            className="setting-row row-action"
            disabled={!native || state.phase !== "idle" || !!state.anchorTitle}
            onClick={() => command("rest-now")}
          >
            现在休息一下
          </button>
        </div>
        <p className="settings-note">
          开启后，90
          秒没有交互时在当前屏幕底边坐下或趴着。拖动和聊天时暂停，已停靠的窗口不会被打断。当前仍为静态立绘切换。
        </p>
        <VoiceSettings state={state} command={command} />
        {native && (
          <>
            <h2>窗口停靠</h2>
            <div className="setting-group">
              <button className="setting-row row-action" onClick={listWindows}>
                <PanelTop size={18} />
                选择窗口停靠
              </button>
              {state.anchorTitle && (
                <button
                  className="setting-row row-action"
                  onClick={() => command("detach")}
                >
                  脱离窗口<span>{state.anchorTitle}</span>
                </button>
              )}
              {targets?.map((target) => (
                <button
                  key={target.handle}
                  className="setting-row row-action window-choice"
                  onClick={async () => {
                    try {
                      await command("anchor", target.handle);
                      setTargets(null);
                    } catch {
                      setWindowError("窗口已不可用，请刷新列表。");
                    }
                  }}
                >
                  {target.title}
                </button>
              ))}
            </div>
            {targets?.length === 0 && (
              <p className="settings-note">
                没有找到可停靠窗口。macOS 停靠尚待适配。
              </p>
            )}
            {windowError && (
              <p role="alert" className="error-text">
                {windowError}
              </p>
            )}
          </>
        )}
        <h2>停止与恢复</h2>
        <div className="setting-group">
          <button
            className="setting-row row-action"
            onClick={() => command("stop")}
          >
            <Square size={16} />
            停止全部活动<kbd>Ctrl/⌘ Shift .</kbd>
          </button>
          <button
            className="setting-row row-action"
            disabled={state.phase !== "stopped"}
            onClick={() => command("resume")}
          >
            <RotateCcw size={17} />
            重新启用
          </button>
        </div>
        <p className="settings-note">
          {!native
            ? "网页预览仅停止演示；桌面版另有独立停止入口。"
            : state.stopShortcutAvailable === false
              ? "快捷键被其他应用占用，请使用托盘菜单停止。"
              : "停止快捷键和托盘菜单由独立主进程接收。"}
          重新启用不会重放被停止的请求。
        </p>
        <h2>当前状态</h2>
        <div className="setting-group">
          <div className="setting-row">
            <span>后台引擎</span>
            <span>DSH {state.engineVersion || "0.2.2-alpha.2"}</span>
          </div>
          <div className="setting-row">
            <span>引擎状态</span>
            <span>
              {state.workerPid
                ? state.phase === "running"
                  ? "正在运行演示"
                  : "后台已启动"
                : "发送时启动"}
            </span>
          </div>
          <div className="setting-row">
            <span>对话</span>
            <span>固定演示回复</span>
          </div>
          <div className="setting-row">
            <span>记忆</span>
            <span>尚未创建正式身份</span>
          </div>
          <div className="setting-row">
            <span>TTS</span>
            <span>
              {state.speechVoice ? "系统音色 · 调试" : "尚未选择音色"}
            </span>
          </div>
        </div>
        <p className="settings-note">
          ENE 是独立桌面界面，DSH
          在后台负责运行会话。当前连接本机合成测试接口，输入尚未发送给真实模型。
        </p>
        <p className="settings-note">
          此版本不保存聊天，不连接付费模型。语音设置仅本次运行有效，正式加密记忆尚未启用。
        </p>
      </div>
    </section>
  );
}
function VoiceSettings({ state, command }) {
  const [voices, setVoices] = useState([]),
    [error, setError] = useState("");
  const [voice, setVoice] = useState(state.speechVoice || ""),
    [rate, setRate] = useState(state.speechRate || 0);
  useEffect(() => {
    if (!native) return;
    let active = true;
    command("speech-voices")
      .then((items) => {
        if (active) {
          setVoices(items);
          setVoice(
            (v) =>
              v ||
              items.find((i) => i.language.startsWith("zh"))?.id ||
              items[0]?.id ||
              "",
          );
        }
      })
      .catch(() => active && setError("无法读取已安装音色。"));
    return () => {
      active = false;
    };
  }, []);
  async function apply(enabled, test = false) {
    setError("");
    try {
      await command("speech-config", { enabled, voice, rate });
      if (test) await command("speech-test");
    } catch {
      setError("无法使用这个音色，请重新选择后试听。");
    }
  }
  return (
    <>
      <h2>声音试听</h2>
      <div className="setting-group">
        <div className="setting-row">
          <label htmlFor="voice">系统音色</label>
          <select
            id="voice"
            value={voice}
            disabled={!voices.length}
            onChange={(e) => setVoice(e.target.value)}
          >
            {!voices.length && (
              <option value="">
                {native ? "没有可用音色" : "请在桌面版试听"}
              </option>
            )}
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.language}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-row">
          <label htmlFor="voice-rate">语速</label>
          <select
            id="voice-rate"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          >
            {[-2, -1, 0, 1, 2].map((v) => (
              <option key={v} value={v}>
                {v === 0 ? "正常" : v < 0 ? `慢 ${-v} 档` : `快 ${v} 档`}
              </option>
            ))}
          </select>
        </div>
        <button
          className="setting-row row-action"
          disabled={!voice || state.phase === "stopped"}
          onClick={() => apply(state.speechEnabled || false, true)}
        >
          试听 ENE 台词
          <span>
            {state.speechStatus === "generating"
              ? "正在生成…"
              : state.speechStatus === "playing"
                ? "正在播放"
                : "本机生成"}
          </span>
        </button>
        <button
          className="setting-row row-action"
          onClick={() => command("speech-stop")}
          disabled={!native}
        >
          停止语音
        </button>
        <label className="setting-row">
          朗读演示回复
          <input
            type="checkbox"
            disabled={!voice || state.phase === "stopped"}
            checked={state.speechEnabled || false}
            onChange={(e) => apply(e.target.checked)}
          />
        </label>
      </div>
      <p className="settings-note">
        系统语音仅用于验证播放，不代表 ENE
        的最终音色。切换音色或语速后，点击试听或重新开启朗读即可应用。紧急停止同时打断语音。
      </p>
      <h2>本地模型对照</h2>
      <p className="settings-note">
        相同台词的离线生成样本。AISHELL3 为 8kHz
        轻量基线，三个编号仅代表说话人，尚未确定 ENE 音色。
      </p>
      <div className="setting-group voice-samples">
        {["aishell3-10", "aishell3-33", "aishell3-99"].map((id) => (
          <div className="voice-sample" key={id}>
            <span>AISHELL3 · {id.split("-")[1]}</span>
            {native ? (
              <button
                className="text-button"
                disabled={state.phase === "stopped"}
                onClick={() =>
                  command("speech-sample", id).catch(() =>
                    setError("试听文件不可用。"),
                  )
                }
              >
                试听
              </button>
            ) : (
              <audio
                controls
                preload="none"
                src={`./assets/voice-tests/${id}.wav`}
                aria-label={`试听 ${id}`}
              />
            )}
          </div>
        ))}
      </div>
      {(error || state.speechError) && (
        <p className="error-text" role="alert">
          {error || state.speechError}
        </p>
      )}
    </>
  );
}
function Pet({ state }) {
  const down = useRef(null);
  return (
    <div
      className="pet-surface"
      onContextMenu={(event) => {
        event.preventDefault();
        native?.command("menu");
      }}
    >
      <img
        className="pet-image"
        src={`./assets/ene-${state.pose}.png`}
        alt="ENE，拖动可移动，右键打开菜单"
        draggable="false"
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            native?.command("chat");
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          down.current = { x: event.screenX, y: event.screenY };
          event.currentTarget.setPointerCapture(event.pointerId);
          native?.command("drag-start", down.current);
        }}
        onPointerMove={(event) => {
          if (down.current)
            native?.command("drag-move", {
              x: event.screenX,
              y: event.screenY,
            });
        }}
        onPointerUp={(event) => {
          if (!down.current) return;
          if (
            Math.hypot(
              event.screenX - down.current.x,
              event.screenY - down.current.y,
            ) < 5
          )
            native?.command("chat");
          down.current = null;
          native?.command("drag-end");
        }}
        onPointerCancel={() => {
          down.current = null;
          native?.command("drag-end");
        }}
      />
    </div>
  );
}
function Practice() {
  return (
    <main className="practice-document">
      <small>ENE · 停靠练习窗</small>
      <h1>今天的计划</h1>
      <p>
        整理一下这周的重点事项，先完成最重要的部分，
        <br />
        保持节奏，不要着急。
      </p>
      <p>
        ENE 可以坐在选中的窗口边缘。
        <br />
        在桌面版选择窗口后，她会跟随窗口移动。
      </p>
      <p>聊天窗口可以随时收起，ENE 仍留在桌面上。</p>
      <hr />
      <span>窗口可自由移动、缩放和关闭。</span>
    </main>
  );
}
export function Prototype() {
  const [state, command, setState] = useCompanion();
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.surface = role;
  }, []);
  const openSettings = () =>
    native ? native.command("settings") : setSettings(true);
  if (role === "pet") return <Pet state={state} />;
  if (role === "bubble")
    return <SpeechBubble state={state} command={command} />;
  if (role === "chat")
    return (
      <Chat
        state={state}
        command={command}
        setState={setState}
        close={() => command("chat")}
      />
    );
  if (role === "controls")
    return (
      <Controls state={state} command={command} openSettings={openSettings} />
    );
  if (role === "settings")
    return (
      <Preferences
        state={state}
        command={command}
        close={() => native.command("close-settings")}
      />
    );
  if (role === "practice") return <Practice />;
  return (
    <main className="desktop-preview" aria-label="ENE 桌面交互预览">
      <div className="desktop-folder">
        <Folder size={48} strokeWidth={1.4} />
        <span>收藏</span>
      </div>
      <div className="sample-browser">
        <header>
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="browser-title">文档</span>
        </header>
        <div className="address-row">
          <ChevronLeft size={17} />
          <ChevronRight size={17} />
          <span>
            <LockKeyhole size={13} />
            桌面交互练习
          </span>
        </div>
        <Practice />
      </div>
      <div
        className="preview-pet"
        role="button"
        tabIndex={0}
        aria-label="ENE，点击查看历史，右键打开设置"
        onClick={() => command("chat")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            command("chat");
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          setSettings(true);
        }}
        style={{
          transform: `scale(${state.scale / 0.8})`,
          transformOrigin: "60% 53.5%",
        }}
      >
        <img
          src={`./assets/ene-${state.pose}.png`}
          alt="ENE 坐在练习窗口的边缘"
        />
      </div>
      {state.bubbleVisible && (
        <div className="preview-speech">
          <SpeechBubble state={state} command={command} />
        </div>
      )}
      <div className="preview-chat" hidden={!state.chatVisible}>
        <Chat
          state={state}
          command={command}
          setState={setState}
          close={() => command("chat")}
        />
      </div>
      <div className="preview-controls" hidden={!state.chatVisible}>
        <Controls state={state} command={command} openSettings={openSettings} />
      </div>
      {settings && (
        <div className="sheet-backdrop" onClick={() => setSettings(false)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <Preferences
              state={state}
              command={command}
              close={() => setSettings(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
