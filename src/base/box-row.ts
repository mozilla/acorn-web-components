import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '../components/moz-icon/moz-icon';
import type { IconName } from '../generated/icons';
import { MozLitElement } from './moz-lit-element';

export type BoxLayout = 'default' | 'medium-icon' | 'large-icon';

/**
 * Shared base for the box row components (moz-box-item / -button / -link): a
 * leading icon, label, and description laid out in the grid from box-row.css.
 * Each subclass wraps this text content in its own container (div, button, a).
 *
 * @csspart label - the row label text.
 * @csspart description - the secondary description text below the label.
 */
export abstract class MozBoxRow extends MozLitElement {
  /** Row label. */
  @property() label?: string;

  /** Secondary text shown below the label. */
  @property() description?: string;

  /** Leading icon shown before the label. */
  @property({ attribute: 'icon-start' }) iconStart?: IconName;

  /** Icon layout: larger icons via `medium-icon` / `large-icon`. */
  @property({ reflect: true }) layout: BoxLayout = 'default';

  protected renderText(): TemplateResult {
    return html`
      <div
        class=${classMap({
          'text-content': true,
          'has-icon': !!this.iconStart,
          'has-description': !!this.description,
        })}
      >
        ${
          this.iconStart
            ? html`<moz-icon class="icon" name=${this.iconStart}></moz-icon>`
            : nothing
        }
        <span class="label" part="label">${this.label}</span>
        ${
          this.description
            ? html`<span class="description" part="description"
                >${this.description}</span
              >`
            : nothing
        }
      </div>
    `;
  }
}
