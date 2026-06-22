---
name: Angular CLI analytics prompt
description: Angular CLI blocks on first-run analytics consent prompt — how to suppress it
---

# Angular CLI Analytics Non-Interactive Suppression

## The Rule
Angular CLI prompts for analytics consent on first run. In non-interactive environments (like Replit workflows), this blocks the process indefinitely.

**Why:** The Angular CLI calls analytics.isEnabled() which reads a config file. If it hasn't been set, it prompts interactively, which blocks a workflow run.

**How to apply:**
1. Prefix the dev script with `NG_CLI_ANALYTICS=false`:  
   `"dev": "NG_CLI_ANALYTICS=false ng serve ..."`
2. Create `.angular/config.json` in the project root:
   ```json
   { "$schema": "../node_modules/@angular/cli/lib/config/schema.json", "version": 1, "cli": { "analytics": false } }
   ```

Both are needed for robustness (env var handles the process; config file handles persistent projects).
