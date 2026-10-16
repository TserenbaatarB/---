"use client";

import { useSyncExternalStore } from "react";

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/* Phones get fewer particles to keep animation smooth. */
export function useCompact(): boolean {
  return useMediaQuery("(max-width: 640px)");
}

/* Parallax follows a mouse; touch screens use a gentle idle drift instead. */
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
