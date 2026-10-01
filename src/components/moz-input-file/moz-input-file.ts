import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import fieldWidth from '../../base/field-width.css';
import { MozBaseInputElement } from '../../base/input-element';
import { slotHasContent } from '../../base/slots';
import inputTokens from '../../generated/component-tokens/input.css';
import linkTokens from '../../generated/component-tokens/link.css';
import '../moz-button/moz-button';
import styles from './moz-input-file.css';

/** Why a file was turned away. */
export type FileRejectReason = 'type' | 'size';

export interface InputFileRejectedDetail {
  file: File;
  reason: FileRejectReason;
  /** The `accept` list in force, for a `type` rejection. */
  accept?: string;
  /** The `max-size` in force, for a `size` rejection. */
  maxSize?: number;
}

/** How the pointer's payload reads against `accept`, while it's over the zone. */
type DragState = 'idle' | 'accepted' | 'forbidden';

const KB = 1024;
const UNITS = ['bytes', 'KB', 'MB', 'GB', 'TB'];

/** Format bytes with 1024-based units, matching how desktop platforms read. */
export function formatFileSize(bytes: number): string {
  if (bytes < KB) return `${bytes} ${UNITS[0]}`;
  let size = bytes;
  let unit = 0;
  while (size >= KB && unit < UNITS.length - 1) {
    size /= KB;
    unit += 1;
  }
  // One decimal, but not a trailing `.0` — "1.5 MB", "200 MB".
  const rounded = Math.round(size * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
}

/**
 * File picker: a drop zone that also opens the file dialog, since Figma gives
 * it no separate button-and-filename resting state.
 *
 * A UI control rather than a form field — `File` objects can't be expressed as
 * a string `value`, so nothing is submitted with a surrounding form. Read
 * `files` and upload them yourself.
 *
 * Files failing `accept` or `max-size` are reported as
 * `moz-input-file:rejected` rather than rendered as an error, so the message
 * can be placed where it belongs (a `moz-message-bar`, or this control's own
 * `error`).
 *
 * `required` is not enforced. The native input is cleared after every pick so
 * the same file can be chosen twice, which would leave a `required` input
 * permanently invalid — honouring it needs a validity seam on the base.
 *
 * @slot hint - Replaces the derived "Max … · .zip or .xpi" line.
 * @csspart zone - The dashed drop zone.
 * @csspart trigger - The "browse files" control.
 * @csspart file - A selected file's row.
 * @fires change - Composed; the selection changed.
 * @fires moz-input-file:rejected - A file was turned away.
 */
export class MozInputFile extends MozBaseInputElement {
  // linkTokens supply the accent colours for the link-styled browse control;
  // they live on moz-link's :host, so they aren't otherwise in scope here.
  static styles = [
    ...MozBaseInputElement.styles,
    inputTokens,
    linkTokens,
    fieldWidth,
    styles,
  ];
  static inputLayout = 'block' as const;

  /** Fill the container instead of the default 320px width. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /** Native accept list: MIME types and/or extensions, comma separated. */
  @property() accept = '';

  /** Allow more than one file. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Largest accepted file, in bytes. Enforced here, not by the platform. */
  @property({ type: Number, attribute: 'max-size' }) maxSize?: number;

  /** Prompt shown in the empty zone. */
  @property() placeholder = 'Drag & drop your file, or';

  /** Label for the control that opens the file dialog. */
  @property({ attribute: 'browse-label' }) browseLabel = 'browse files';

  @state() private selected: File[] = [];
  @state() private dragState: DragState = 'idle';
  @state() private hasHintSlot = false;

  #recentDragEnter = false;

  /** The chosen files. Empty until something is picked or dropped. */
  get files(): File[] {
    return this.selected;
  }

  // The native input is hidden, so focus belongs on the visible trigger.
  override focus(options?: FocusOptions): void {
    const trigger =
      this.renderRoot?.querySelector<HTMLElement>('.trigger') ?? null;
    if (trigger) trigger.focus(options);
    else super.focus(options);
  }

  protected get submissionValue(): string | null {
    return null;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // A drop that misses the zone would otherwise navigate the page to the file.
    document.addEventListener('dragover', this.#preventDocumentDrag);
    document.addEventListener('drop', this.#preventDocumentDrag);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('dragover', this.#preventDocumentDrag);
    document.removeEventListener('drop', this.#preventDocumentDrag);
  }

  #preventDocumentDrag = (event: DragEvent) => {
    event.preventDefault();
    if (event.type === 'dragover' && event.dataTransfer) {
      event.dataTransfer.dropEffect = 'none';
    }
  };

  get #acceptedTypes(): Set<string> {
    return new Set(
      this.accept
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry && !entry.startsWith('.')),
    );
  }

  get #acceptedExtensions(): Set<string> {
    return new Set(
      this.accept
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.startsWith('.')),
    );
  }

  #matchesAccept(file: File): boolean {
    if (!this.accept) return true;
    if (this.#acceptedTypes.has(file.type)) return true;
    const dot = file.name.lastIndexOf('.');
    if (dot === -1) return false;
    return this.#acceptedExtensions.has(file.name.slice(dot).toLowerCase());
  }

  /**
   * Whether to welcome the drag. A filename isn't readable during `dragover`,
   * so an extension-only `accept` has to be taken on trust and checked on drop
   * — which also covers engines mistyping a file (Firefox reports CSV as
   * `application/vnd.ms-excel`, bug 2038901).
   */
  #welcomesDrag(transfer: DataTransfer): boolean {
    if (!this.accept) return true;
    const item = transfer.items[0];
    if (item?.kind !== 'file') return false;
    if (!item.type) return true;
    if (this.#acceptedTypes.has(item.type)) return true;
    return this.#acceptedExtensions.size > 0;
  }

  #reject(file: File, reason: FileRejectReason): void {
    this.dispatchEvent(
      new CustomEvent<InputFileRejectedDetail>('moz-input-file:rejected', {
        bubbles: true,
        composed: true,
        detail: {
          file,
          reason,
          accept: reason === 'type' ? this.accept : undefined,
          maxSize: reason === 'size' ? this.maxSize : undefined,
        },
      }),
    );
  }

  /** Keep the files that pass, and report each one that doesn't. */
  #accept(candidates: File[]): void {
    const kept: File[] = [];
    for (const file of candidates) {
      if (!this.#matchesAccept(file)) {
        this.#reject(file, 'type');
      } else if (this.maxSize !== undefined && file.size > this.maxSize) {
        this.#reject(file, 'size');
      } else {
        kept.push(file);
      }
    }
    if (!kept.length) return;
    this.selected = this.multiple ? [...this.selected, ...kept] : [kept[0]];
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  /** Drop the selection and report the change. */
  clear(): void {
    if (!this.selected.length) return;
    this.selected = [];
    const input = this.inputEl;
    if (input) input.value = '';
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  #onDragOver = (event: DragEvent) => {
    if (!event.dataTransfer || this.isDisabled) return;
    event.preventDefault();
    // Without this the document handler above resets dropEffect to "none".
    event.stopPropagation();
    const welcome = this.#welcomesDrag(event.dataTransfer);
    event.dataTransfer.dropEffect = welcome ? 'copy' : 'none';
    this.dragState = welcome ? 'accepted' : 'forbidden';
  };

  #onDragEnter = (event: DragEvent) => {
    this.#recentDragEnter = true;
    // Crossing a child boundary fires dragleave in the same gesture as
    // dragenter, so it sees this flag; a genuine leave arrives after the frame.
    requestAnimationFrame(() => {
      this.#recentDragEnter = false;
    });
    this.#onDragOver(event);
  };

  #onDragLeave = () => {
    if (this.#recentDragEnter) return;
    this.dragState = 'idle';
  };

  #onDrop = (event: DragEvent) => {
    event.preventDefault();
    this.dragState = 'idle';
    if (!event.dataTransfer || this.isDisabled) return;
    const dropped = [...event.dataTransfer.files];
    this.#accept(this.multiple ? dropped : dropped.slice(0, 1));
  };

  #onZoneClick = (event: MouseEvent) => {
    const input = this.inputEl;
    if (!input || this.isDisabled) return;
    // The input's own click bubbles back here, and forwarding would recurse.
    if (event.composedPath().includes(input)) return;
    input.click();
  };

  #onPick = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const picked = [...(input.files ?? [])];
    // Reset so choosing the same file again still fires change.
    input.value = '';
    this.#accept(picked);
  };

  // Remove lives inside the zone, so its click would bubble to the zone
  // handler and reopen the file dialog.
  #onRemove = (event: Event) => {
    event.stopPropagation();
    this.clear();
  };

  #onHintSlotChange = (event: Event) => {
    this.hasHintSlot = slotHasContent(event.target as HTMLSlotElement);
  };

  /** The derived "Max 200 MB · .zip or .xpi" line. */
  get #hint(): string | undefined {
    const parts: string[] = [];
    if (this.maxSize !== undefined) {
      parts.push(`Max ${formatFileSize(this.maxSize)}`);
    }
    const extensions = [...this.#acceptedExtensions];
    if (extensions.length === 1) parts.push(extensions[0]);
    else if (extensions.length > 1) {
      parts.push(
        `${extensions.slice(0, -1).join(', ')} or ${extensions.at(-1)}`,
      );
    }
    return parts.length ? parts.join(' · ') : undefined;
  }

  #fileTemplate(file: File) {
    return html`<span class="file" part="file">
      <span class="file-name">${file.name}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
    </span>`;
  }

  #zoneContentTemplate() {
    if (this.selected.length) {
      return html`<span class="files"
          >${this.selected.map((file) => this.#fileTemplate(file))}</span
        >
        <moz-button
          class="remove"
          size="small"
          @click=${this.#onRemove}
          ?disabled=${this.isDisabled}
          >Remove</moz-button
        >`;
    }

    return html`<span class="prompt">
        ${this.placeholder}
        <button
          class="trigger"
          part="trigger"
          type="button"
          ?disabled=${this.isDisabled}
        >
          ${this.browseLabel}
        </button>
      </span>
      <span class="hint" ?hidden=${!this.#hint && !this.hasHintSlot}>
        <slot name="hint" @slotchange=${this.#onHintSlotChange}
          >${this.#hint ?? nothing}</slot
        >
      </span>`;
  }

  protected inputTemplate() {
    // The outline is an SVG stroke rather than a CSS border: the design
    // specifies the dash pattern, and border-style: dashed can't set one.
    return html`<div
      class="zone ${this.dragState} ${this.selected.length ? 'filled' : ''}"
      part="zone"
      @click=${this.#onZoneClick}
      @dragenter=${this.#onDragEnter}
      @dragover=${this.#onDragOver}
      @dragleave=${this.#onDragLeave}
      @drop=${this.#onDrop}
    >
      <svg class="outline" aria-hidden="true">
        <rect width="100%" height="100%" rx="12" />
      </svg>
      <input
        id="input"
        part="input"
        class="visually-hidden"
        type="file"
        name=${ifDefined(this.name)}
        accept=${ifDefined(this.accept || undefined)}
        aria-label=${ifDefined(this.inputAriaLabel ?? undefined)}
        aria-describedby=${ifDefined(this.describedBy)}
        aria-invalid=${ifDefined(this.error ? 'true' : undefined)}
        tabindex="-1"
        ?multiple=${this.multiple}
        ?disabled=${this.isDisabled}
        @change=${this.#onPick}
      />
      ${this.#zoneContentTemplate()}
    </div>`;
  }
}

if (!customElements.get('moz-input-file')) {
  customElements.define('moz-input-file', MozInputFile);
}

declare global {
  interface HTMLElementTagNameMap {
    'moz-input-file': MozInputFile;
  }
}
