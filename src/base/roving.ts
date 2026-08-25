/** Options for {@link rovingIndex}. */
export interface RovingOptions {
  /** Wrap around the ends instead of clamping (default: clamp). */
  wrap?: boolean;
  /** Swap Left/Right for right-to-left. */
  rtl?: boolean;
  /** Which arrow axes navigate (default: both). */
  orientation?: 'vertical' | 'horizontal' | 'both';
}

/**
 * Resolve an arrow/Home/End key to the next index in a roving-tabindex group,
 * or `null` if the key doesn't navigate. Shared by the keyboard handlers of the
 * selection/navigation groups so they agree on wrap, orientation, and RTL.
 */
export function rovingIndex(
  key: string,
  current: number,
  count: number,
  opts: RovingOptions = {},
): number | null {
  if (count === 0) return null;
  const { wrap = false, rtl = false, orientation = 'both' } = opts;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  const vertical = orientation !== 'horizontal';
  const horizontal = orientation !== 'vertical';
  const forward =
    (vertical && key === 'ArrowDown') ||
    (horizontal && key === (rtl ? 'ArrowLeft' : 'ArrowRight'));
  const backward =
    (vertical && key === 'ArrowUp') ||
    (horizontal && key === (rtl ? 'ArrowRight' : 'ArrowLeft'));

  if (forward)
    return wrap ? (current + 1) % count : Math.min(count - 1, current + 1);
  if (backward)
    return wrap ? (current - 1 + count) % count : Math.max(0, current - 1);
  return null;
}
