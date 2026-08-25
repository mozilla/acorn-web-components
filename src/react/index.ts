import { createComponent } from '@lit/react';
import * as React from 'react';
import { MozBadge as MozBadgeElement } from '../components/moz-badge/moz-badge';
import { MozBoxButton as MozBoxButtonElement } from '../components/moz-box-button/moz-box-button';
import { MozBoxGroup as MozBoxGroupElement } from '../components/moz-box-group/moz-box-group';
import { MozBoxItem as MozBoxItemElement } from '../components/moz-box-item/moz-box-item';
import { MozBoxLink as MozBoxLinkElement } from '../components/moz-box-link/moz-box-link';
import {
  MozBreadcrumb as MozBreadcrumbElement,
  MozBreadcrumbGroup as MozBreadcrumbGroupElement,
} from '../components/moz-breadcrumb/moz-breadcrumb';
import { MozButton as MozButtonElement } from '../components/moz-button/moz-button';
import { MozCard as MozCardElement } from '../components/moz-card/moz-card';
import { MozChip as MozChipElement } from '../components/moz-chip/moz-chip';
import { MozDetails as MozDetailsElement } from '../components/moz-details/moz-details';
import { MozDialog as MozDialogElement } from '../components/moz-dialog/moz-dialog';
import { MozFiveStar as MozFiveStarElement } from '../components/moz-five-star/moz-five-star';
import { MozIcon as MozIconElement } from '../components/moz-icon/moz-icon';
import { MozMessageBar as MozMessageBarElement } from '../components/moz-message-bar/moz-message-bar';
import { MozPageHeader as MozPageHeaderElement } from '../components/moz-page-header/moz-page-header';
import {
  MozPageNavButton as MozPageNavButtonElement,
  MozPageNav as MozPageNavElement,
} from '../components/moz-page-nav/moz-page-nav';
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

export const MozBoxGroup = createComponent({
  tagName: 'moz-box-group',
  elementClass: MozBoxGroupElement,
  react: React,
});

export const MozBoxItem = createComponent({
  tagName: 'moz-box-item',
  elementClass: MozBoxItemElement,
  react: React,
});

export const MozBoxButton = createComponent({
  tagName: 'moz-box-button',
  elementClass: MozBoxButtonElement,
  react: React,
});

export const MozBoxLink = createComponent({
  tagName: 'moz-box-link',
  elementClass: MozBoxLinkElement,
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

export const MozChip = createComponent({
  tagName: 'moz-chip',
  elementClass: MozChipElement,
  react: React,
  events: {
    onRemove: 'moz-chip:remove',
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

export const MozDialog = createComponent({
  tagName: 'moz-dialog',
  elementClass: MozDialogElement,
  react: React,
  events: {
    onOpen: 'moz-dialog:open',
    onClose: 'moz-dialog:close',
  },
});

export const MozFiveStar = createComponent({
  tagName: 'moz-five-star',
  elementClass: MozFiveStarElement,
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

export const MozPageHeader = createComponent({
  tagName: 'moz-page-header',
  elementClass: MozPageHeaderElement,
  react: React,
});

export const MozPageNav = createComponent({
  tagName: 'moz-page-nav',
  elementClass: MozPageNavElement,
  react: React,
  events: {
    onChange: 'moz-page-nav:change',
  },
});

export const MozPageNavButton = createComponent({
  tagName: 'moz-page-nav-button',
  elementClass: MozPageNavButtonElement,
  react: React,
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
