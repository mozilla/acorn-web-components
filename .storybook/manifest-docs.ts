/**
 * Trim the custom-elements manifest before it drives the autodocs tables.
 *
 * Every form control inherits ~55 members from `MozBaseInputElement` and
 * `MozLitElement`, so `moz-input-text` reports 68 members and `moz-textarea`
 * 74 — burying each component's own handful of properties under lifecycle
 * hooks, private fields, and internal getters. This keeps the surface a
 * consumer can actually use and drops the rest.
 *
 * Only Storybook's copy is filtered. The published `dist/custom-elements.json`
 * still ships complete, because editors and type tooling want the full picture.
 */

interface ManifestMember {
  name: string;
  privacy?: string;
  static?: boolean;
  kind?: string;
}

interface ManifestDeclaration {
  members?: ManifestMember[];
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
  // `protected`/`private` are implementation seams (inputTemplate,
  // handleKeydown, submissionValue); `#`-prefixed are hard-private; statics are
  // configuration (styles, formAssociated, activatedProperty).
  if (member.privacy === 'private' || member.privacy === 'protected') {
    return false;
  }
  if (member.name.startsWith('#') || member.name.startsWith('_')) return false;
  if (member.static) return false;
  return !INTERNAL_MEMBERS.has(member.name);
}

/** Return a copy of the manifest with undocumented members removed. */
export function forDocs<T extends Manifest>(manifest: T): T {
  return {
    ...manifest,
    modules: manifest.modules?.map((module) => ({
      ...module,
      declarations: module.declarations?.map((declaration) =>
        declaration.members
          ? {
              ...declaration,
              members: declaration.members.filter(isDocumented),
            }
          : declaration,
      ),
    })),
  };
}
