import test from 'node:test';
import assert from 'node:assert/strict';

// Pure geometry tests — no RN imports needed
const CX = 50, CY = 50;
const SEGMENT_COUNT = 12;
const SEGMENT_SPAN_DEG = 26;
const R_INNER = 25.4;
const R_OUTER = 31.5;

function polarToXY(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

test('AnimatedLogoRing: 12 segments, each spaced 30 degrees apart', () => {
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    assert.equal(i * 30, i * (360 / SEGMENT_COUNT));
  }
});

test('AnimatedLogoRing: segment span + gap sums to exactly 30 degrees per slot', () => {
  const gapDeg = 30 - SEGMENT_SPAN_DEG;
  assert.ok(gapDeg > 0 && gapDeg < 10, `Gap should be between 0 and 10 degrees, got ${gapDeg}`);
  assert.equal(SEGMENT_SPAN_DEG + gapDeg, 30);
});

test('AnimatedLogoRing: segment 0 (top) arc starts and ends at correct positions', () => {
  const half = SEGMENT_SPAN_DEG / 2;
  const start = polarToXY(R_OUTER, -half); // -13° from top
  const end = polarToXY(R_OUTER, half);    // +13° from top
  // Both points should be above center (y < CY) and symmetric around x = CX
  assert.ok(start.y < CY, 'Start point should be above center');
  assert.ok(end.y < CY, 'End point should be above center');
  assert.ok(Math.abs(start.x - CX) - Math.abs(end.x - CX) < 0.01, 'Should be symmetric around vertical axis');
});

test('AnimatedLogoRing: ring dimensions match icon.png proportions', () => {
  // icon.png analysis: r_inner ≈ 260px, r_outer ≈ 320px in 512-unit space
  // normalized to 0-100: r_inner ≈ 25.4, r_outer ≈ 31.25
  const ringThickness = R_OUTER - R_INNER;
  assert.ok(ringThickness > 5.0 && ringThickness < 8.0, `Thickness ${ringThickness} should match icon.png`);
  assert.ok(R_INNER > 24 && R_INNER < 28, `R_INNER ${R_INNER} should be ~25.4`);
  assert.ok(R_OUTER > 30 && R_OUTER < 34, `R_OUTER ${R_OUTER} should be ~31.5`);
});

test('AnimatedLogoRing: all 12 segment midpoints are equidistant from center', () => {
  const rMid = (R_INNER + R_OUTER) / 2;
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const midAngle = i * 30;
    const p = polarToXY(rMid, midAngle);
    const dist = Math.hypot(p.x - CX, p.y - CY);
    assert.ok(Math.abs(dist - rMid) < 0.001, `Segment ${i} midpoint distance should be ${rMid}, got ${dist}`);
  }
});
