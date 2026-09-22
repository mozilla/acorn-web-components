import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect } from 'storybook/test';
import '../moz-provider/moz-provider';
import '../moz-input-search/moz-input-search';
import './moz-illustration';
import {
  type IllustrationName,
  illustrationNames,
} from '../../generated/illustrations';
import { illustrationKeywords } from './illustration-keywords';

interface IllustrationArgs {
  name: IllustrationName;
  label: string;
  width: number;
}

const meta: Meta<IllustrationArgs> = {
  title: 'Components/Illustration',
  component: 'moz-illustration',
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: illustrationNames },
    label: { control: 'text' },
    width: { control: { type: 'range', min: 40, max: 500, step: 4 } },
  },
  args: {
    name: 'pic-globe',
    label: '',
    width: 200,
  },
  render: (args) => html`
    <moz-illustration
      name=${args.name}
      label=${args.label || ''}
      style="width:${args.width}px;"
    ></moz-illustration>
  `,
};

export default meta;
type Story = StoryObj<IllustrationArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const illo = canvasElement.querySelector('moz-illustration')!;
    let svg: SVGElement | null | undefined;
    for (let i = 0; i < 50 && !svg; i++) {
      svg = illo.shadowRoot?.querySelector('svg');
      if (!svg) await new Promise((r) => setTimeout(r, 20));
    }
    expect(svg).toBeTruthy();
  },
};

export const Themed: Story = {
  name: 'Light / dark',
  args: { name: 'kit-devices-sync', width: 240 },
  argTypes: {
    name: { control: { disable: true } },
    label: { control: { disable: true } },
  },
  render: (args) => html`
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      ${(['light', 'dark'] as const).map(
        (theme) => html`
          <moz-provider
            theme=${theme}
            style="padding:16px;border-radius:8px;background:${
              theme === 'dark' ? '#1c1b22' : '#f9f9fb'
            };"
          >
            <moz-illustration
              name=${args.name}
              style="width:${args.width}px;"
            ></moz-illustration>
          </moz-provider>
        `,
      )}
    </div>
  `,
  play: async ({ canvasElement }) => {
    const [light, dark] = canvasElement.querySelectorAll('moz-illustration');
    for (const illo of [light, dark]) {
      await illo.updateComplete;
      for (let i = 0; i < 50 && !illo.shadowRoot?.querySelector('svg'); i++) {
        await new Promise((r) => setTimeout(r, 20));
      }
    }
    // The two providers resolve the same name to different theme variants.
    const lightSvg = light.shadowRoot?.querySelector('svg')?.outerHTML;
    const darkSvg = dark.shadowRoot?.querySelector('svg')?.outerHTML;
    expect(lightSvg).toBeTruthy();
    expect(darkSvg).toBeTruthy();
    expect(lightSvg).not.toBe(darkSvg);
  },
};

const searchText = (n: IllustrationName): string =>
  [n, ...(illustrationKeywords[n] ?? [])].join(' ').toLowerCase();

const filterGallery = (e: Event) => {
  const search = e.currentTarget as HTMLElement;
  const root = search.closest('[data-illo-gallery]');
  if (!root) return;
  const query =
    (e as CustomEvent<{ query: string }>).detail?.query ??
    (search as HTMLInputElement).value ??
    '';
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const cell of root.querySelectorAll<HTMLElement>('[data-search]')) {
    const haystack = cell.dataset.search ?? '';
    const hit = terms.every((t) => haystack.includes(t));
    cell.style.display = hit ? 'flex' : 'none';
    if (hit) matches++;
  }
  const count = root.querySelector('[data-illo-count]');
  if (count)
    count.textContent = `${matches} of ${illustrationNames.length} illustrations`;
};

export const Gallery: Story = {
  argTypes: {
    name: { control: { disable: true } },
    label: { control: { disable: true } },
    width: { control: { disable: true } },
  },
  render: () => html`
    <div data-illo-gallery>
      <div
        style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;"
      >
        <moz-input-search
          debounce="100"
          placeholder="Search illustrations by name or keyword…"
          style="flex:1;min-width:220px;"
          @moz-input-search:search=${filterGallery}
          @input=${filterGallery}
        ></moz-input-search>
        <span
          data-illo-count
          style="font-size:12px;font-family:monospace;opacity:0.7;white-space:nowrap;"
          >${illustrationNames.length} of ${illustrationNames.length}
          illustrations</span
        >
      </div>
      <div
        style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;"
      >
        ${illustrationNames.map(
          (n) => html`
            <div
              data-search=${searchText(n)}
              style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:8px;padding:12px 8px;border:1px solid var(--border-color-interactive, #ccc);border-radius:var(--border-radius-small, 4px);"
            >
              <moz-illustration
                name=${n}
                style="width:100%;max-width:96px;"
              ></moz-illustration>
              <span
                style="font-size:11px;font-family:monospace;background-color:black;color:white;padding:1px 5px;line-height:1.3;text-align:center;word-break:break-word;opacity:0.75;"
                >${n}</span
              >
            </div>
          `,
        )}
      </div>
    </div>
  `,
};
