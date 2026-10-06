// Foundation tokens + base styles, then the components this page uses.
import '../../src/generated/tokens.css';
import '../../src/base.css';
import '../../src/components/moz-button/moz-button';
import '../../src/components/moz-checkbox/moz-checkbox';
import '../../src/components/moz-fieldset/moz-fieldset';
import '../../src/components/moz-input-file/moz-input-file';
import '../../src/components/moz-input-text/moz-input-text';
import '../../src/components/moz-message-bar/moz-message-bar';
import '../../src/components/moz-select/moz-select';
import '../../src/components/moz-status-badge/moz-status-badge';
import '../../src/components/moz-textarea/moz-textarea';
import '../../src/components/moz-visual-picker/moz-visual-picker';

import type { MozInputFile } from '../../src/components/moz-input-file/moz-input-file';

const form = document.querySelector<HTMLFormElement>('#version-form');
const summary = document.querySelector<HTMLElement>('#summary');
const success = document.querySelector<HTMLElement>('#success');
const packageInput = document.querySelector<MozInputFile>('#package');
const buttons = [
  ...document.querySelectorAll<HTMLElement>('.actions moz-button'),
];

if (form && summary && success && packageInput) {
  /**
   * Every control here is form-associated through `ElementInternals`, so the
   * platform already knows which ones are invalid. Collect them in DOM order
   * rather than tracking state ourselves — `elements` includes custom elements
   * that set `formAssociated`.
   */
  const invalidControls = () =>
    [...form.elements].filter(
      (el): el is HTMLElement & { checkValidity(): boolean } =>
        'checkValidity' in el &&
        typeof (el as { checkValidity: unknown }).checkValidity ===
          'function' &&
        !(el as { checkValidity(): boolean }).checkValidity(),
    );

  // The accessible name a control already renders, so the summary doesn't need
  // its own copy of the labels.
  const labelOf = (el: HTMLElement) =>
    el.getAttribute('label') ?? el.getAttribute('name') ?? 'This field';

  const clearMessages = () => {
    summary.hidden = true;
    success.hidden = true;
  };

  /**
   * The error summary is the one piece a form wrapper would have given us, and
   * it's ~15 lines: list what failed, link each entry to its control, and move
   * focus to the first. Worth owning in the app, because the copy and placement
   * are app decisions.
   */
  const showSummary = (controls: HTMLElement[]) => {
    const list = document.createElement('ol');
    for (const control of controls) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = labelOf(control);
      link.addEventListener('click', (event) => {
        event.preventDefault();
        control.focus();
      });
      item.append(link);
      list.append(item);
    }

    // moz-message-bar takes `heading` as a property and the body in its default
    // slot, so the count is the heading and the list is the slotted content.
    summary.setAttribute(
      'heading',
      `${controls.length} field${controls.length === 1 ? '' : 's'} need attention`,
    );
    summary.replaceChildren(list);
    summary.hidden = false;
    controls[0]?.focus();
  };

  const setBusy = (busy: boolean) => {
    for (const button of buttons) button.toggleAttribute('disabled', busy);
    // aria-busy on the form tells AT the region is updating without stealing
    // focus the way a live region would.
    form.setAttribute('aria-busy', String(busy));
  };

  /**
   * `novalidate` on the form suppresses the browser's own bubbles so the
   * summary is the single place errors appear. Validity still works — it's
   * reporting that's turned off — so `checkValidity()` is unaffected.
   */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessages();

    const invalid = invalidControls();
    if (invalid.length) {
      showSummary(invalid);
      return;
    }

    // FormData covers everything that submits a string. `moz-input-file` is a
    // deliberate exception — `File` objects can't be a string `value`, so it
    // contributes nothing and its files are read off the element.
    const data = new FormData(form);
    const payload = {
      ...Object.fromEntries(
        [...data.entries()].map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ]),
      ),
      files: packageInput.files.map((file) => file.name),
    };

    setBusy(true);
    try {
      // Stand-in for the real request.
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log('would submit', payload);
      success.hidden = false;
    } catch (error) {
      summary.removeAttribute('heading');
      summary.textContent = 'Could not submit. Please try again.';
      summary.hidden = false;
      console.error(error);
    } finally {
      setBusy(false);
    }
  });

  // Native reset restores every control's default, including the pickers and
  // the file input, so there's nothing to undo by hand.
  form.addEventListener('reset', clearMessages);

  // A rejected file isn't a validation failure — it never became a value — so
  // it's reported separately rather than through the summary.
  packageInput.addEventListener('moz-input-file:rejected', (event) => {
    const { file, reason } = (
      event as CustomEvent<{ file: File; reason: string }>
    ).detail;
    packageInput.setAttribute(
      'error',
      reason === 'size'
        ? `${file.name} is too large.`
        : `${file.name} isn't a .zip or .xpi.`,
    );
  });

  packageInput.addEventListener('change', () =>
    packageInput.removeAttribute('error'),
  );
}
