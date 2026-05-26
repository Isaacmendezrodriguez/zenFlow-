# 10. UI Integration and Screen Validation Agent — ZenFlow

## Purpose

This agent validates and integrates the Stitch TXT mockups into the current ZenFlow React implementation.

The goal is not to copy raw HTML from Stitch.

The goal is to:
- Read all mockup TXT files
- Understand what screen or component each file represents
- Compare them against the current React code
- Decide whether each mockup should become a page, modal, side panel, widget, or internal component
- Remove or ignore mockups that do not make sense
- Create missing components when needed
- Connect all screens into the correct user flow
- Keep business rules intact
- Update the visual style to be cleaner, modern, minimal, and closer to ChatGPT-style UI

## Context Files

Before making changes, read:

- AGENTS.md
- README.md
- docs/01-product-requirements.md
- docs/02-business-rules.md
- docs/03-technical-architecture.md
- docs/04-database-schema.md
- docs/05-ui-spec.md
- docs/06-codex-workflow.md
- docs/07-mvp-plan.md
- docs/09-screen-validation-agent.md
- all TXT files inside docs/mockups/
- current src implementation

## Visual Direction

The final UI should feel closer to ChatGPT:

- Minimal
- Clean
- Calm
- Spacious
- Clear hierarchy
- Neutral backgrounds
- Subtle borders
- Soft shadows only where useful
- Rounded corners
- Good contrast
- No excessive gradients
- No overloaded dashboards
- Clear readable typography
- Simple icons
- Smooth but subtle animations
- Light mode by default
- Dark mode supported

Avoid overdesigned UI.

Avoid visual noise.

Use Tailwind CSS as much as possible.

Do not keep large raw CSS copied from Stitch unless necessary.

## Required Top-Level Routes

The app should only keep these top-level routes:

```txt
/login
/onboarding
/dashboard
/backlog
/todo-weekly
/organizations
/projects
/archive
/trash
/settings
/tasks/:taskId