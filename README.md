# tsr-adonis-template

Workflow for new a New Project

1. Template: Host this setup as a "Template Repository" on GitHub.
2. Clone:
```bash
git clone https://github.com/jjdechavez/tsr-adonis-template new-project
cd new-project
rm -rf .git # clear old git history
```
3. Run init:
```bash
node scripts/init-project.mjs
# Prompts: Name? -> "cool-app", Scope? -> "@cool-app"
```
4. Install:
```bash
pnpm install
git init
```

| Feature | Tool | Why? |
|---------|------|------|
| **Backend** | AdonisJS 6 | Batteries included (Auth, ORM) = faster setup. |
| **Contract** | Tuyau | **Crucial.** It reads Adonis routes and generates TypeScript definitions, allowing the Frontend to know _exactly_ what the Backend expects without manual types. |
| **Frontend** | Vite + React | Standard high-performance build tool. |
| **Routing** | TanStack Router | Best-in-class type safety for URL params (matches Tuyau's philosophy). |
| **Data** | TanStack Query | Handles caching/loading states for the Tuyau async calls. |
| **Forms** | React Hook Form | Manages form state; Tuyau validators can be used here. |
