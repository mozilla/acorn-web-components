import { createComponent } from '@lit/react';
import * as React from 'react';
import { MozButton as MozButtonElement } from '../components/moz-button/moz-button';
import { MozCard as MozCardElement } from '../components/moz-card/moz-card';
import { MozIcon as MozIconElement } from '../components/moz-icon/moz-icon';
import { MozMessageBar as MozMessageBarElement } from '../components/moz-message-bar/moz-message-bar';
import { MozProvider as MozProviderElement } from '../components/moz-provider/moz-provider';

// Typed React wrappers. React 19 handles custom elements natively, but the
// wrappers give proper typed props/events and a React-idiomatic API. Importing
// a wrapper registers its element (the element modules self-define on import).

export const MozButton = createComponent({
  tagName: 'moz-button',
  elementClass: MozButtonElement,
  react: React,
});

export const MozCard = createComponent({
  tagName: 'moz-card',
  elementClass: MozCardElement,
  react: React,
});

export const MozIcon = createComponent({
  tagName: 'moz-icon',
  elementClass: MozIconElement,
  react: React,
});

export const MozMessageBar = createComponent({
  tagName: 'moz-message-bar',
  elementClass: MozMessageBarElement,
  react: React,
  events: {
    onDismissed: 'moz-message-bar:dismissed',
    onClose: 'moz-message-bar:close',
  },
});

export const MozProvider = createComponent({
  tagName: 'moz-provider',
  elementClass: MozProviderElement,
  react: React,
});
