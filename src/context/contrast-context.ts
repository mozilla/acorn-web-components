import { createContext } from '@lit/context';

export type Contrast = 'auto' | 'high';

/**
 * Ambient high-contrast mode, broadcast by `<moz-provider>`. When `high`,
 * components reflect it to a `data-contrast` host attribute so their
 * `:host([data-contrast='high'])` token overrides apply. This is app-driven
 * and complements the OS-driven `@media (prefers-contrast)/(forced-colors)`.
 */
export const contrastContext = createContext<Contrast>(
  Symbol('acorn-contrast'),
);
