"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThemeId } from "@/lib/course";

type Point = { x: number; y: number };

const themeLabels: Record<ThemeId, { item: string; hazard: string; goal: string }> = {
  wildlife: { item: "Beacon", hazard: "Rock", goal: "Field station" },
  museum: { item: "Exhibit tag", hazard: "Barrier", goal: "Control room" },
  space: { item: "Energy cell", hazard: "Leak", goal: "Command deck" },
};

const levelItems: Record<number, Point[]> = {
  1: [{ x: 3, y: 4 }, { x: 5, y: 2 }, { x: 6, y: 0 }],
  2: [{ x: 1, y: 0 }, { x: 4, y: 1 }, { x: 6, y: 3 }],
};

const levelHazards: Record<number, Point[]> = {
  1: [{ x: 2, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 1 }],
  2: [{ x: 2, y: 1 }, { x: 3, y: 3 }, { x: 5, y: 4 }, { x: 6, y: 1 }],
};

function pointKey(point: Point): string {
  return `${point.x}-${point.y}`;
}

export function MissionGame({
  theme,
  stageNumber,
  runVersion,
  blocks,
}: {
  theme: ThemeId;
  stageNumber: number;
  runVersion: number;
  blocks: string[];
}) {
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Point>({ x: 1, y: 4 });
  const [collected, setCollected] = useState<string[]>([]);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [status, setStatus] = useState<"ready" | "playing" | "won" | "retry">("ready");
  const [message, setMessage] = useState("Press Start, then use the arrow keys or controls.");
  const labels = themeLabels[theme];
  const items = levelItems[level];
  const hazards = useMemo(() => stageNumber >= 4 ? levelHazards[level] : [], [level, stageNumber]);
  const score = stageNumber >= 5 ? collected.length : 0;

  const itemKeys = useMemo(() => new Set(items.map(pointKey)), [items]);
  const hazardKeys = useMemo(() => new Set(hazards.map(pointKey)), [hazards]);

  const reset = useCallback((nextLevel = level) => {
    setLevel(nextLevel);
    setPlayer(nextLevel === 1 ? { x: 1, y: 4 } : { x: 0, y: 4 });
    setCollected([]);
    setLives(3);
    setTimeLeft(nextLevel === 2 ? 25 : 30);
    setStatus("ready");
    setMessage("Press Start, then use the arrow keys or controls.");
  }, [level]);

  const move = useCallback((dx: number, dy: number) => {
    if (status !== "playing") return;
    setPlayer((current) => {
      const next = {
        x: Math.max(0, Math.min(6, current.x + dx)),
        y: Math.max(0, Math.min(4, current.y + dy)),
      };
      const key = pointKey(next);

      if (stageNumber >= 4 && itemKeys.has(key) && !collected.includes(key)) {
        const nextCollected = [...collected, key];
        setCollected(nextCollected);
        setMessage(`${labels.item} collected: ${nextCollected.length} of 3.`);
        if (stageNumber >= 6 && nextCollected.length === 3) {
          setStatus("won");
          setMessage(level === 1 && stageNumber >= 7 ? "Level one complete. Level two is ready." : `${labels.goal} reached. Mission complete.`);
        }
      } else if (stageNumber >= 4 && hazardKeys.has(key)) {
        const nextLives = lives - 1;
        setLives(nextLives);
        setMessage(`${labels.hazard} hit. ${Math.max(0, nextLives)} lives left.`);
        if (stageNumber >= 6 && nextLives <= 0) {
          setStatus("retry");
          setMessage("Round finished. Use Retry to restore the starting values.");
        }
        return level === 1 ? { x: 1, y: 4 } : { x: 0, y: 4 };
      } else {
        setMessage(next.x === current.x && next.y === current.y ? "Map edge reached." : `Player moved to (${next.x}, ${next.y}).`);
      }
      return next;
    });
  }, [collected, hazardKeys, itemKeys, labels.goal, labels.hazard, labels.item, level, lives, stageNumber, status]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (stageNumber < 2) return;
      const directions: Record<string, [number, number]> = {
        ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        move(direction[0], direction[1]);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move, stageNumber]);

  useEffect(() => {
    if (stageNumber < 5 || status !== "playing") return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          if (stageNumber >= 6) {
            setStatus("retry");
            setMessage("Time is up. Retry with a clearer route.");
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stageNumber, status]);

  const programPoint = useMemo(() => {
    const next = { x: 1, y: 4 };
    const movement = blocks.flatMap((block) => block === "repeat3" ? ["right", "right", "right"] : [block]);
    movement.forEach((block) => {
      if (block === "right") next.x += 1;
      if (block === "left") next.x -= 1;
      if (block === "up") next.y -= 1;
      if (block === "down") next.y += 1;
      next.x = Math.max(0, Math.min(6, next.x));
      next.y = Math.max(0, Math.min(4, next.y));
    });
    return next;
  }, [blocks]);

  const displayedPlayer = status === "ready" && runVersion > 0 ? programPoint : player;
  const displayedMessage = status === "ready" && runVersion > 0
    ? `Program finished on tile (${programPoint.x}, ${programPoint.y}).`
    : message;

  return (
    <section className="game-card" aria-label="Mission game preview">
      <div className="game-topline">
        <div>
          <span>LIVE PROJECT</span>
          <strong>{labels.goal}</strong>
        </div>
        <div className="game-values" aria-label="Game values">
          <span>Level <b>{level}</b></span>
          {stageNumber >= 5 && <span>Score <b>{score}/3</b></span>}
          {stageNumber >= 5 && <span>Lives <b>{lives}</b></span>}
          {stageNumber >= 5 && <span>Time <b>{timeLeft}</b></span>}
        </div>
      </div>

      <div className={`mission-grid theme-${theme}`} tabIndex={0} aria-label="Seven by five mission map">
        {Array.from({ length: 35 }, (_, index) => {
          const point = { x: index % 7, y: Math.floor(index / 7) };
          const key = pointKey(point);
          const isPlayer = displayedPlayer.x === point.x && displayedPlayer.y === point.y;
          const isItem = stageNumber >= 4 && itemKeys.has(key) && !collected.includes(key);
          const isHazard = stageNumber >= 4 && hazardKeys.has(key);
          const isGoal = point.x === 6 && point.y === 0;
          return (
            <div className={`mission-tile${isHazard ? " is-hazard" : ""}${isGoal ? " is-goal" : ""}`} key={key}>
              {isGoal && <span className="goal-marker" title={labels.goal}>▰</span>}
              {isItem && <span className="item-marker" title={labels.item}>◆</span>}
              {isPlayer && <span className="player-marker" title="Player">▲</span>}
            </div>
          );
        })}
      </div>

      <p className="game-message" aria-live="polite">{displayedMessage}</p>
      <div className="game-controls">
        {status === "ready" && <button type="button" onClick={() => setStatus("playing")}>Start</button>}
        {status === "won" && level === 1 && stageNumber >= 7 && <button type="button" onClick={() => reset(2)}>Open level 2</button>}
        {(status === "retry" || status === "won") && !(status === "won" && level === 1 && stageNumber >= 7) && <button type="button" onClick={() => reset(level)}>Retry</button>}
        <div className="direction-pad" aria-label="Movement controls">
          <button type="button" onClick={() => move(0, -1)} aria-label="Move up">↑</button>
          <button type="button" onClick={() => move(-1, 0)} aria-label="Move left">←</button>
          <button type="button" onClick={() => move(0, 1)} aria-label="Move down">↓</button>
          <button type="button" onClick={() => move(1, 0)} aria-label="Move right">→</button>
        </div>
      </div>
    </section>
  );
}
