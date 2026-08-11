import { createContext } from '@lit/context';

/** Ambient BCP-47 locale, broadcast by `<moz-provider>`. Ready for future i18n. */
export const localeContext = createContext<string>(Symbol('acorn-locale'));
