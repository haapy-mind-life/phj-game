import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { createInput, movementKey } from "@/game/world/input";
export function useMovement(enabled: boolean, action: () => void) {
  const input = useRef(createInput());
  const actionRef = useRef(action);
  actionRef.current = action;
  useEffect(() => {
    const state = input.current;
    state.clear();
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest("input,textarea,select,[contenteditable=true]")) return;
      const k = movementKey(e.key, e.code);
      if (k === " " && target?.closest("button,a")) return;
      if (
        !["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e", " "].includes(
          k,
        )
      )
        return;
      e.preventDefault();
      state.keyboard.add(k);
      if ((k === "e" || k === " ") && !e.repeat) actionRef.current();
    };
    const up = (e: KeyboardEvent) => state.keyboard.delete(movementKey(e.key, e.code));
    const reset = () => state.clear();
    const releasePointer = (e: globalThis.PointerEvent) => state.pointers.delete(e.pointerId);
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      reset();
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [enabled]);
  const release = (e: PointerEvent<HTMLButtonElement>) =>
    input.current.pointers.delete(e.pointerId);
  const hold = (key: string) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (!enabled || e.button !== 0) return;
      e.preventDefault();
      input.current.pointers.set(e.pointerId, key);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* Window release events remain available. */
      }
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const setStick = useCallback(
    (value: { x: number; y: number }) => input.current.setStick(value),
    [],
  );
  return {
    direction: () => (enabled ? input.current.direction() : { x: 0, y: 0 }),
    hold,
    setStick,
  };
}
