import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import { logEvents } from '../../../.storybook/story-actions';
import './moz-radio-group';
import '../moz-radio/moz-radio';
import '../moz-fieldset/moz-fieldset';
import '../moz-provider/moz-provider';

interface GroupArgs {
  label: string;
  name: string;
  value?: string;
  description?: string;
  error?: string;
  disabled: boolean;
  required: boolean;
  orientation: 'vertical' | 'horizontal';
}

const meta: Meta<GroupArgs> = {
  title: 'Components/Radio/Radio Group',
  component: 'moz-radio-group',
  tags: ['autodocs'],
  decorators: [logEvents('change')],
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    orientation: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal'],
    },
  },
  args: {
    label: 'Update channel',
    name: 'channel',
    value: 'release',
    disabled: false,
    required: false,
    orientation: 'vertical',
  },
  render: (args) => html`
    <moz-radio-group
      label=${args.label}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
      description=${ifDefined(args.description)}
      error=${ifDefined(args.error)}
      orientation=${args.orientation}
      ?disabled=${args.disabled}
      ?required=${args.required}
    >
      <moz-radio value="release" label="Release"></moz-radio>
      <moz-radio value="beta" label="Beta"></moz-radio>
      <moz-radio value="nightly" label="Nightly"></moz-radio>
    </moz-radio-group>
  `,
};

export default meta;
type Story = StoryObj<GroupArgs>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: 'Choose how often you get updates.' },
};

export const WithError: Story = {
  args: { value: undefined, error: 'Pick an update channel.' },
};

export const Horizontal: Story = { args: { orientation: 'horizontal' } };

export const Disabled: Story = { args: { disabled: true } };

// Required marks the legend and reports validity at the group level.
export const Required: Story = { args: { required: true, value: undefined } };

// Each option can take an access key, underlined in its label.
export const WithAccessKey: Story = {
  render: () => html`
    <moz-radio-group label="Update channel" name="channel" value="release">
      <moz-radio value="release" label="Release" accesskey="r"></moz-radio>
      <moz-radio value="beta" label="Beta" accesskey="b"></moz-radio>
      <moz-radio value="nightly" label="Nightly" accesskey="n"></moz-radio>
    </moz-radio-group>
  `,
};

// --- interaction tests ---

const wait = () => new Promise((r) => setTimeout(r, 20));

// Clicking an option selects it and deselects the rest; the group value follows.
export const Selects: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(group.value).toBe('release');
    expect(radios[0].checked).toBe(true);

    radios[2].shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(radios[2].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
    expect(group.value).toBe('nightly');
  },
};

// Arrow keys move selection (wrapping) and follow focus — the ARIA radio pattern.
export const ArrowKeys: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    // Only the selected option is a tab stop.
    expect(radios[0].itemTabIndex).toBe(0);
    expect(radios[1].itemTabIndex).toBe(-1);

    radios[0].shadowRoot!.querySelector('input')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
      }),
    );
    await wait();
    expect(radios[1].checked).toBe(true);
    expect(group.value).toBe('beta');
    expect(radios[1].itemTabIndex).toBe(0);

    // Back to the first.
    radios[1].shadowRoot!.querySelector('input')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        composed: true,
      }),
    );
    await wait();
    expect(radios[0].checked).toBe(true);

    // Up from the first wraps to the last.
    radios[0].shadowRoot!.querySelector('input')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        composed: true,
      }),
    );
    await wait();
    expect(radios[radios.length - 1].checked).toBe(true);
  },
};

// Keyboard selection emits a group `change` just like a click, so listeners and
// React onChange wrappers fire — not only on mouse activation.
export const ArrowKeyFiresChange: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    let changes = 0;
    let lastValue: string | undefined;
    group.addEventListener('change', () => {
      changes += 1;
      lastValue = group.value;
    });
    radios[0].shadowRoot!.querySelector('input')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
      }),
    );
    await wait();
    expect(changes).toBe(1);
    expect(lastValue).toBe('beta');
  },
};

// Form association: the selected value submits under the shared name; reset
// restores the initially-checked option.
export const InForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-radio-group label="Channel" name="channel" value="beta">
        <moz-radio value="release" label="Release"></moz-radio>
        <moz-radio value="beta" label="Beta"></moz-radio>
      </moz-radio-group>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(new FormData(form).get('channel')).toBe('beta');

    radios[0].shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(new FormData(form).get('channel')).toBe('release');

    // Reset restores the initial selection (which came from the group's value,
    // not a per-option `checked`) and keeps the options in sync with it.
    form.reset();
    await wait();
    expect(group.value).toBe('beta');
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
    expect(new FormData(form).get('channel')).toBe('beta');
  },
};

// Setting the group value selects the matching option.
export const ValueControls: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    group.value = 'beta';
    await group.updateComplete;
    await wait();
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  },
};

// Disabled propagates to every option.
export const DisablesOptions: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    group.disabled = true;
    await wait();
    expect(radios.every((r) => r.isDisabled)).toBe(true);
  },
};

