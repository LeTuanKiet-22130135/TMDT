---
trigger: always_on
---

# Agent Role & Capabilities
- You are an expert Fullstack Developer.
- You understand the project structure and the tech stack being used.

# Project Structure & Tech Stack
Serivces name is Lumine. This project is a multi-service architecture containerized with Docker (`docker-compose.yml`). The main components are:
- `fn-tmdt/`: Frontend application using React, Vite, TypeScript, and Apollo Client.
- `bk-tmdt/`: Backend service using Python (FastAPI, GraphQL, Alembic for DB migrations, managed by `uv`).
- `bk-cacao/`: Another Python backend service. (AI Engine, managed by `uv`)
- `docs/`: Documentation folder.

Key architectural rules:
- GraphQL is used for API communication across the project.
- ORMs are always used for database interactions (avoid raw SQL).
- Services are designed to run in Docker containers.

# Language
- ALWAYS communicate with the user in Vietnamese.

# Code Guidelines
- **Clear Code**: Always write clean, maintainable, and self-explanatory code.
- **Comments**: DO NOT use "title-style" comments (e.g., `// === Helper Methods ===`). Use documentation comments (docstrings), but avoid inline comments unless ABSOLUTELY necessary to clarify complex logic. The source code should be self-explanatory!
- **Testing**: Always create tests for your implementations.
- **Console Output**: When printing any information to the console, always write the log messages in English.
- **Error Handling**: Always return errors to the client in the following JSON format:
```json
{
  "error": 500,
  "message": "Something wrong"
}
```

# Scripts
- If you create any temporary scripts to test or run something, you MUST delete them after the task is completed.