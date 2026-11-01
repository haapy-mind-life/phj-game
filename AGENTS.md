<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Family room cross-device sync uses Supabase Auth and private Realtime Broadcast + Presence with family membership RLS. Only family membership is stored on the server; game saves remain local. Same-device BroadcastChannel is an explicit preview mode when configuration is absent, never an online error fallback.
- GitHub Pages build reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY from `.env` or repo Actions variables. Why: static build has no Lovable runtime env.
- One agent per working tree. Before starting, run `git status --short` and `git branch --show-current`; if another agent's uncommitted changes are present, do not edit, stash, format or switch branches there. Create your own tree instead: `git worktree add ../phj-game-<topic> -b <branch> origin/main`. Why: two agents sharing one checkout overwrite each other's in-flight edits.
- Run `npm run check` (unit tests + `tsc --noEmit` + lint) before every commit that touches `src/`. CI runs the same steps plus both builds.
- Do not run repo-wide `npm run format` or `eslint --fix` while other work is uncommitted; format only the files you changed.
- Put new game rules in `src/game/` as pure functions with a `*.test.ts` next to them before wiring UI. Keep `src/components/hyunjun/Village.tsx` a connector: new worlds or games get their own component and hook instead of growing it.
- Screenshot evidence: commit only the shots a document links to, at phone/tablet size, and prefer one shot per acceptance item. Bulk capture folders stay local.
