/**
 * Short, child-friendly dispatch cue. Browsers allow sound only after a user action.
 * No actual emergency phone call or device alarm is triggered.
 */
export function playGameSiren() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new window.AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.08);
    gain.gain.setValueAtTime(0.055, t + 1.35);
    gain.gain.linearRampToValueAtTime(0.0001, t + 1.5);
    oscillator.frequency.setValueAtTime(520, t);
    oscillator.frequency.linearRampToValueAtTime(760, t + 0.38);
    oscillator.frequency.linearRampToValueAtTime(520, t + 0.76);
    oscillator.frequency.linearRampToValueAtTime(760, t + 1.12);
    oscillator.frequency.linearRampToValueAtTime(520, t + 1.5);
    oscillator.onended = () => {
      void ctx.close().catch(() => {});
    };
    oscillator.start(t);
    oscillator.stop(t + 1.52);
    void ctx.resume().catch(() => {});
  } catch {
    // Silent mode and Web Audio restrictions must not interrupt play.
  }
}