// Disabling the selected option dynamically moves the tab stop to an enabled one
// so the group stays keyboard-reachable.
export const DisablingSelectedMovesTabStop: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(radios[0].itemTabIndex).toBe(0);

    radios[0].disabled = true;
    await radios[0].updateComplete;
    await wait();
    expect(radios[0].itemTabIndex).toBe(-1);
    expect(radios.some((r) => r.itemTabIndex === 0 && !r.isDisabled)).toBe(
      true,
    );
  },
};

// An option removed from the group gets its container-owned state handed back,
// so it isn't stuck disabled or unreachable if reused.
export const RestoresRemovedOption: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="Sync" name="sync" value="a" disabled>
      <moz-radio value="a" label="A"></moz-radio>
      <moz-radio value="b" label="B"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const option = [...group.querySelectorAll('moz-radio')][1];
    await group.updateComplete;
    await wait();
    expect(option.isDisabled).toBe(true);
    expect(option.name).toBe('sync');

    option.remove();
    await wait();
    expect(option.parentDisabled).toBe(false);
    expect(option.itemTabIndex).toBe(0);
    expect(option.name).toBeUndefined();
  },
};

// A disabled group submits nothing, matching native; re-enabling restores it.
export const DisabledGroupSubmitsNothing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <form>
      <moz-radio-group label="Channel" name="channel" value="beta">
        <moz-radio value="release" label="Release"></moz-radio>
        <moz-radio value="beta" label="Beta"></moz-radio>
      </moz-radio-group>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const group = canvasElement.querySelector('moz-radio-group')!;
    await group.updateComplete;
    await wait();
    expect(new FormData(form).get('channel')).toBe('beta');

    group.disabled = true;
    await wait();
    expect(new FormData(form).get('channel')).toBeNull();

    group.disabled = false;
    await wait();
    expect(new FormData(form).get('channel')).toBe('beta');
  },
};

// Duplicate option values are a misconfiguration; the group warns about them.
export const WarnsOnDuplicateValues: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    await group.updateComplete;
    await wait();

    const original = console.warn;
    let warning = '';
    console.warn = (msg: unknown) => {
      warning = String(msg);
    };
    try {
      const dup = document.createElement('moz-radio');
      dup.setAttribute('value', 'release');
      dup.setAttribute('label', 'Duplicate');
      group.appendChild(dup);
      await wait();
    } finally {
      console.warn = original;
    }
    expect(warning).toContain('duplicate option value');
  },
};

// Group-level required: invalid until any option is chosen (native radio-group
// required can't work across the options' separate shadow roots).
export const RequiredValidation: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="Channel" name="channel" required>
      <moz-radio value="release" label="Release"></moz-radio>
      <moz-radio value="beta" label="Beta"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(group.checkValidity()).toBe(false);
    expect(group.validity.valueMissing).toBe(true);

    radios[0].shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(group.checkValidity()).toBe(true);
  },
};

// A disabled required group can't be operated, so it never blocks validation.
export const DisabledRequiredIsValid: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="Channel" name="channel" required disabled>
      <moz-radio value="release" label="Release"></moz-radio>
      <moz-radio value="beta" label="Beta"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    await group.updateComplete;
    await wait();
    expect(group.checkValidity()).toBe(true);
  },
};

// Restoring an option's checked state (bfcache/autofill) syncs the group's value
// and tab stop, not just that option.
export const RestoreSyncsGroup: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    radios[2].formStateRestoreCallback('on');
    await wait();
    expect(group.value).toBe('nightly');
    expect(radios[2].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
    expect(radios[2].itemTabIndex).toBe(0);
  },
};

// The group updates in the capture phase, so an option's own change listener
// already sees the settled group value and a single checked option.
export const UpdatesBeforeOptionListeners: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    let seenValue: string | undefined;
    let seenCheckedCount = -1;
    radios[1].addEventListener('change', () => {
      seenValue = group.value;
      seenCheckedCount = radios.filter((r) => r.checked).length;
    });
    radios[1].shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(seenValue).toBe('beta');
    expect(seenCheckedCount).toBe(1);
  },
};

// A disabled ancestor fieldset disables the options without touching the group's
// author-controlled `disabled`.
export const InDisabledFieldset: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <fieldset disabled>
      <moz-radio-group label="Channel" name="channel" value="beta">
        <moz-radio value="release" label="Release"></moz-radio>
        <moz-radio value="beta" label="Beta"></moz-radio>
      </moz-radio-group>
    </fieldset>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(group.disabled).toBe(false);
    expect(radios.every((r) => r.isDisabled)).toBe(true);
  },
};

// A change from interactive content in an option's slot doesn't select it.
export const IgnoresChangeFromSlotContent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="X" name="x" value="a">
      <moz-radio value="a" label="A"></moz-radio>
      <moz-radio value="b" label="B">
        <select slot="description" aria-label="Amount">
          <option>1</option>
          <option>2</option>
        </select>
      </moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const select = group.querySelector('select')!;
    await group.updateComplete;
    await wait();
    let falseGroupChange = false;
    group.addEventListener('change', (e) => {
      // The nested control's own change bubbles past (target stays the select);
      // what must not happen is the group re-emitting it as its own selection.
      if (e.target === group) falseGroupChange = true;
    });
    select.value = '2';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await wait();
    expect(group.value).toBe('a');
    expect(falseGroupChange).toBe(false);
  },
};

