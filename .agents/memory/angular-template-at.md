---
name: Angular 17 template @ symbol
description: Literal @ in Angular 17 HTML template text must be escaped to avoid NG5002 errors
---

# Angular 17 Template @ Escape Rule

## The Rule
Literal `@` characters in Angular 17+ HTML template text must be escaped as `&#64;`.

**Why:** Angular 17 introduced control-flow block syntax (`@if`, `@for`, `@switch`). The template compiler treats `@` as the start of a block keyword anywhere in template HTML text (not inside `{{ }}` interpolation or `[]`/`()` bindings).

**How to apply:** 
- Any static text in a component template that contains an email address, e.g. `admin@company.com`, must be written as `admin&#64;company.com`.
- In `{{ user.email }}` interpolation — `@` is fine, no escaping needed.
- In attribute bindings like `[title]="user.email"` — fine, no escaping needed.
- Only applies to literal text nodes in the HTML template.
