// Frontend unit tests — run with: node --test frontend/tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const dir = path.dirname(fileURLToPath(import.meta.url));
const core = require(path.join(dir, "..", "music_core.js"));

// mozart_notes.js is a browser script that assigns window.MOZART_NOTES
globalThis.window = {};
require(path.join(dir, "..", "mozart_notes.js"));
const MOZART = globalThis.window.MOZART_NOTES;

test("pitchToMidi maps reference pitches", () => {
  assert.equal(core.pitchToMidi("a4"), 69);
  assert.equal(core.pitchToMidi("c4"), 60);
  assert.equal(core.pitchToMidi("c5"), 72);
  assert.equal(core.pitchToMidi("f#4"), 66);
  assert.equal(core.pitchToMidi("g2"), 43);
});

test("midiToPitch inverts pitchToMidi", () => {
  for (const p of ["c3", "f#5", "a4", "b2", "g#4"]) {
    assert.equal(core.midiToPitch(core.pitchToMidi(p)), p);
  }
});

test("midiToFreq: A4 = 440 Hz, octave doubles", () => {
  assert.equal(core.midiToFreq(69), 440);
  assert.ok(Math.abs(core.midiToFreq(81) - 880) < 1e-9);
});

test("parseVoice: beats advance through notes, chords, and rests", () => {
  const notes = core.parseVoice([["c5", 8], [8], [["e5", "g5"], 4]]);
  // c5 at beat 0 (dur 1), rest advances to 2, chord at beat 2 (dur 2)
  assert.equal(notes.length, 3);
  assert.deepEqual(notes[0], { midi: 72, beat: 0, dur: 1 });
  assert.equal(notes[1].beat, 2);
  assert.equal(notes[2].beat, 2);
  assert.equal(notes[1].dur, 2);
});

test("voiceEighths counts rests and chords", () => {
  assert.equal(core.voiceEighths([["c5", 8], [8], [["e5", "g5"], 4]]), 4);
  assert.equal(core.voiceEighths([[4], [8]]), 3);
});

test("Mozart data integrity: 177 measures, every voice fills 3/8 exactly", () => {
  const keys = Object.keys(MOZART);
  assert.equal(keys.length, 177);
  for (const k of keys) {
    const m = MOZART[k];
    assert.ok(m.t && m.b, `measure ${k} missing a voice`);
    for (const voice of ["t", "b"]) {
      const total = core.voiceEighths(m[voice]);
      assert.ok(
        Math.abs(total - 3) < 1e-9,
        `measure ${k} voice ${voice} sums to ${total} eighths (expected 3)`
      );
    }
  }
});

test("Mozart data: all pitches are well-formed", () => {
  const re = /^[a-g]#?[0-6]$/;
  for (const [k, m] of Object.entries(MOZART)) {
    for (const voice of ["t", "b"]) {
      for (const ev of m[voice]) {
        if (typeof ev[0] === "string") {
          assert.match(ev[0], re, `measure ${k}: bad pitch ${ev[0]}`);
        } else if (Array.isArray(ev[0])) {
          for (const p of ev[0]) assert.match(p, re, `measure ${k}: bad chord pitch ${p}`);
        }
      }
    }
  }
});
