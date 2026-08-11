import type { Preview } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../src/generated/tokens.css';
import '../src/base.css';
import '../src/components/moz-provider/moz-provider.js';

export const globalTypes = {
  theme: {
    description: 'Nova colour scheme',
    toolbar: {
      title: 'Scheme',
      icon: 'circlehollow',
      items: ['light', 'dark', 'auto'],
      dynamicTitle: true,
    },
  },
  contrast: {
    // Preview approximation: high contrast applies prefers-contrast AND
    // forced-colors together (they ship as separate @media layers in prod).
    description: 'High contrast (prefers-contrast + forced-colors)',
    toolbar: {
      title: 'Contrast',
      icon: 'contrast',
      items: [
        { value: 'normal', title: 'Normal' },
        { value: 'high', title: 'High contrast' },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  theme: 'auto',
  contrast: 'normal',
};

const preview: Preview = {
  decorators: [
    (story, context) => {
      const { theme, contrast } = context.globals;
      // Fill the viewport in the story canvas, but hug content in docs so each
      // embedded example is sized to its content rather than 100vh tall.
      const minHeight = context.viewMode === 'docs' ? 'auto' : '100vh';
      // Drive the real provider so the preview is faithful (foundation +
      // component token overrides), not an attribute approximation.
      return html`<moz-provider
        theme=${theme}
        .contrast=${contrast === 'high' ? 'high' : 'auto'}
      >
        <div
          style="background: var(--background-color-canvas); color: var(--text-color); padding: 1.5rem; min-height: ${minHeight}; box-sizing: border-box;"
        >
          ${story()}
        </div>
      </moz-provider>`;
    },
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      // Show only the component usage in "Show code", not the provider/theme
      // wrapper the decorators add. Does not affect how stories render.
      source: { excludeDecorators: true },
    },
  },
};

export default preview;
