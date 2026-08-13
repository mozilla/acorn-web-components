import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './moz-breadcrumb';
import type { BreadcrumbSelectDetail } from './moz-breadcrumb';

const meta: Meta = {
  title: 'Components/Breadcrumb',
  component: 'moz-breadcrumb-group',
  tags: ['autodocs'],
  render: () => html`
    <moz-breadcrumb-group label="Breadcrumb">
      <moz-breadcrumb href="#home">Home</moz-breadcrumb>
      <moz-breadcrumb href="#extensions">Extensions</moz-breadcrumb>
      <moz-breadcrumb href="#privacy">Privacy &amp; Security</moz-breadcrumb>
      <moz-breadcrumb>uBlock Origin</moz-breadcrumb>
    </moz-breadcrumb-group>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const TwoLevels: Story = {
  render: () => html`
    <moz-breadcrumb-group>
      <moz-breadcrumb href="#home">Home</moz-breadcrumb>
      <moz-breadcrumb>Settings</moz-breadcrumb>
    </moz-breadcrumb-group>
  `,
};

// A single crumb used on its own, without a group.
export const SingleCrumb: Story = {
  render: () =>
    html`<moz-breadcrumb href="#back">Back to add-ons</moz-breadcrumb>`,
};

// Many crumbs wrap within a constrained width.
export const Wrapping: Story = {
  render: () => html`
    <moz-breadcrumb-group style="display:block;max-width:260px;">
      <moz-breadcrumb href="#home">Home</moz-breadcrumb>
      <moz-breadcrumb href="#library">Library</moz-breadcrumb>
      <moz-breadcrumb href="#documents">Documents</moz-breadcrumb>
      <moz-breadcrumb href="#projects">Projects</moz-breadcrumb>
      <moz-breadcrumb href="#2026">2026</moz-breadcrumb>
      <moz-breadcrumb>Q3 Planning</moz-breadcrumb>
    </moz-breadcrumb-group>
  `,
};

// --- Interaction tests (test-only: run under Vitest/CI, hidden from docs) ---

// nav landmark, ordered list, and the last crumb marked current & non-link.
export const Semantics: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-breadcrumb-group label="You are here">
      <moz-breadcrumb href="#a">Home</moz-breadcrumb>
      <moz-breadcrumb href="#b">Extensions</moz-breadcrumb>
      <moz-breadcrumb>uBlock Origin</moz-breadcrumb>
    </moz-breadcrumb-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-breadcrumb-group')!;
    await group.updateComplete;
    const root = group.shadowRoot!;

    const nav = root.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('You are here');
    expect(root.querySelector('ol')).toBeTruthy();
    expect(root.querySelectorAll('li').length).toBe(3);
    expect(root.querySelectorAll('moz-icon.separator').length).toBe(2);

    const crumbs = [...group.querySelectorAll('moz-breadcrumb')];
    await Promise.all(crumbs.map((c) => c.updateComplete));
    // Non-final crumbs render links; the final crumb is current, not a link.
    expect(crumbs[0].current).toBe(false);
    expect(crumbs[0].shadowRoot!.querySelector('a.crumb')).toBeTruthy();
    expect(crumbs[2].current).toBe(true);
    const current = crumbs[2].shadowRoot!.querySelector(
      '[aria-current="page"]',
    );
    expect(current?.tagName).toBe('SPAN');
  },
};

// Activating a crumb link fires moz-breadcrumb:select with its href.
export const SelectEvent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-breadcrumb-group>
      <moz-breadcrumb href="#home">Home</moz-breadcrumb>
      <moz-breadcrumb>Current</moz-breadcrumb>
    </moz-breadcrumb-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-breadcrumb-group')!;
    await group.updateComplete;
    // Stop the anchor from actually navigating the test page.
    group.addEventListener('click', (e) => e.preventDefault(), true);
    let detail: BreadcrumbSelectDetail | undefined;
    group.addEventListener('moz-breadcrumb:select', (e) => {
      detail = (e as CustomEvent<BreadcrumbSelectDetail>).detail;
    });
    const first = group.querySelector('moz-breadcrumb')!;
    await first.updateComplete;
    first.shadowRoot!.querySelector<HTMLAnchorElement>('a.crumb')!.click();
    expect(detail?.href).toBe('#home');
  },
};

// Cancelling the event blocks the anchor's default navigation.
export const SelectCancelable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-breadcrumb-group>
      <moz-breadcrumb href="#home">Home</moz-breadcrumb>
      <moz-breadcrumb>Current</moz-breadcrumb>
    </moz-breadcrumb-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-breadcrumb-group')!;
    await group.updateComplete;
    group.addEventListener('moz-breadcrumb:select', (e) => e.preventDefault());
    let prevented = false;
    group.addEventListener('click', (e) => {
      prevented = e.defaultPrevented;
    });
    const first = group.querySelector('moz-breadcrumb')!;
    await first.updateComplete;
    first.shadowRoot!.querySelector<HTMLAnchorElement>('a.crumb')!.click();
    expect(prevented).toBe(true);
  },
};
