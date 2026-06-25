---
name: skill-creator
description: A standard procedure for creating new skills for the agent, ensuring they are well-structured, properly documented, and fully capable of extending the agent's abilities within the workspace.
---

# Skill Creator

## Overview
This skill is used whenever the agent needs to create a new skill to automate or standardize a specific workflow. It defines the required folder structure, naming conventions, and file contents (specifically the `SKILL.md` file) that every new skill must have to function correctly.

## Execution Steps

When you receive a request to create a new skill, follow these steps:

### 1. Plan the Skill
- Understand the core capability the user wants to add.
- Determine an appropriate, concise, and hyphenated name for the skill (e.g., `data-analyzer`, `code-reviewer`).
- Write a short description (1-2 sentences) of what the skill does.

### 2. Create the Directory Structure
- Skills are stored as folders within the `.agents/skills/` directory.
- Create a new directory for the skill: `.agents/skills/<skill-name>/`.
- Inside this directory, create the mandatory `SKILL.md` file.

### 3. Draft the `SKILL.md`
The `SKILL.md` file is the instruction manual for the skill. It MUST contain:
- **YAML Frontmatter**: This is strictly required at the very top of the file, containing `name` and `description`.
- **Overview**: A brief explanation of the skill's purpose, triggers, and expected outcomes.
- **Detailed Instructions**: A step-by-step guide explaining exactly how the agent should execute the task. Include required constraints, preferred tool usage, and context requirements.

**Example `SKILL.md` Template:**
```markdown
---
name: <skill-name>
description: <Brief description of what the skill does>
---

# <Skill Title>

## Overview
<Explanation of when to use this skill and what it accomplishes>

## Execution Steps
1. **Analyze**: ...
2. **Execute**: ...
3. **Validate**: ...

## Guidelines and Constraints
- Follow specific rule 1.
- Avoid specific action 2.
```

### 4. Optional Resources
If the skill requires additional components, create the following subdirectories inside the skill folder as needed:
- `scripts/`: For executable helper scripts.
- `templates/`: For standardizing text or code outputs.
- `resources/`: For reference documents or static data.

### 5. Final Verification
- Double-check that the YAML frontmatter is formatted correctly.
- Ensure the instructions are clear, unambiguous, and actionable for an AI agent.
- Confirm the new skill is saved in the correct directory path.
