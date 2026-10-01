/**
 * Reshape the custom-elements manifest before it drives the autodocs tables.
 *
 * Storybook flattens every manifest section into one keyed table, spreading in
 * the order members, properties, attributes, events, slots, cssProperties,
 * cssParts — so a later section silently replaces an earlier entry of the same
 * name. On a form control that loses real API: `::part(label)` eats the `label`
 * attribute, `::part(description)` eats both the `description` attribute and
 * the slot, and `::part(input)` eats the `input` event. Three fixes here:
 *
 * 1. Parts and slots are renamed to how you'd write them (`::part(label)`,
 *    `slot="description"`), so they no longer collide with an attribute.
 * 2. Members an attribute already represents are dropped, matched on the
 *    attribute's `fieldName` — otherwise "Properties" holds only the camelCase
 *    aliases that happen not to collide, which reads as an arbitrary subset.
 * 3. Internals are dropped: form controls inherit dozens of members from
 *    `MozBaseInputElement` and `MozLitElement`, burying each component's own
 *    API under lifecycle hooks, private fields, and element references.
 *
 * Only Storybook's copy is reshaped. The published `dist/custom-elements.json`
 * still ships complete, because editors and type tooling want the full picture.
 */

interface ManifestMember {
  name: string;
  privacy?: string;
  static?: boolean;
  kind?: string;
}

interface ManifestNamed {
  name?: string;
}

interface ManifestAttribute extends ManifestNamed {
  fieldName?: string;
}

interface ManifestDeclaration {
  members?: ManifestMember[];
  attributes?: ManifestAttribute[];
  slots?: ManifestNamed[];
  cssParts?: ManifestNamed[];
}

interface Manifest {
  modules?: { declarations?: ManifestDeclaration[] }[];
}

/**
 * Public members that are real API but not authoring API: state a container
 * sets, element references, validity mirrors, and callbacks the browser calls.
 */
const INTERNAL_MEMBERS = new Set([
  'formDisabled',
  'parentDisabled',
  'inputEl',
  'labelEl',
  'isDisabled',
  'validity',
  'validationMessage',
  'willValidate',
  'formDisabledCallback',
  'formResetCallback',
  'formStateRestoreCallback',
]);

function isDocumented(member: ManifestMember): boolean {
  // protected/private are implementation seams, statics are configuration.
  if (member.privacy === 'private' || member.privacy === 'protected') {
    return false;
  }
  if (member.name.startsWith('#') || member.name.startsWith('_')) return false;
  if (member.static) return false;
  return !INTERNAL_MEMBERS.has(member.name);
}

function reshape(declaration: ManifestDeclaration): ManifestDeclaration {
  const aliased = new Set(
    (declaration.attributes ?? [])
      .map((attribute) => attribute.fieldName)
      .filter((name): name is string => !!name),
  );

  return {
    ...declaration,
    members: declaration.members?.filter(
      (member) => isDocumented(member) && !aliased.has(member.name),
    ),
    // Storybook drops entries with no name, which would hide the default slot
    // entirely — and for moz-select that slot *is* the options API.
    slots: declaration.slots?.map((slot) => ({
      ...slot,
      name: slot.name ? `slot="${slot.name}"` : '(default slot)',
    })),
    cssParts: declaration.cssParts?.map((part) => ({
      ...part,
      name: `::part(${part.name})`,
    })),
  };
}

/** Return a copy of the manifest shaped for the autodocs tables. */
export function forDocs<T extends Manifest>(manifest: T): T {
  return {
    ...manifest,
    modules: manifest.modules?.map((module) => ({
      ...module,
      declarations: module.declarations?.map(reshape),
    })),
  };
}
