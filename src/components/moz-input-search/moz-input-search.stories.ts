import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './moz-input-search';
import type {
  InputSearchEventDetail,
  MozInputSearch,
} from './moz-input-search';

interface Args {
  label?: string;
  placeholder?: string;
  value?: string;
  disabled: boolean;
}

const meta: Meta<Args> = {
  title: 'Components/Input Search',
  component: 'moz-input-search',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Search add-ons',
    placeholder: 'Search…',
    disabled: false,
  },
  render: (args) => html`
    <moz-input-search
      label=${ifDefined(args.label)}
      placeholder=${ifDefined(args.placeholder)}
      value=${ifDefined(args.value)}
      ?disabled=${args.disabled}
    ></moz-input-search>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('moz-input-search')!;
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.type).toBe('search');
    // A leading search icon by default.
    expect(el.shadowRoot!.querySelector('.field-icon')).toBeTruthy();
  },
};

// Typing fires a debounced `moz-input-search:search` with the query.
export const DebouncedSearch: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozInputSearch>('moz-input-search')!;
    el.debounce = 0;
    await el.updateComplete;
    let query: string | undefined;
    el.addEventListener('moz-input-search:search', (e) => {
      query = (e as CustomEvent<InputSearchEventDetail>).detail.query;
    });
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'ublock';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await wait();
    expect(query).toBe('ublock');
  },
};

// clear() empties the field and fires a search immediately.
export const Clear: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'ublock' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector<MozInputSearch>('moz-input-search')!;
    await el.updateComplete;
    let query: string | undefined = 'unset';
    el.addEventListener('moz-input-search:search', (e) => {
      query = (e as CustomEvent<InputSearchEventDetail>).detail.query;
    });
    el.clear();
    await el.updateComplete;
    expect(el.value).toBe('');
    expect(query).toBe('');
  },
};

export const WithValue: Story = { args: { value: 'privacy' } };
export const Disabled: Story = { args: { value: 'privacy', disabled: true } };
