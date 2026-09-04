import type { Decorator } from '@storybook/web-components-vite';
import { render } from 'lit';
import { action } from 'storybook/actions';

/**
 * Storybook decorator that logs the given component events to the Actions panel
 * (like the Firefox storybook). The payload is pulled from the dispatching
 * element (`event.target`): `id` and `name` when present, then the meaningful
 * state — `checked` for checkable controls (their `value` is a static submit
 * token), otherwise `value` — plus any custom-event `detail`. Fields appear only
 * when present, so events from multiple instances stay distinguishable. It's a
 * decorator, so it's excluded from "Show code"; pass one or more event names
 * (native or custom).
 *
 *   decorators: [logEvents('moz-card:toggle')]
 *   decorators: [logEvents('input', 'change')]
 */
export function logEvents(...types: string[]): Decorator {
  const loggers = new Map(types.map((t) => [t, action(t)]));
  return (story) => {
    const host = document.createElement('div');
    for (const type of types) {
      host.addEventListener(type, (e) => {
        const target = e.target as
          | (HTMLElement & { name?: string; value?: string; checked?: boolean })
          | null;
        const payload: Record<string, unknown> = {};
        if (target?.id) payload.id = target.id;
        if (target && 'name' in target) payload.name = target.name;
        // A radio's meaningful state is which option (its value); a
        // checkbox/toggle's is checked (their value is a static submit token).
        if (target?.localName === 'moz-radio' && 'value' in target) {
          payload.value = target.value;
        } else if (target && 'checked' in target) {
          payload.checked = target.checked;
        } else if (target && 'value' in target) {
          payload.value = target.value;
        }
        Object.assign(payload, (e as CustomEvent).detail);
        loggers.get(type)?.(payload);
      });
    }
    render(story(), host);
    return host;
  };
}
