import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-select';
import { type IconName, iconNames } from '../../generated/icons';
import type { MozSelect, SelectSize, SelectVariant } from './moz-select';

interface Args {
  label: string;
  name?: string;
  value?: string;
  placeholder?: string;
  variant: SelectVariant;
  size: SelectSize;
  description?: string;
  error?: string;
  iconStart?: IconName;
  disabled: boolean;
  required: boolean;
  fullWidth: boolean;
}

const variants: SelectVariant[] = ['standard', 'pill'];
const sizes: SelectSize[] = ['default', 'small'];

const licences = html`
  <moz-option value="mpl2" label="MPL 2.0"></moz-option>
  <moz-option value="apache2" label="Apache 2.0"></moz-option>
  <moz-option value="mit" label="MIT"></moz-option>
  <hr />
  <moz-option value="other" label="Something else"></moz-option>
`;

const meta: Meta<Args> = {
  title: 'Components/Input Select',
  component: 'moz-select',
  tags: ['autodocs'],
  decorators: [logEvents('input', 'change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'inline-radio', options: variants },
    size: { control: 'inline-radio', options: sizes },
    description: { control: 'text' },
    error: { control: 'text' },
    iconStart: { control: 'select', options: [undefined, ...iconNames] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    label: 'Licence',
    name: 'licence',
    value: 'mpl2',
    variant: 'standard',
    size: 'default',
    disabled: false,
    required: false,
    fullWidth: false,
  },
  render: (args) => html`
    <moz-select
      label=${args.label}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      placeholder=${ifDefined(args.placeholder)}
      variant=${args.variant}
      size=${args.size}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      icon-start=${ifDefined(args.iconStart)}
      ?disabled=${args.disabled}
      ?required=${args.required}
      ?full-width=${args.fullWidth}
    >
      ${licences}
    </moz-select>
  `,
};

export default meta;
type Story = StoryObj<Args>;

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const el = (root: HTMLElement) => root.querySelector<MozSelect>('moz-select')!;
const control = (node: MozSelect) =>
  node.shadowRoot!.querySelector('select') as HTMLSelectElement;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();
    const inner = control(select);
    // Options mirrored into the real select, separator included.
    expect(inner.querySelectorAll('option')).toHaveLength(4);
    expect(inner.querySelectorAll('hr')).toHaveLength(1);
    expect(inner.value).toBe('mpl2');
  },
};

export const Pill: Story = { args: { variant: 'pill' } };
export const Small: Story = { args: { size: 'small' } };
export const WithDescription: Story = {
  args: { description: 'How others may reuse your add-on.' },
};
export const WithIcon: Story = { args: { iconStart: 'shield' } };
export const Required: Story = { args: { required: true, value: '' } };
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = {
  args: { value: '', error: 'Choose a licence.' },
};
export const FullWidth: Story = { args: { fullWidth: true } };

// Nothing pre-selected: the placeholder holds the empty state instead. Pair it
// with `required` so submitting without a choice fails validation.
export const Placeholder: Story = {
  args: { value: '', placeholder: 'Choose a licence…', required: true },
};