// A disabled moz-fieldset container disables the group's options without
// touching the group's own `disabled`.
export const InDisabledMozFieldset: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-fieldset label="Settings" disabled>
      <moz-radio-group label="Channel" name="channel" value="beta">
        <moz-radio value="release" label="Release"></moz-radio>
        <moz-radio value="beta" label="Beta"></moz-radio>
      </moz-radio-group>
    </moz-fieldset>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(group.disabled).toBe(false);
    expect(group.parentDisabled).toBe(true);
    expect(radios.every((r) => r.isDisabled)).toBe(true);
  },
};

// Arrow keys from focusable content in an option's slot don't move selection.
export const IgnoresKeysFromSlotContent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="X" name="x" value="a">
      <moz-radio value="a" label="A">
        <a slot="description" href="#link">Learn more</a>
      </moz-radio>
      <moz-radio value="b" label="B"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const link = group.querySelector('a')!;
    await group.updateComplete;
    await wait();
    link.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
      }),
    );
    await wait();
    expect(group.value).toBe('a');
  },
};

// Setting the value to something no option matches must not leave the old
// selection as the tab stop; the roving stop falls back to the first option.
export const UnmatchedValueResetsTabStop: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    group.value = 'beta';
    await group.updateComplete;
    await wait();
    expect(radios[1].itemTabIndex).toBe(0);

    group.value = 'does-not-exist';
    await group.updateComplete;
    await wait();
    expect(radios.some((r) => r.checked)).toBe(false);
    expect(radios[1].itemTabIndex).toBe(-1);
    expect(radios[0].itemTabIndex).toBe(0);
  },
};

// Removing the checked option from a required group changes whether it's
// satisfied, so validity must be recomputed on the slot change.
export const RemovingCheckedOptionInvalidates: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="Channel" name="channel" value="release" required>
      <moz-radio value="release" label="Release"></moz-radio>
      <moz-radio value="beta" label="Beta"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const selected = group.querySelector('moz-radio[value="release"]')!;
    await group.updateComplete;
    await wait();
    expect(group.checkValidity()).toBe(true);

    selected.remove();
    await wait();
    expect(group.checkValidity()).toBe(false);
    expect(group.validity.valueMissing).toBe(true);
  },
};

// Disabling the selected option drops the tab stop; re-enabling it restores the
// tab stop to that option rather than stranding it on the first one.
export const ReEnablingSelectedRestoresTabStop: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(radios[0].checked).toBe(true);
    expect(radios[0].itemTabIndex).toBe(0);

    radios[0].disabled = true;
    await radios[0].updateComplete;
    await wait();
    expect(radios[0].itemTabIndex).toBe(-1);

    radios[0].disabled = false;
    await radios[0].updateComplete;
    await wait();
    expect(radios[0].itemTabIndex).toBe(0);
    expect(radios[1].itemTabIndex).toBe(-1);
  },
};

// An empty string is a real value, not "no selection": a non-first option with
// value="" is selected and holds the tab stop.
export const EmptyStringValueSelectable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="Level" name="level" value="">
      <moz-radio value="high" label="High"></moz-radio>
      <moz-radio value="" label="None"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(group.hasValue).toBe(true);
    expect(radios[1].checked).toBe(true);
    expect(radios[1].itemTabIndex).toBe(0);
    expect(radios[0].itemTabIndex).toBe(-1);
  },
};

// Moving an option into another group binds it to the new owner: interacting
// updates the new group, not the one it left.
export const ReparentedRadioBindsNewGroup: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => html`
    <moz-radio-group label="A" name="a">
      <moz-radio value="x" label="X"></moz-radio>
      <moz-radio value="y" label="Y"></moz-radio>
    </moz-radio-group>
    <moz-radio-group label="B" name="b">
      <moz-radio value="p" label="P"></moz-radio>
    </moz-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const [groupA, groupB] = [
      ...canvasElement.querySelectorAll('moz-radio-group'),
    ];
    const moved = groupA.querySelector('moz-radio')!;
    await groupA.updateComplete;
    await groupB.updateComplete;
    await wait();

    groupB.appendChild(moved);
    await wait();
    moved.shadowRoot!.querySelector('input')!.click();
    await wait();
    expect(groupB.value).toBe('x');
    expect(groupA.value).toBeUndefined();
  },
};

// Reassigning a selected option's value carries the group's value with it,
// instead of leaving the group pointing at the old (now unmatched) value.
export const SelectedValueChangeSyncsGroup: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('moz-radio-group')!;
    const radios = [...group.querySelectorAll('moz-radio')];
    await group.updateComplete;
    await wait();
    expect(group.value).toBe('release');

    radios[0].value = 'release-next';
    await radios[0].updateComplete;
    await wait();
    expect(group.value).toBe('release-next');
    expect(radios[0].checked).toBe(true);
  },
};
