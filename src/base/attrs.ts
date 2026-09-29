import { nothing } from 'lit';
import {
  Directive,
  directive,
  type ElementPart,
  type PartInfo,
  PartType,
} from 'lit/directive.js';

export type AttrValue = string | number | boolean | undefined | null;

/**
 * Apply a record of attributes to an element, by name. Lit can only bind
 * attribute names known at author time, so this is what lets a subclass add
 * native constraints (`min`, `max`, `step`, `accept`) to a control its parent
 * class renders, instead of re-declaring the whole field template.
 *
 * `undefined` / `null` / `false` omit the attribute; `true` renders it bare.
 * Attributes that disappear between renders are removed, so the element never
 * keeps a stale constraint — which matters because validity is mirrored from
 * the live control.
 *
 *   html`<input ${attrs({ min: this.min, step: this.step })} />`
 */
class AttrsDirective extends Directive {
  #applied = new Set<string>();

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('attrs() can only be used on an element');
    }
  }

  render(_values: Record<string, AttrValue>) {
    return nothing;
  }

  override update(part: ElementPart, [values]: [Record<string, AttrValue>]) {
    const element = part.element;
    const next = new Set<string>();

    for (const [name, value] of Object.entries(values)) {
      if (value === undefined || value === null || value === false) continue;
      next.add(name);
      const attribute = value === true ? '' : String(value);
      if (element.getAttribute(name) !== attribute) {
        element.setAttribute(name, attribute);
      }
    }

    for (const name of this.#applied) {
      if (!next.has(name)) element.removeAttribute(name);
    }
    this.#applied = next;

    return nothing;
  }
}

export const attrs = directive(AttrsDirective);
