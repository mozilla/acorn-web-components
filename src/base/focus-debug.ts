// TEMPORARY: diagnostics for a Firefox-only CI failure where a programmatic
// focus() leaves shadowRoot.activeElement null. Remove with its callers.
export function focusDebug(host: HTMLElement, target: Element | null): string {
  const rect = target?.getBoundingClientRect();
  const active = document.activeElement;
  return JSON.stringify({
    hasFocus: document.hasFocus(),
    visibility: document.visibilityState,
    docActive: active
      ? `${active.tagName}${active.id ? `#${active.id}` : ''}.${active.className}`
      : null,
    hostIsActive: active === host,
    shadowActive: host.shadowRoot?.activeElement
      ? `${host.shadowRoot.activeElement.tagName}.${host.shadowRoot.activeElement.className}`
      : null,
    delegatesFocus: (host.shadowRoot as ShadowRoot & { delegatesFocus?: boolean })
      ?.delegatesFocus,
    target: target ? `${target.tagName}.${target.className}` : null,
    targetTabIndex: (target as HTMLElement | null)?.tabIndex,
    targetSize: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)}` : null,
    targetConnected: target?.isConnected,
  });
}
