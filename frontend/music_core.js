/* =============================================================================
   Music core — pure functions shared by the Music Lab (browser) and the
   frontend test suite (node --test). No DOM, no Web Audio.

   Event format (same as mozart_notes.js and /api/ai/music/compose):
     [pitch, duration]         single note   ['c5', 8]
     [[p1, p2, ...], duration] chord         [['c5','e5'], 4]
     [duration]                rest          [8]
   Duration codes: 2=half, 4=quarter, 8=eighth, 16=sixteenth.
   Parsed beats/durations are measured in eighth-note units.
   ============================================================================= */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MusicCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const PITCH_BASE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const PITCH_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];

  // 'c5', 'f#4', 'g2' -> MIDI number
  function pitchToMidi(p) {
    let i = 0;
    const letter = p[i++];
    let semi = PITCH_BASE[letter];
    if (p[i] === "#") { semi += 1; i++; }
    const octave = parseInt(p.substring(i), 10);
    return (octave + 1) * 12 + semi;
  }

  function midiToPitch(midi) {
    return PITCH_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Parse a voice (array of events) into {midi, beat, dur} notes;
  // beat/dur in eighth-note units. Rests advance the cursor only.
  function parseVoice(events) {
    let beat = 0;
    const notes = [];
    for (const ev of events) {
      if (typeof ev[0] === "number") {
        beat += 8 / ev[0];
      } else if (typeof ev[0] === "string") {
        const dur = 8 / ev[1];
        notes.push({ midi: pitchToMidi(ev[0]), beat, dur });
        beat += dur;
      } else if (Array.isArray(ev[0])) {
        const dur = 8 / ev[1];
        for (const p of ev[0]) notes.push({ midi: pitchToMidi(p), beat, dur });
        beat += dur;
      }
    }
    return notes;
  }

  // Total length of a voice in eighth-note units (notes, chords, and rests)
  function voiceEighths(events) {
    let total = 0;
    for (const ev of events) {
      const dur = typeof ev[0] === "number" ? ev[0] : ev[ev.length - 1];
      total += 8 / dur;
    }
    return total;
  }

  return { pitchToMidi, midiToPitch, midiToFreq, parseVoice, voiceEighths };
});
