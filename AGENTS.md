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
