import { ROBOTS, type RobotMissionMode, type RobotSpeciesId } from "@/game/robot-catalog";
import {
  isWatchCardAvailable,
  upgradeCost,
  WATCH_GRADES,
  type RobotProgress,
} from "@/game/robot-engine";
import { RobotSpeciesArt } from "./RobotSpeciesArt";

export function RobotWatch({
  progress,
  selected,
  onSelect,
  fusionIds,
  onToggleFusion,
  onFuse,
  activeId,
  onSummon,
  onUpgrade,
  onMission,
  onClose,
}: {
  progress: RobotProgress;
  selected: RobotSpeciesId;
  onSelect: (id: RobotSpeciesId) => void;
  fusionIds: RobotSpeciesId[];
  onToggleFusion: (id: RobotSpeciesId) => void;
  onFuse: () => void;
  activeId: RobotSpeciesId | null;
  onSummon: (id: RobotSpeciesId) => void;
  onUpgrade: () => void;
  onMission: (mode: RobotMissionMode) => void;
  onClose: () => void;
}) {
  const chosen = ROBOTS.find((r) => r.id === selected)!;
  const available = isWatchCardAvailable(progress, selected);
  const cost = upgradeCost(progress.grade);
  return (
    <div className="hj-garage-backdrop" onClick={onClose}>
      <section
        className="hj-watch"
        role="dialog"
        aria-modal="true"
        aria-label="로봇 소환 시계"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="hj-watch-header">
          <div>
            <h2>로봇 소환 시계</h2>
            <small>시계에 카드가 저장되어 있어! 그림을 누르면 로봇을 고를 수 있어.</small>
          </div>
          <button onClick={onClose} aria-label="소환 시계 닫기">
            닫기
          </button>
        </header>
        <div className="hj-watch-dial" aria-label="로봇 소환 시계 화면">
          <span className="hj-watch-rim" aria-hidden="true">
            ◆
          </span>
          <RobotSpeciesArt robot={chosen} size={92} />
          <div>
            <b>{chosen.name}</b>
            <small>
              {available ? `카드 사용 ${progress.cards[selected]?.uses ?? 0}/7` : "아직 잠긴 카드"}
            </small>
          </div>
          <button onClick={() => onSummon(selected)} disabled={!available}>
            {activeId === selected ? "다시 소환" : "이 로봇 소환!"}
          </button>
        </div>
        <h3>시계에 저장된 로봇 카드</h3>
        <div className="hj-watch-cards" role="group" aria-label="그림 카드 선택">
          {ROBOTS.map((r) => {
            const unlocked = isWatchCardAvailable(progress, r.id);
            return (
              <button
                type="button"
                key={r.id}
                className={selected === r.id ? "chosen" : ""}
                aria-pressed={selected === r.id}
                onClick={() => onSelect(r.id)}
                aria-label={`${r.name} 그림 카드 ${unlocked ? "사용 가능" : "잠김"}`}
              >
                <RobotSpeciesArt robot={r} size={54} />
                <b>{r.name}</b>
                <small>
                  {unlocked ? `${progress.cards[r.id]?.uses ?? 0}/7` : "7회 사용 후 열림"}
                </small>
              </button>
            );
          })}
        </div>
        <h3>합체할 로봇을 골라 봐!</h3>
        <p>서로 다른 로봇 그림을 2개 또는 3개 선택하고 합체를 눌러 줘.</p>
        <div className="hj-watch-fuse-choices" role="group" aria-label="합체 로봇 선택">
          {ROBOTS.filter((r) => isWatchCardAvailable(progress, r.id)).map((r) => (
            <button
              key={r.id}
              aria-pressed={fusionIds.includes(r.id)}
              className={fusionIds.includes(r.id) ? "chosen" : ""}
              onClick={() => onToggleFusion(r.id)}
            >
              {fusionIds.includes(r.id) ? "✓ " : "+ "}
              {r.name}
            </button>
          ))}
        </div>
        <button className="hj-watch-primary" onClick={onFuse} disabled={fusionIds.length < 2}>
          합체! {fusionIds.length >= 2 ? `${fusionIds.length}단 로봇 출동` : "2개 이상 고르기"}
        </button>
        <div className="hj-watch-stats">
          <span>합체 최고 {progress.fusionBest}단</span>
          <span>등급 {WATCH_GRADES[progress.grade]}</span>
          <span>재료 {progress.materials}개</span>
          <span>임무 {progress.wins}회 성공</span>
        </div>
        <button
          onClick={onUpgrade}
          disabled={progress.grade >= WATCH_GRADES.length - 1 || progress.materials < cost}
        >
          강화하기 {Number.isFinite(cost) ? `(재료 ${cost}개)` : "(최고 등급)"}
        </button>
        <h3>로봇 출동 모드</h3>
        <div className="hj-watch-missions">
          <button onClick={() => onMission("villain")} disabled={!activeId}>
            악당 물리치기
          </button>
          <button onClick={() => onMission("rescue")} disabled={!activeId}>
            위험한 친구 구하기
          </button>
          <button onClick={() => onMission("thief")} disabled={!activeId}>
            도둑 잡기
          </button>
        </div>
      </section>
    </div>
  );
}
