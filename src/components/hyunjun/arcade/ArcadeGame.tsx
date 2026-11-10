import { Link, useParams } from "@tanstack/react-router";
import { isArcadeKey } from "@/game/play/arcade";
import { Shell } from "../Shell";
import { ArcadeShell } from "./ArcadeShell";
import { ARCADE_GAMES } from "./games";

/** /mini/$game: one route for every arcade minigame in the kart. */
export function ArcadeGame() {
  const { game } = useParams({ strict: false }) as { game?: string };
  if (!isArcadeKey(game))
    return (
      <Shell active="mini" title="놀이를 찾지 못했어요" subtitle="카트에서 다시 골라 줘요.">
        <section className="arcade" data-phase="missing">
          <p>이 놀이는 아직 없어요.</p>
          <Link to="/kart" className="arcade-return">
            카트로 돌아가기
          </Link>
        </section>
      </Shell>
    );
  // `key` starts a fresh run when one game links to another.
  return <ArcadeShell key={game} def={ARCADE_GAMES[game]} />;
}
