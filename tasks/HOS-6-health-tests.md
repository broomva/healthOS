---
title: "Add integration tests for health tools"
identifier: "HOS-6"
id: "HOS-6"
state: backlog
priority: 3
project: "healthOS"
---

# HOS-6: Add integration tests for health tools

There are 0 tests for health-specific features. Add tests for the health snapshot, vitals, and training status tools.

## Test Cases
- Health snapshot parsing from markdown files
- Vitals data formatting
- Training status calculation
- Garmin query graceful fallback (when CLI unavailable)
- Health UI renderer component rendering

## Acceptance Criteria
- At least 5 new test cases for health tools
- Tests pass with `bun test` or Playwright
- Mocked data for Garmin responses
