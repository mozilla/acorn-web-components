import { createContext } from '@lit/context';

export type Theme = 'light' | 'dark' | 'auto';

/** Ambient theme mode, broadcast by `<moz-provider>`. */
export const themeContext = createContext<Theme>(Symbol('acorn-theme'));
