# PLAN-evolution-core-hooks: Fix Hook Installation

> **Goal:** Fix remaining issues in evolution-core hook system to ensure proper installation

---

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `memory_manager.py --help` works correctly | 5/5 | CLI test | ✅ Core OK |
| 2 | `heartbeat.py --help` works correctly | 5/5 | CLI test | ✅ Core OK |
| 3 | `setup_hooks.py` references obsolete worker (line 190-191) | 5/5 | Code review | 🔧 Needs fix |
| 4 | `ide_configs.json` missing `.gemini/` path | 5/5 | File review | 🔧 Needs fix |
| 5 | `install.sh` doesn't call `setup_hooks.py` | 5/5 | File review | 🔧 Needs fix |
| 6 | `.gemini/` directory exists on system | 5/5 | ls command | ✅ IDE found |

### Issues Summary

```
┌─────────────────────────────────────────────────────────────┐
│  ISSUES IDENTIFIED                                          │
├─────────────────────────────────────────────────────────────┤
│  1. setup_hooks.py line 190-191:                            │
│     Still references "run_worker.sh" which was deleted      │
│                                                              │
│  2. ide_configs.json:                                        │
│     Missing "gemini" IDE entry for ~/.gemini/                │
│                                                              │
│  3. install.sh:                                              │
│     Doesn't offer to install hooks automatically             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Proposed Changes

### [MODIFY] [setup_hooks.py](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/setup_hooks.py)
- **Action:** Remove worker reference from "Next steps" message
- **Lines:** 190-191

### [MODIFY] [ide_configs.json](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/ide_configs.json)
- **Action:** Add "gemini" IDE entry with `~/.gemini/settings.json` path

### [MODIFY] [install.sh](file:///home/mauricio/neondash/.agent/skills/evolution-core/scripts/install.sh)
- **Action:** Add optional hook installation step

---

## 2. Atomic Implementation Tasks

### AT-001: Fix setup_hooks.py Messages ⚡
**Goal:** Remove references to deleted worker

#### Subtasks:
- [ ] ST-001.1: Update "Next steps" message (lines 188-192)
  - **Validation:** No references to `run_worker.sh`

### AT-002: Add Gemini IDE Config ⚡
**Goal:** Support `.gemini/` directory for hooks

#### Subtasks:
- [ ] ST-002.1: Add gemini entry to `ide_configs.json`
  - **Validation:** `python3 setup_hooks.py --help` works

### AT-003: Update install.sh ⚡
**Goal:** Integrate hook setup option

#### Subtasks:
- [ ] ST-003.1: Add hook installation prompt
  - **Validation:** Script offers to run `setup_hooks.py`

---

## 3. Verification Plan

```bash
# Test 1: All scripts have help
python3 memory_manager.py --help
python3 heartbeat.py --help
python3 nightly_review.py --help
python3 setup_hooks.py --help

# Test 2: Database works
python3 memory_manager.py stats

# Test 3: Hook installer detects gemini
python3 setup_hooks.py  # Should show "Detected Gemini"
```
