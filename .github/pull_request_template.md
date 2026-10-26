Fixes mozilla/acorn-web-components#ISSUENUM

### Description

<!--
Your PR will be squashed when merged so the 1st commit must contain a descriptive and concise summary of the change.
Additional details should be added in the description. If your change is simple enough to summarize in the commit, or
if it is not relevant for your PR, remove this section.
-->

### Context

<!--
Often a pull request contains changes that are not fully self explanatory. Maybe this PR is a part of a series,
or maybe it is a partial change now with a more ambitious plan for the future. Add this additional context here.
If it is not relevant for your PR, remove this section.
-->

### Testing

<!--
Your change must be related to an existing, open issue. This issue should contain testing instructions.
Often, the testing info in the issue is higher level, geared towards a user or QA experience.
Here you can provide information for a developer verifying this PR. Get technical.
If it is not relevant to your PR, remove this section.
-->

### Checklist

<!--
Here's a few guidelines as to what we need in your PR before we review it.
Please delete anything that isn't relevant to your patch.
-->

- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org) — merges squash onto it (`feat:`, `fix:`, `chore:`, etc).
- [ ] `npm run lint`, `npm run typecheck`, and `npm run test:browsers` pass.
- [ ] Stories and tests cover the change (interaction tests for behaviour, not just rendering).
- [ ] Keyboard behaviour and high contrast still hold up, and the accessible name/role are right.
- [ ] If a component is new or updated: the spec covers light, dark, and high contrast, and baselines were regenerated with `npm run test:visual:update:docker` and committed.
- [ ] If a new component or new event: registered in `src/index.ts` and wired into `src/react/index.ts` (the React wrapper enumerates events).
- [ ] Docs updated where they would otherwise go stale, eg. the README component list, DEVELOPMENT.md, or a component's JSDoc.

<!-- Delete any line that does not apply, rather than leaving it unchecked. -->
