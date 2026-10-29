import test from "node:test";
import assert from "node:assert/strict";
import { RIGS, parameters, sourcePoint, motionClock } from "../native/character-motion.mjs";

test("all poses keep the contact point fixed throughout movement", () => {
  for (const [pose, rig] of Object.entries(RIGS))
    for (let t = 0; t < 60; t += 0.17)
      assert.deepEqual(sourcePoint(...rig.pivot, pose, parameters(t)), rig.pivot);
});
test("stop and reduced-motion inputs reproduce the original artwork exactly", () => {
  for (const pose of Object.keys(RIGS))
    assert.deepEqual(sourcePoint(0.31, 0.47, pose, parameters(25, false, true)), [0.31, 0.47]);
});
test("deformation remains bounded and does not accumulate drift over long runs", () => {
  for (const pose of Object.keys(RIGS))
    for (const time of [0, 1, 10, 3600, 86400, 31536000])
      for (let x = 0; x <= 1; x += 0.05)
        for (let y = 0; y <= 1; y += 0.05) {
          const q = sourcePoint(x, y, pose, parameters(time, true, true));
          assert.ok(Math.abs(q[0] - x) < 0.025 && Math.abs(q[1] - y) < 0.02);
        }
  assert.equal(motionClock(1000, 500), 0);
});
