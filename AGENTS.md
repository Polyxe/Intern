<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Snapshot

- Stack: Next.js 16.2.4 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma 7, shadcn/ui primitives.
- Package manager: npm.
- Primary validation: `npm run lint`. Do not forget to run `npm run build` after non-trivial routing, layout, config, or similarly broad application changes.
- There is no test suite configured yet; do not invent test commands.

## Working Rules

- Read the local Next docs in [node_modules/next/dist/docs/index.md](node_modules/next/dist/docs/index.md) before changing framework-facing code. Prefer local docs over memory for Next 16.2.4 behavior.
- Keep framework work aligned with the versions in [package.json](package.json). Do not upgrade `next` or `eslint-config-next` from 16.2.4 unless the user explicitly asks for a version change.
- Keep database work aligned with Prisma 7 in [package.json](package.json). Do not replace Prisma, switch ORM/query layers, or upgrade Prisma major versions unless the user explicitly asks.
- Keep App Router code under [src/app](src/app). `layout.tsx` defines the root shell and fonts; `page.tsx` is the current landing page.
- Default to server components in `src/app`; add client boundaries only when hooks, browser APIs, or client-only interactivity require them.
- Keep Prisma schema changes in [prisma/schema.prisma](prisma/schema.prisma) and Prisma CLI config in [prisma.config.ts](prisma.config.ts). Treat generated client code under `src/generated/prisma` as generated output, not hand-edited source.
- When changing data models, prefer Prisma schema, migrations, and generated client usage over adding raw SQL helpers or extra database libraries.
- Reuse shared UI from [src/components/ui](src/components/ui) and utilities from [src/lib/utils.ts](src/lib/utils.ts) instead of duplicating class-merging or primitive patterns.
- Follow the existing shadcn setup in [components.json](components.json). The project uses the `radix-nova` style, `lucide` icons, and `@/` path aliases.
- Keep styling in Tailwind utility classes and theme tokens from [src/app/globals.css](src/app/globals.css). This repo uses Tailwind v4 CSS imports and CSS variables, not a legacy `tailwind.config.js` file.
- Prefer built-in Next.js, React, Prisma, browser, and existing repo utilities over adding packages. Add a new dependency only when the requirement cannot be handled cleanly with the current stack, and keep the addition narrowly scoped.

## Visual Theme

- Base the application chrome on the internship form reference: a soft lavender-to-violet navigation bar, warm orange primary actions, and light neutral page surfaces.
- Keep the overall feel academic and calm rather than dark or high-contrast: use off-white or misty gray backgrounds with subtle lilac tinting.
- Use orange only for high-priority actions and small accent moments; avoid turning the full page into an orange-heavy interface.
- Prefer charcoal or deep slate for text, with violet reserved for section accents, pills, and supporting emphasis.
- Surfaces should feel soft and slightly elevated: rounded corners, low-contrast borders, and restrained shadows instead of sharp black outlines.
- Current UI direction also follows the Lovable reference in https://github.com/Polyxe/intern-wonderland-form for the student form/profile experience; future redesigns should preserve that visual language without needing to re-check the repo.
- Use a sticky `bg-gradient-brand` header with translucent pill navigation, a glassy account chip, and subtle radial highlight overlays rather than flat bars.
- For hero sections, prefer either a centered intro with `text-gradient-brand` heading emphasis or a full-width `bg-gradient-brand` banner with white text and softly blended radial highlights.
- Structure major content areas as rounded `3xl` cards with soft borders, `shadow-elegant`, and section headers that use `bg-gradient-brand-soft`, an icon tile, and an optional step badge.
- Student profile pages should include a dedicated approval-status card, an internship-progress card with an accent progress bar, and detail cards grouped by personal, education, and internship information.
- Student application pages should feature a prominent profile-photo upload card, multi-section form cards, and a footer action panel with an orange gradient primary button and muted secondary action.
- Keep body backgrounds airy with a subtle mesh or radial gradient treatment; avoid flat white pages when working on the student-facing flows.
- When adapting Lovable concepts into this repo, port the visual system and component hierarchy, but keep the existing Next.js routing, Prisma-backed data flow, and server actions instead of importing client-only mock state patterns from the reference app.
- For unauthenticated states, keep the header right side empty instead of showing placeholder user details.

## Key Files

- [src/app/layout.tsx](src/app/layout.tsx): global metadata, font variables, and root HTML/body structure.
- [src/app/page.tsx](src/app/page.tsx): current homepage scaffold; safe place to replace when building the actual product UI.
- [prisma/schema.prisma](prisma/schema.prisma): Prisma 7 datasource, generator, and model definitions.
- [prisma.config.ts](prisma.config.ts): Prisma 7 CLI configuration and datasource URL wiring.
- [src/components/ui/button.tsx](src/components/ui/button.tsx): example of the project’s shadcn-based component pattern.
- [eslint.config.mjs](eslint.config.mjs): flat ESLint config using Next core-web-vitals and TypeScript presets.
