import { useState } from "react";
import {
  CARD_USES_TO_UNLOCK,
  GRADES,
  MAX_FUSION,
  ROBOTS,
  type RobotMissionMode,
  type RobotSpeciesId,
} from "@/game/robot-catalog";
import { gradeOf, isWatchCardAvailable, type RobotProgress } from "@/game/robot-engine";
import { FusedRobotArt } from "./FusedRobotArt";
import { RobotSpeciesArt } from "./RobotSpeciesArt";

const ROLES_2 = ["머리·몸", "팔·무기"];
const ROLES_3 = ["머리·몸", "팔·무기", "다리·날개"];
/**
 * The wrist robot-summon watch. Every card is already stored in the watch (no card to find or
 * insert): pick a picture, then summon, fuse or send the robot on a job.
 */
export function RobotWatch({
  progress,
  tab,
  setTab,
  team,
  mode,
  onSummon,
  onFuse,
  onSplit,
  onMode,
  onRecall,
  onMission,
  onClose,
}: {
  progress: RobotProgress;
  tab: "summon" | "fuse" | "mission";
  setTab: (tab: "summon" | "fuse" | "mission") => void;
  team: RobotSpeciesId[];
  mode: "follow" | "ride" | null;
  onSummon: (id: RobotSpeciesId) => void;
  onFuse: (ids: RobotSpeciesId[]) => void;
  onSplit: () => void;
  onMode: (mode: "follow" | "ride") => void;
  onRecall: () => void;
  onMission: (mode: RobotMissionMode) => void;
  onClose: () => void;
}) {
  const available = ROBOTS.filter((r) => isWatchCardAvailable(progress, r.id));
  const [selected, setSelected] = useState<RobotSpeciesId>(team[0] ?? "rb-police");
  const [picks, setPicks] = useState<RobotSpeciesId[]>([]);
  const chosen = ROBOTS.find((r) => r.id === selected)!;
  const uses = progress.cards[selected]?.uses ?? 0;
  const roles = picks.length > 2 ? ROLES_3 : ROLES_2;
  const togglePick = (id: RobotSpeciesId) =>
    setPicks((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_FUSION ? [...p, id] : p,
    );
  return (
    <div className="hj-garage-backdrop" onClick={onClose}>
      <section
        className="hj-watch"
        role="dialog"
        aria-modal="true"
        aria-label="로봇 소환 시계"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hj-watch-header">
          <h2>⌚ 로봇 소환 시계</h2>
          <button onClick={onClose} aria-label="소환 시계 닫기">
            닫기 ✕
          </button>
        </header>
        <div className="hj-watch-face" data-watch-preview={selected}>
          <div className="hj-watch-bezel" aria-hidden="true" />
          <RobotSpeciesArt
            robot={chosen}
            grade={gradeOf(progress, selected)}
            size={86}
            label={`시계 화면: ${chosen.name}`}
          />
          <b>
            {gradeOf(progress, selected) > 0 ? GRADES[gradeOf(progress, selected)] + " " : ""}
            {chosen.name}
          </b>
          <span className="hj-watch-pips" aria-label={`카드 사용 ${uses}/${CARD_USES_TO_UNLOCK}`}>
            {Array.from({ length: CARD_USES_TO_UNLOCK }, (_, i) => (
              <i key={i} className={i < uses ? "on" : ""} />
            ))}
          </span>
          <small>⚔ {chosen.weapon.name}</small>
        </div>
        <div className="hj-watch-tabs" role="tablist">
          {(
            [
              ["summon", "🃏 소환"],
              ["fuse", "💥 합체"],
              ["mission", "🚨 출동"],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? "chosen" : ""}
              onClick={() => setTab(id)}
            >
              {text}
            </button>
          ))}
        </div>
        {tab === "summon" && (
          <>
            <div className="hj-watch-cards" role="group" aria-label="시계에 저장된 로봇 카드">
              {ROBOTS.map((r) => {
                const open = isWatchCardAvailable(progress, r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    disabled={!open}
                    className={selected === r.id ? "chosen" : ""}
                    aria-pressed={selected === r.id}
                    onClick={() => setSelected(r.id)}
                    aria-label={`${r.name} 카드${open ? "" : " (잠김)"}`}
                    data-card={r.id}
                  >
                    <RobotSpeciesArt robot={r} grade={gradeOf(progress, r.id)} size={46} />
                    <b>{r.name}</b>
                    <small>
                      {open ? `${progress.cards[r.id]?.uses ?? 0}/7` : "🔒 7번 쓰면 열려"}
                    </small>
                  </button>
                );
              })}
            </div>
            <button className="hj-watch-go" onClick={() => onSummon(selected)}>
              ✨ {chosen.name} 소환!
            </button>
            {mode && (
              <div className="hj-watch-row">
                <button onClick={() => onMode(mode === "ride" ? "follow" : "ride")}>
                  {mode === "ride" ? "🚶 따라오게 하기" : "🕹 로봇 타기"}
                </button>
                <button onClick={onRecall}>⌚ 시계로 돌려보내기</button>
              </div>
            )}
          </>
        )}
        {tab === "fuse" && (
          <>
            <p className="hj-watch-help">
              로봇을 2개 또는 3개 눌러 봐! 처음 고른 로봇이 머리·몸, 두 번째가 팔·무기, 세 번째가
              다리·날개가 돼.
            </p>
            <div className="hj-watch-cards" role="group" aria-label="합체할 로봇 고르기">
              {available.map((r) => {
                const at = picks.indexOf(r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={at >= 0 ? "chosen" : ""}
                    aria-pressed={at >= 0}
                    onClick={() => togglePick(r.id)}
                    aria-label={`합체: ${r.name}`}
                  >
                    <RobotSpeciesArt robot={r} grade={gradeOf(progress, r.id)} size={46} />
                    <b>{r.name}</b>
                    <small>{at >= 0 ? `${at + 1}. ${roles[at]}` : "고르기"}</small>
                  </button>
                );
              })}
            </div>
            {picks.length >= 2 && (
              <div className="hj-watch-fuse-preview">
                <FusedRobotArt
                  team={picks.map((id) => ROBOTS.find((r) => r.id === id)!)}
                  grades={picks.map((id) => gradeOf(progress, id))}
                  weaponOut={false}
                  size={150}
                  label={`${picks.length}단 합체 미리보기`}
                  phase="fused"
                />
              </div>
            )}
            <button
              className="hj-watch-go"
              disabled={picks.length < 2}
              onClick={() => onFuse(picks)}
            >
              💥 {picks.length >= 2 ? `${picks.length}단 합체 시작!` : "2개 이상 골라 줘"}
            </button>
            {team.length > 1 && (
              <button className="hj-watch-row-button" onClick={onSplit}>
                합체 풀기
              </button>
            )}
          </>
        )}
        {tab === "mission" && (
          <>
            {!mode && <p className="hj-watch-help">먼저 🃏 소환에서 로봇을 불러 줘!</p>}
            <div className="hj-watch-missions">
              <button disabled={!mode} onClick={() => onMission("villain")}>
                🤖 악당 물리치기
              </button>
              <button disabled={!mode} onClick={() => onMission("rescue")}>
                🔥 위험한 친구 구하기
              </button>
              <button disabled={!mode} onClick={() => onMission("thief")}>
                💰 도둑 잡기
              </button>
            </div>
            <div className="hj-watch-stats">
              <span>🏆 악당 {progress.wins}</span>
              <span>🧡 구조 {progress.rescues}</span>
              <span>🚓 체포 {progress.catches}</span>
              <span>🔩 부품 {progress.parts}</span>
              <span>💥 최고 {progress.fusionBest}단</span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
