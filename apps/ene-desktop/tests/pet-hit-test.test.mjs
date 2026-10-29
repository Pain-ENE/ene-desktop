import test from "node:test";
import assert from "node:assert/strict";
import { hitsCharacter } from "../native/pet-hit-test.mjs";
const bitmap = Buffer.alloc(4 * 2 * 4);
bitmap[(0 * 4 + 2) * 4 + 3] = 255;
bitmap[(1 * 4 + 3) * 4 + 3] = 255;
const image = { bitmap, width: 4, height: 2 };
test("letterbox and transparent pixels pass input through at negative desktop coordinates", () => {
  const bounds = { x: -100, y: -30, width: 80, height: 80 };
  assert.equal(hitsCharacter(image, bounds, { x: -50, y: 0 }), true);
  assert.equal(hitsCharacter(image, bounds, { x: -90, y: 0 }), false);
  assert.equal(hitsCharacter(image, bounds, { x: -50, y: -20 }), false);
  assert.equal(hitsCharacter(image, bounds, { x: -20, y: 10 }), false);
});
test("dragging, scaling and monitor origins preserve the same character hit", () => {
  for (const scale of [0.55, 0.8, 1.2, 2])
    for (const x of [-1920, 0, 2560]) {
      const bounds = { x, y: 80, width: 400 * scale, height: 600 * scale };
      const fit = bounds.width / 4;
      const point = {
        x: x + 2.5 * fit,
        y: 80 + (bounds.height - 2 * fit) / 2 + 0.5 * fit,
      };
      assert.equal(hitsCharacter(image, bounds, point), true);
      assert.equal(
        hitsCharacter(image, bounds, { ...point, x: x + 0.5 * fit }),
        false,
      );
    }
});
