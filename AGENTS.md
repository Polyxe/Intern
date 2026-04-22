<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Snapshot

- Stack: Next.js 16.2.4 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui primitives.
- Package manager: npm.
- Primary validation: `npm run lint`. Use `npm run build` after non-trivial routing, layout, or config changes.
- There is no test suite configured yet; do not invent test commands.

## Working Rules

- Read the local Next docs in [node_modules/next/dist/docs/index.md](node_modules/next/dist/docs/index.md) before changing framework-facing code. Prefer local docs over memory for Next 16.2.4 behavior.
- Keep framework work aligned with the versions in [package.json](package.json). Do not upgrade `next` or `eslint-config-next` from 16.2.4 unless the user explicitly asks for a version change.
- Keep App Router code under [src/app](src/app). `layout.tsx` defines the root shell and fonts; `page.tsx` is the current landing page.
- Default to server components in `src/app`; add client boundaries only when hooks, browser APIs, or client-only interactivity require them.
- Reuse shared UI from [src/components/ui](src/components/ui) and utilities from [src/lib/utils.ts](src/lib/utils.ts) instead of duplicating class-merging or primitive patterns.
- Follow the existing shadcn setup in [components.json](components.json). The project uses the `radix-nova` style, `lucide` icons, and `@/` path aliases.
- Keep styling in Tailwind utility classes and theme tokens from [src/app/globals.css](src/app/globals.css). This repo uses Tailwind v4 CSS imports and CSS variables, not a legacy `tailwind.config.js` file.
- Prefer built-in Next.js, React, browser, and existing repo utilities over adding packages. Add a new dependency only when the requirement cannot be handled cleanly with the current stack, and keep the addition narrowly scoped.

## Key Files

- [src/app/layout.tsx](src/app/layout.tsx): global metadata, font variables, and root HTML/body structure.
- [src/app/page.tsx](src/app/page.tsx): current homepage scaffold; safe place to replace when building the actual product UI.
- [src/components/ui/button.tsx](src/components/ui/button.tsx): example of the project’s shadcn-based component pattern.
- [eslint.config.mjs](eslint.config.mjs): flat ESLint config using Next core-web-vitals and TypeScript presets.