// Every variant and size together.
export const Variants: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${variants.map(
        (variant) => html`
          ${sizes.map(
            (size) => html`
              <moz-select
                label="${variant} / ${size}"
                variant=${variant}
                size=${size}
                value="mpl2"
              >
                ${licences}
              </moz-select>
            `,
          )}
        `,
      )}
    </div>
  `,
};

// Per-option icons only show on the closed control, for the selected option —
// a native popup can't render them.
export const OptionIcons: Story = {
  render: () => html`
    <moz-select label="Visibility" value="public">
      <moz-option value="public" label="Public" icon="globe"></moz-option>
      <moz-option value="private" label="Private" icon="lock"></moz-option>
    </moz-select>
  `,
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();
    expect(
      select.shadowRoot!.querySelector('.icon')?.getAttribute('name'),
    ).toBe('globe');

    select.value = 'private';
    await select.updateComplete;
    expect(
      select.shadowRoot!.querySelector('.icon')?.getAttribute('name'),
    ).toBe('lock');
  },
};

// --- interaction tests ---

// Guards the property-vs-attribute harvest (Firefox bug 2070217): appending an
// option whose attributes haven't reflected yet must not lose its value.
export const OptionsCreatedDynamically: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`<moz-select label="Built at runtime"></moz-select>`,
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;

    // Set properties only, and append immediately — the reflected attributes
    // are still unset at this point.
    for (const [value, label] of [
      ['a', 'Alpha'],
      ['b', 'Beta'],
    ]) {
      const option = document.createElement('moz-option');
      option.value = value;
      option.label = label;
      select.append(option);
    }
    select.value = 'b';
    await wait(50);

    const inner = control(select);
    expect([...inner.options].map((o) => o.value)).toEqual(['a', 'b']);
    expect([...inner.options].map((o) => o.textContent?.trim())).toEqual([
      'Alpha',
      'Beta',
    ]);
    // The requested value survived rather than collapsing to the first option.
    expect(select.value).toBe('b');
    expect(inner.value).toBe('b');
  },
};

// Mutating a slotted option after the fact re-harvests it.
export const OptionMutationSyncs: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();

    const option = select.querySelector('moz-option')!;
    option.label = 'Mozilla Public License 2.0';
    await wait(50);
    expect(control(select).options[0].textContent?.trim()).toBe(
      'Mozilla Public License 2.0',
    );

    option.disabled = true;
    await wait(50);
    expect(control(select).options[0].disabled).toBe(true);
  },
};

// With no value set, a native select shows its first option — so the host
// adopts that rather than disagreeing with what's on screen.
export const AdoptsFirstOptionValue: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-select label="Licence" name="licence">${licences}</moz-select>
  `,
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait(50);
    expect(select.value).toBe('mpl2');
    expect(control(select).value).toBe('mpl2');
  },
};

// Choosing an option updates the value and emits composed events.
export const EmitsComposedEvents: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();
    let inputs = 0;
    let changes = 0;
    select.addEventListener('input', () => inputs++);
    select.addEventListener('change', () => changes++);

    const inner = control(select);
    inner.value = 'mit';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inner.dispatchEvent(new Event('change', { bubbles: true }));
    await wait();

    expect(inputs).toBe(1);
    expect(changes).toBe(1);
    expect(select.value).toBe('mit');
  },
};

// Form association and reset.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-select name="licence" label="Licence" value="mit">
        ${licences}
      </moz-select>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const select = el(canvasElement);
    await wait(50);
    expect(new FormData(form).get('licence')).toBe('mit');

    select.value = 'apache2';
    await wait();
    expect(new FormData(form).get('licence')).toBe('apache2');

    form.reset();
    await wait(50);
    expect(select.value).toBe('mit');
  },
};

// A disabled option can't be chosen, and a hidden one isn't offered.
export const DisabledAndHiddenOptions: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-select label="Status" value="draft">
      <moz-option value="draft" label="Draft"></moz-option>
      <moz-option value="review" label="In review" disabled></moz-option>
      <moz-option value="internal" label="Internal" hidden></moz-option>
    </moz-select>
  `,
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait(50);
    const options = [...control(select).options];
    expect(options.find((o) => o.value === 'review')?.disabled).toBe(true);
    expect(options.find((o) => o.value === 'internal')?.hidden).toBe(true);
  },
};

// Required with no selection is invalid; the base mirrors it from the control.
export const Validation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-select label="Licence" required value="">
      <moz-option value="" label="Choose…"></moz-option>
      <moz-option value="mit" label="MIT"></moz-option>
    </moz-select>
  `,
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await wait(50);
    expect(select.checkValidity()).toBe(false);
    expect(select.validity.valueMissing).toBe(true);

    select.value = 'mit';
    await wait();
    expect(select.checkValidity()).toBe(true);
  },
};

// selectedOption exposes the harvested option behind the current value.
export const SelectedOption: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();
    expect(select.selectedOption?.label).toBe('MPL 2.0');

    select.value = 'other';
    await select.updateComplete;
    expect(select.selectedOption?.label).toBe('Something else');
  },
};

