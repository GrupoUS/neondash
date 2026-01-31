# Complexity Classification Guide

Reference for determining task complexity level and appropriate thinking budget.

## Complexity Matrix

| Level  | Indicators                        | Thinking Budget | Research Depth |
| ------ | --------------------------------- | --------------- | -------------- |
| L1-L2  | Bug fix, single function, typo    | 1K-4K tokens    | Repo-only      |
| L3-L5  | Feature, multi-file, new endpoint | 8K-16K tokens   | Docs + repo    |
| L6-L8  | Architecture, integration, API    | 16K-32K tokens  | Deep research  |
| L9-L10 | Migrations, multi-service, infra  | 32K+ tokens     | Comprehensive  |

---

## L1-L2: Simple Tasks

**Examples:**

- Fixing a typo in UI text
- Modifying a single function
- Adding a CSS style
- Updating a constant value

**Research:** Local codebase only

**Output:** Direct implementation, minimal planning

---

## L3-L5: Medium Tasks

**Examples:**

- Adding a new feature with 2-5 files
- Creating a new API endpoint
- Implementing a form with validation
- Adding a new page/route

**Research:**

1. Codebase patterns
2. Context7 for framework docs
3. Existing similar implementations

**Output:** Brief plan with atomic tasks

---

## L6-L8: Complex Tasks

**Examples:**

- Architectural changes
- Third-party API integration
- Authentication system changes
- Database schema migrations
- Performance optimization

**Research:**

1. Deep codebase analysis
2. Context7 for all relevant libraries
3. Tavily for best practices
4. Security considerations

**Output:** Full PRP document with:

- Research digest
- Multiple approaches evaluated
- Comprehensive atomic tasks
- Rollback plans

---

## L9-L10: Critical Tasks

**Examples:**

- Multi-service migrations
- Infrastructure changes
- Breaking changes across system
- Security audit remediation
- Major version upgrades

**Research:**

1. Comprehensive codebase audit
2. All relevant documentation
3. Web research for case studies
4. Multiple specialist consultations

**Output:** Full PRP with:

- Extensive research digest
- Risk assessment matrix
- Phased rollout plan
- Monitoring criteria
- Detailed rollback procedures

---

## Complexity Indicators

### Increase Complexity When:

- Multiple files affected (+1)
- Database changes required (+1)
- Authentication involved (+1)
- Third-party APIs (+1)
- Breaking changes possible (+2)
- Security implications (+2)
- Multi-service coordination (+2)

### Decrease Complexity When:

- Well-established patterns exist (-1)
- Similar code already in codebase (-1)
- Isolated changes with no dependencies (-1)
- Comprehensive tests already exist (-1)
