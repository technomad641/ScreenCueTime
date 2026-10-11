// Thin wrapper over the View Transitions API. When the browser supports
// document.startViewTransition, the DOM mutation inside `mutate` is captured as
// a smooth cross-fade/transform transition; otherwise we just run it directly.
// Honors prefers-reduced-motion by skipping the animated path.
export function runViewTransition(mutate) {
  if (typeof document === "undefined") {
    mutate();
    return;
  }

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || typeof document.startViewTransition !== "function") {
    mutate();
    return;
  }

  document.startViewTransition(() => mutate());
}