// A leading icon must reserve room, or the selected label renders underneath it.
export const IconReservesSpace: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();

    const field = () => select.shadowRoot!.querySelector('.field')!;
    const padStart = () =>
      Number.parseFloat(getComputedStyle(control(select)).paddingInlineStart);

    expect(field().classList.contains('with-icon')).toBe(false);
    const bare = padStart();

    select.iconStart = 'shield';
    await select.updateComplete;
    expect(field().classList.contains('with-icon')).toBe(true);
    const withIcon = padStart();

    // Room for the icon plus a gap, so the label clears it.
    const iconWidth = select
      .shadowRoot!.querySelector('.icon')!
      .getBoundingClientRect().width;
    expect(withIcon).toBeGreaterThan(bare + iconWidth);
  },
};

// The two variants are a styling split only, so lock the properties that
// actually distinguish them rather than relying on a snapshot to notice.
export const VariantStyling: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();
    const styleOf = () => getComputedStyle(control(select));

    const standard = {
      weight: styleOf().fontWeight,
      radius: Number.parseFloat(styleOf().borderStartStartRadius),
    };

    select.variant = 'pill';
    await select.updateComplete;
    const pill = {
      weight: styleOf().fontWeight,
      radius: Number.parseFloat(styleOf().borderStartStartRadius),
    };

    // Nova's --select-font-weight is 600 and --select-border-radius is 24px.
    expect(Number(pill.weight)).toBeGreaterThan(Number(standard.weight));
    expect(pill.radius).toBeGreaterThan(standard.radius);

    // The pill hugs its content; the standard field fills the form column.
    select.variant = 'standard';
    await select.updateComplete;
    const standardWidth = select.getBoundingClientRect().width;
    select.variant = 'pill';
    await select.updateComplete;
    expect(select.getBoundingClientRect().width).toBeLessThan(standardWidth);
  },
};

// The empty state stays empty and fails `required`, and the prompt can't be
// selected back into.
export const PlaceholderHoldsEmptyState: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-select
        name="licence"
        label="Licence"
        placeholder="Choose a licence…"
        required
      >
        ${licences}
      </moz-select>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const select = el(canvasElement);
    await select.updateComplete;
    await wait(50);

    // Empty, not silently holding the first option.
    expect(select.value).toBe('');
    expect(control(select).value).toBe('');
    expect(new FormData(form).get('licence')).toBe('');
    expect(select.checkValidity()).toBe(false);
    expect(select.validity.valueMissing).toBe(true);

    // The prompt is the first option, and is unreachable by selection.
    const first = control(select).options[0];
    expect(first.textContent?.trim()).toBe('Choose a licence…');
    expect(first.disabled).toBe(true);
    expect(first.hidden).toBe(true);

    select.value = 'mit';
    await wait();
    expect(select.checkValidity()).toBe(true);
    expect(new FormData(form).get('licence')).toBe('mit');
  },
};

// The contrast: with no placeholder, an unset value adopts the first option.
export const WithoutPlaceholderAdoptsFirst: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-select label="Licence" name="licence">${licences}</moz-select>
  `,
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait(50);
    expect(select.value).toBe('mpl2');

    // Adding a placeholder is what makes the empty state representable.
    select.placeholder = 'Choose a licence…';
    select.value = '';
    await wait(50);
    expect(select.value).toBe('');
    expect(control(select).value).toBe('');
  },
};

// The unselected state is dimmed, like a text input's placeholder.
export const PlaceholderIsDimmed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: '', placeholder: 'Choose a licence…' },
  play: async ({ canvasElement }) => {
    const select = el(canvasElement);
    await select.updateComplete;
    await wait();
    const colourOf = () => getComputedStyle(control(select)).color;

    expect(control(select).classList.contains('placeholder-shown')).toBe(true);
    const empty = colourOf();

    select.value = 'mit';
    await select.updateComplete;
    expect(control(select).classList.contains('placeholder-shown')).toBe(false);
    expect(colourOf()).not.toBe(empty);
  },
};
