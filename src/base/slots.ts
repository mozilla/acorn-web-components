/**
 * Whether a slot has meaningful assigned content: any element, or text that
 * isn't only whitespace. One definition shared across components so a given
 * markup shows/hides slot-driven regions the same way everywhere.
 */
export function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({ flatten: true })
    .some(
      (node) =>
        node.nodeType !== Node.TEXT_NODE ||
        (node.textContent ?? '').trim() !== '',
    );
}
