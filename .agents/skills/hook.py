#!/usr/bin/env -S uv run --script
"""
UserPromptSubmit hook — injects project skill index into every prompt.
Scans .agent/skills/ dynamically: new skills auto-appear without config changes.
"""
import json, os, re, sys

def parse_frontmatter(text):
    """Extract name and description from YAML frontmatter."""
    m = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return None, None
    fm = m.group(1)

    name_m = re.search(r'^name:\s*(.+)$', fm, re.MULTILINE)
    name = name_m.group(1).strip().strip('"\'') if name_m else None

    # Handle: "description: text" OR "description: >\n  text..."
    desc_any = re.search(r'^description:\s*(.+)$', fm, re.MULTILINE)
    if desc_any:
        val = desc_any.group(1).strip()
        if val and val[0] not in ('>', '|'):
            desc = val.strip('"\'')
        else:
            desc_block = re.search(r'^description:\s*[>|]\n((?:[ \t]+.+\n?)+)', fm, re.MULTILINE)
            if desc_block:
                lines = [l.strip() for l in desc_block.group(1).strip().splitlines()]
                desc = ' '.join(l for l in lines if l)
            else:
                desc = ''
    else:
        desc = ''

    return name, desc

def main():
    _ = sys.stdin.read()  # consume required hook stdin

    skills_dir = os.path.dirname(os.path.abspath(__file__))
    skills = []

    for entry in sorted(os.scandir(skills_dir), key=lambda e: e.name):
        if not entry.is_dir():
            continue
        skill_file = os.path.join(entry.path, 'SKILL.md')
        if not os.path.exists(skill_file):
            continue
        try:
            with open(skill_file, encoding='utf-8') as f:
                content = f.read()
            name, desc = parse_frontmatter(content)
            if name:
                short_desc = (desc[:120] + '…') if len(desc) > 120 else desc
                skills.append(f"  - {name}: {short_desc}" if short_desc else f"  - {name}")
        except Exception:
            continue

    if skills:
        listing = '\n'.join(skills)
        reason = (
            "PROJECT SKILLS available in .agent/skills/ —\n"
            f"{listing}\n"
            "To use: Read .agent/skills/<name>/SKILL.md then follow its instructions."
        )
        print(json.dumps({
            "hookSpecificOutput": {
                "additionalContext": reason
            }
        }))
    else:
        print(json.dumps({}))

if __name__ == '__main__':
    main()
