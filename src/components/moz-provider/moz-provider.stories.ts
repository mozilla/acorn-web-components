import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect } from 'storybook/test';
import '../moz-button/moz-button';
import './moz-provider';
import type { MozButton } from '../moz-button/moz-button';
import type { MozProvider } from './moz-provider';

const meta: Meta = {
  title: 'Foundation/Provider',
  component: 'moz-provider',
};

export default meta;
type Story = StoryObj;

// System-color fallbacks keep the demo a valid contrast pair even before the
// token stylesheet is loaded, so these behavior stories also pass the a11y run.
const surface = `
  background-color: var(--background-color-canvas, Canvas);
  color: var(--text-color, CanvasText);
  padding: 1rem;
  border-radius: var(--border-radius-medium, 8px);
`;

export const Dark: Story = {
  render: () => html`
    <moz-provider class="subject" theme="dark">
      <div style=${surface}>Dark theme subtree</div>
    </moz-provider>
  `,
  play: async ({ canvasElement }) => {
    const provider = canvasElement.querySelector<MozProvider>(
      'moz-provider.subject',
    )!;
    await provider.updateComplete;
    // theme drives color-scheme so the token layer's light-dark() resolves dark.
    expect(provider.style.colorScheme).toBe('dark');
  },
};

export const Light: Story = {
  render: () => html`
    <moz-provider class="subject" theme="light">
      <div style=${surface}>Light theme subtree</div>
    </moz-provider>
  `,
  play: async ({ canvasElement }) => {
    const provider = canvasElement.querySelector<MozProvider>(
      'moz-provider.subject',
    )!;
    await provider.updateComplete;
    expect(provider.style.colorScheme).toBe('light');
  },
};

export const HighContrast: Story = {
  render: () => html`
    <moz-provider class="subject" contrast="high">
      <moz-button variant="primary">High contrast</moz-button>
    </moz-provider>
  `,
  play: async ({ canvasElement }) => {
    const provider = canvasElement.querySelector<MozProvider>(
      'moz-provider.subject',
    )!;
    const button = canvasElement.querySelector<MozButton>('moz-button')!;
    await provider.updateComplete;
    // The button consumes contrast via context and reflects it a tick later.
    for (
      let i = 0;
      i < 50 && button.getAttribute('data-contrast') !== 'high';
      i++
    ) {
      await new Promise((r) => setTimeout(r, 20));
    }
    // The provider tags its own subtree...
    expect(provider.getAttribute('data-contrast')).toBe('high');
    // ...and each consuming component reflects it onto its own host so its
    // :host([data-contrast='high']) token overrides win.
    expect(button.getAttribute('data-contrast')).toBe('high');
  },
};
