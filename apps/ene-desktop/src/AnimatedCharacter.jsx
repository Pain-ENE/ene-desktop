import { useEffect, useRef, useState } from "react";
import { RIGS, parameters, motionClock } from "../native/character-motion.mjs";

const vertex = `attribute vec2 position; varying vec2 uv;
void main(){ uv=vec2((position.x+1.)*.5,(1.-position.y)*.5); gl_Position=vec4(position,0.,1.); }`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D artwork; uniform vec2 fit;
uniform vec2 head; uniform vec2 chest; uniform vec2 pivot; uniform vec4 params;
float bell(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.);}
void main(){
 vec2 p=(uv-.5)/fit+.5;
 float h=bell(p,head,vec2(.20,.19));
 float c=bell(p,chest,vec2(.22,.20));
 float hair=min(1.,abs(p.x-head.x)/.24)*bell(p,head+vec2(0.,.17),vec2(.65,.36));
 float pin=min(1.,distance(p,pivot)/.10);
 vec2 d=vec2(h*params.y*.007+hair*params.z*.012+c*params.x*(p.x-chest.x)*.008,
 -c*params.x*.0035+h*(-params.x*.002+params.w*.0015)+hair*params.z*(p.x-head.x)*.008)*pin;
 vec2 q=p-d;
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.){gl_FragColor=vec4(0.);return;}
 gl_FragColor=texture2D(artwork,q);
}`;

// Real-time flat-art deformation preview, not a Cubism/moc3 renderer.
export default function AnimatedCharacter({ state, onMotionActive, ...props }) {
  const ref = useRef(null), latest = useRef(state);
  latest.current = state;
  const activity = useRef(onMotionActive); activity.current = onMotionActive;
  const [fallback, setFallback] = useState(false);
  const pose = state.pose || "idle";
  useEffect(() => {
    setFallback(false);
    const canvas = ref.current;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) { activity.current?.(false); setFallback(true); return; }
    let disposed = false, request = 0, ready = false, lastFrame = 0, previousActive;
    const notify = active => { if (active !== previousActive) { previousActive = active; activity.current?.(active); } };
    const shaders = [], textures = [], buffers = [];
    const program = gl.createProgram();
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
        const shader = gl.createShader(type); shaders.push(shader);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer = gl.createBuffer(); buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    } catch (error) {
      console.warn("Character renderer fallback:", error.message);
      setFallback(true);
      activity.current?.(false);
      buffers.forEach(b => gl.deleteBuffer(b));
      shaders.forEach(s => gl.deleteShader(s));
      gl.deleteProgram(program);
      return;
    }
    const uniform = name => gl.getUniformLocation(program, name);
    const uniforms = Object.fromEntries(["fit", "head", "chest", "pivot", "params"].map(n => [n, uniform(n)]));
    const rig = RIGS[pose] || RIGS.idle;
    const image = new Image();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    function draw(stamp = 0) {
      request = 0;
      if (disposed || !ready || document.hidden || gl.isContextLost()) { notify(false); return; }
      if (stamp - lastFrame >= 32 || stamp === 0) {
        lastFrame = stamp;
        const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const w = Math.round(width*dpr), h = Math.round(height*dpr);
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0,0,w,h); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
        const scale = Math.min(width/image.width, height/image.height);
        gl.uniform2f(uniforms.fit, image.width*scale/width, image.height*scale/height);
        for (const key of ["head","chest","pivot"]) gl.uniform2fv(uniforms[key], rig[key]);
        const state = latest.current;
        const enabled = state.motionEnabled !== false && !reduced.matches && !["stopped","stopping"].includes(state.phase);
        notify(enabled);
        gl.uniform4fv(uniforms.params, parameters(motionClock(state.motionOrigin || 0), enabled, state.speechStatus === "playing"));
        gl.drawArrays(gl.TRIANGLES,0,6);
        canvas.dataset.renderer = "flat-art-warp";
        canvas.dataset.frames = String(Number(canvas.dataset.frames || 0)+1);
        if (!enabled) return;
      }
      request = requestAnimationFrame(draw);
    }
    function wake() { if (!request) draw(); }
    function lost(event) { notify(false); event.preventDefault(); cancelAnimationFrame(request); request = 0; setFallback(true); }
    function restored() { setFallback(true); } // Static image remains usable after GPU loss.
    image.onload = () => {
      if (disposed || gl.isContextLost()) return;
      const texture = gl.createTexture(); textures.push(texture);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      ready = true; wake();
    };
    image.onerror = () => !disposed && setFallback(true);
    image.src = `./assets/ene-${pose}.png`;
    observer = new ResizeObserver(wake); observer.observe(canvas);
    document.addEventListener("visibilitychange", wake);
    reduced.addEventListener("change", wake);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    // React state updates can resume a stopped loop without rebuilding GPU resources.
    canvas.addEventListener("ene-motion-update", wake);
    return () => {
      notify(false); disposed = true; cancelAnimationFrame(request); observer.disconnect();
      image.onload = image.onerror = null;
      document.removeEventListener("visibilitychange", wake); reduced.removeEventListener("change", wake);
      canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored);
      canvas.removeEventListener("ene-motion-update", wake);
      textures.forEach(t => gl.deleteTexture(t)); buffers.forEach(b => gl.deleteBuffer(b));
      shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program);
    };
  }, [pose]);
  useEffect(() => { ref.current?.dispatchEvent(new Event("ene-motion-update")); }, [state.motionEnabled, state.phase, state.speechStatus]);
  return <span className="animated-character" {...props}>
    <img src={`./assets/ene-${pose}.png`} alt="" aria-hidden="true" style={{visibility: fallback ? "visible" : "hidden"}} />
    <canvas ref={ref} aria-hidden="true" style={{visibility: fallback ? "hidden" : "visible"}} />
  </span>;
}
