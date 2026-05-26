# 09. Screen Validation Agent — ZenFlow

## Purpose

This agent validates whether all screens, modals, panels, widgets, and routes in ZenFlow make sense according to the product requirements, business rules, mockups, and current implementation.

The goal is to prevent unnecessary screens, broken logic, disconnected UI flows, duplicate components, or screens that do not match the business model.

## Context Files to Read

Before making decisions, read:

- AGENTS.md
- README.md
- docs/01-product-requirements.md
- docs/02-business-rules.md
- docs/03-technical-architecture.md
- docs/04-database-schema.md
- docs/05-ui-spec.md
- docs/06-codex-workflow.md
- docs/07-mvp-plan.md
- docs/08-codex-prompts.md
- all files inside docs/mockups/
- current src/ implementation

## Main Product Logic

ZenFlow is not just a calendar and not just a Kanban board.

ZenFlow connects:

```txt
Organization
  Project
    Task/Card
      Subtasks, if complex
      Calendar blocks
      Real hours
      Progress
      Dashboard metrics