import { createComponent } from '@lit/react';
import * as React from 'react';
import { MozBadge as MozBadgeElement } from '../components/moz-badge/moz-badge';
import {
  MozBreadcrumb as MozBreadcrumbElement,
  MozBreadcrumbGroup as MozBreadcrumbGroupElement,
} from '../components/moz-breadcrumb/moz-breadcrumb';
import { MozButton as MozButtonElement } from '../components/moz-button/moz-button';
import { MozCard as MozCardElement } from '../components/moz-card/moz-card';
import { MozDetails as MozDetailsElement } from '../components/moz-details/moz-details';
import { MozIcon as MozIconElement } from '../components/moz-icon/moz-icon';
import { MozMessageBar as MozMessageBarElement } from '../components/moz-message-bar/moz-message-bar';
import { MozProvider as MozProviderElement } from '../components/moz-provider/moz-provider';
import {
  MozSegmentedControlDeck as MozSegmentedControlDeckElement,
  MozSegmentedControl as MozSegmentedControlElement,
  MozSegmentedControlItem as MozSegmentedControlItemElement,
} from '../components/moz-segmented-control/moz-segmented-control';

// Typed React wrappers. React 19 handles custom elements natively, but the
// wrappers give proper typed props/events and a React-idiomatic API. Importing
// a wrapper registers its element (the element modules self-define on import).

export const MozBadge = createComponent({
  tagName: 'moz-badge',
  elementClass: MozBadgeElement,
  react: React,
});

export const MozBreadcrumb = createComponent({
  tagName: 'moz-breadcrumb',
  elementClass: MozBreadcrumbElement,
  react: React,
  events: {
    onSelect: 'moz-breadcrumb:select',
  },
});

export const MozBreadcrumbGroup = createComponent({
  tagName: 'moz-breadcrumb-group',
  elementClass: MozBreadcrumbGroupElement,
  react: React,
});

export const MozButton = createComponent({
  tagName: 'moz-button',
  elementClass: MozButtonElement,
  react: React,
});

export const MozCard = createComponent({
  tagName: 'moz-card',
  elementClass: MozCardElement,
  react: React,
  events: {
    onToggle: 'moz-card:toggle',
  },
});

export const MozDetails = createComponent({
  tagName: 'moz-details',
  elementClass: MozDetailsElement,
  react: React,
  events: {
    onToggle: 'moz-details:toggle',
  },
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

export const MozSegmentedControl = createComponent({
  tagName: 'moz-segmented-control',
  elementClass: MozSegmentedControlElement,
  react: React,
  events: {
    onChange: 'moz-segmented-control:change',
  },
});

export const MozSegmentedControlItem = createComponent({
  tagName: 'moz-segmented-control-item',
  elementClass: MozSegmentedControlItemElement,
  react: React,
});

export const MozSegmentedControlDeck = createComponent({
  tagName: 'moz-segmented-control-deck',
  elementClass: MozSegmentedControlDeckElement,
  react: React,
});
