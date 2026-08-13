import type { Decorator } from '@storybook/web-components-vite';
import { render } from 'lit';
import { action } from 'storybook/actions';

/**
 * Storybook decorator that logs the given component events to the Actions panel
 * (like the Firefox storybook) as `{ id, ...detail }` — the `id` comes from the
 * dispatching element (`event.target`), so events from multiple instances are
 * distinguishable. It's a decorator, so it's excluded from "Show code"; pass one
 * or more custom-event names.
 *
 *   decorators: [logEvents('moz-card:toggle')]
 */
export function logEvents(...types: string[]): Decorator {
  const loggers = new Map(types.map((t) => [t, action(t)]));
  return (story) => {
    const host = document.createElement('div');
    for (const type of types) {
      host.addEventListener(type, (e) => {
        const id = (e.target as HTMLElement | null)?.id || undefined;
        loggers.get(type)?.({ id, ...(e as CustomEvent).detail });
      });
    }
    render(story(), host);
    return host;
  };
}
