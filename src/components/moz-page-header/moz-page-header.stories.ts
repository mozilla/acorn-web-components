import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-page-header';
import '../moz-breadcrumb/moz-breadcrumb';
import '../moz-button/moz-button';
import '../moz-icon/moz-icon';
import type { PageHeaderBadge, PageHeaderLevel } from './moz-page-header';

interface Args {
  heading?: string;
  description?: string;
  level: PageHeaderLevel;
  backButton: boolean;
  badge?: PageHeaderBadge;
}

const levels: PageHeaderLevel[] = [1, 2, 3, 4, 5, 6];

const meta: Meta<Args> = {
  title: 'Components/PageHeader',
  component: 'moz-page-header',
  tags: ['autodocs'],
  decorators: [logEvents('moz-page-header:back')],
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    level: { control: 'select', options: levels },
    backButton: { control: 'boolean' },
    badge: { control: 'inline-radio', options: [undefined, 'beta', 'new'] },
  },
  args: {
    heading: 'Extensions',
    level: 1,
    backButton: false,
  },
  render: (args) => html`
    <moz-page-header
      heading=${ifDefined(args.heading)}
      description=${ifDefined(args.description)}
      level=${args.level}
      ?back-button=${args.backButton}
      badge=${ifDefined(args.badge)}
    ></moz-page-header>
  `,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: 'Manage the add-ons installed in your browser.' },
};

export const WithIcon: Story = {
  args: { description: 'Manage the add-ons installed in your browser.' },
  render: (args) => html`
    <moz-page-header
      heading=${ifDefined(args.heading)}
      level=${args.level}
      icon-start="plugin"
    >
      <span slot="description">${args.description}</span>
    </moz-page-header>
  `,
};

export const WithBadge: Story = {
  args: { badge: 'beta', description: 'This feature is still in testing.' },
};

export const WithBackButton: Story = {
  args: { heading: 'Extension details', backButton: true },
};

export const WithBreadcrumbs: Story = {
  render: (args) => html`
    <moz-page-header heading=${ifDefined(args.heading)} level=${args.level}>
      <moz-breadcrumb-group slot="breadcrumbs" label="Breadcrumb">
        <moz-breadcrumb href="#home">Home</moz-breadcrumb>
        <moz-breadcrumb>Extensions</moz-breadcrumb>
      </moz-breadcrumb-group>
      <span slot="description">Manage the add-ons installed in your browser.</span>
    </moz-page-header>
  `,
};

export const WithActions: Story = {
  args: {
    description: 'Manage the add-ons installed in your browser.',
  },
  render: (args) => html`
    <moz-page-header
      heading=${ifDefined(args.heading)}
      description=${ifDefined(args.description)}
      level=${args.level}
    >
      <moz-button slot="actions" variant="ghost" icon-start="settings"
        >Manage</moz-button
      >
      <moz-button slot="actions" variant="primary">Add extension</moz-button>
    </moz-page-header>
  `,
};

// Everything at once: back button, breadcrumbs, icon, badge, description, actions.
export const Complete: Story = {
  render: () => html`
    <moz-page-header
      heading="Extensions"
      level="1"
      back-button
      badge="beta"
      icon-start="plugin"
    >
      <moz-breadcrumb-group slot="breadcrumbs" label="Breadcrumb">
        <moz-breadcrumb href="#home">Home</moz-breadcrumb>
        <moz-breadcrumb>Extensions</moz-breadcrumb>
      </moz-breadcrumb-group>
      <span slot="description"
        >Manage the add-ons installed in your browser.</span
      >
      <moz-button slot="actions" variant="ghost" icon-start="settings"
        >Manage</moz-button
      >
      <moz-button slot="actions" variant="primary">Add extension</moz-button>
    </moz-page-header>
  `,
};

// Slotted heading and description instead of attributes.
export const SlottedHeading: Story = {
  render: () => html`
    <moz-page-header level="2">
      Slotted title
      <span slot="description">A description provided via the slot.</span>
    </moz-page-header>
  `,
};

export const Levels: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;max-width:640px;">
      ${levels.map(
        (l) =>
          html`<moz-page-header
            heading=${`Heading level ${l}`}
            description=${`Renders a real <h${l}> element.`}
            level=${l}
          ></moz-page-header>`,
      )}
    </div>
  `,
};

// Interaction test: the configured heading element and slotted content render.
export const RendersSlottedContent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-page-header heading="Settings" level="1">
      <moz-icon slot="icon" name="settings" size="xlarge"></moz-icon>
      <span slot="description">Configure your preferences.</span>
      <moz-button slot="actions">Save</moz-button>
    </moz-page-header>
  `,
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('moz-page-header')!;
    await header.updateComplete;
    const root = header.shadowRoot!;

    const h1 = root.querySelector('h1.heading');
    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Settings');

    const iconSlot = root.querySelector<HTMLSlotElement>('slot[name="icon"]')!;
    expect(iconSlot.assignedElements()).toHaveLength(1);

    const descSlot = root.querySelector<HTMLSlotElement>(
      'slot[name="description"]',
    )!;
    expect(descSlot.assignedElements()[0]?.textContent).toContain(
      'Configure your preferences.',
    );

    const actionsSlot = root.querySelector<HTMLSlotElement>(
      'slot[name="actions"]',
    )!;
    const actions = actionsSlot.assignedElements();
    expect(actions).toHaveLength(1);
    expect(actions[0].tagName.toLowerCase()).toBe('moz-button');
  },
};

// Interaction test: the default slot supplies the heading when `heading` is unset.
export const RendersSlottedHeading: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-page-header level="3">My title</moz-page-header>`,
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('moz-page-header')!;
    await header.updateComplete;
    const heading = header.shadowRoot!.querySelector('h3.heading')!;
    expect(heading).toBeTruthy();
    const slot = heading.querySelector<HTMLSlotElement>('slot')!;
    expect(slot.assignedNodes()[0]?.textContent?.trim()).toBe('My title');
  },
};

// Interaction test: the back button fires moz-page-header:back.
export const BackButtonFiresEvent: Story = {
  tags: ['!dev', '!autodocs'],
  args: { heading: 'Details', backButton: true },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('moz-page-header')!;
    await header.updateComplete;
    let fired = false;
    header.addEventListener('moz-page-header:back', () => {
      fired = true;
    });
    header
      .shadowRoot!.querySelector('moz-button.back')!
      .shadowRoot!.querySelector('button')!
      .click();
    expect(fired).toBe(true);
  },
};
