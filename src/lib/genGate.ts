// Shared secret used to gate the generate-image edge function.
// Only authoring UIs (lesson creator dialogs) attach this header.
// The chat/doubt path must NOT use this constant.
export const GEN_GATE_KEY = "x8Qa2Lm9Vt4Rp7Zs3Wn6Yb1Hk5Jd0Cf";
export const GEN_GATE_HEADER = "X-Gen-Key";
