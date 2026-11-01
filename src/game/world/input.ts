export function movementKey(key: string, code = "") {
  const physical: Record<string, string> = {
    KeyW: "w",
    KeyA: "a",
    KeyS: "s",
    KeyD: "d",
    KeyE: "e",
    Space: " ",
  };
  return physical[code] ?? key.toLowerCase();
}
export function createInput() {
  const keyboard = new Set<string>();
  const pointers = new Map<number, string>();
  let stick = { x: 0, y: 0 };
  return {
    setStick(value: { x: number; y: number }) {
      stick = value;
    },
    keyboard,
    pointers,
    clear() {
      stick = { x: 0, y: 0 };
      keyboard.clear();
      pointers.clear();
    },
    direction() {
      const keys = new Set([...keyboard, ...pointers.values()]);
      return {
        x:
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft")) +
          stick.x,
        y:
          Number(keys.has("s") || keys.has("arrowdown")) -
          Number(keys.has("w") || keys.has("arrowup")) +
          stick.y,
      };
    },
  };
}
