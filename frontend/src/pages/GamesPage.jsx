import { useCallback, useEffect, useRef, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import { submitGameResult, getGameStats } from "../services/gameService";
import { getErrorMessage } from "../utils/getErrorMessage";

// ── Memory Game ────────────────────────────────────────────────────────────────
const EMOJIS = ["🧠","⚡","🎯","🔥","💡","🏆","⭐","🚀"];

function MemoryGame({ onComplete }) {
  const [cards, setCards] = useState(() => {
    const deck = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
    return deck;
  });
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime] = useState(Date.now());

  const flip = (card) => {
    if (card.flipped || card.matched || selected.length === 2) return;
    const newCards = cards.map((c) => c.id === card.id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, card];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      if (newSelected[0].emoji === newSelected[1].emoji) {
        setTimeout(() => {
          setCards((c) => c.map((x) => (x.id === newSelected[0].id || x.id === newSelected[1].id) ? { ...x, matched: true } : x));
          setSelected([]);
          if (cards.filter((x) => !x.matched).length === 2) {
            setDone(true);
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const score = Math.max(0, 100 - moves * 5);
            onComplete(score, elapsed);
          }
        }, 400);
      } else {
        setTimeout(() => {
          setCards((c) => c.map((x) => (x.id === newSelected[0].id || x.id === newSelected[1].id) ? { ...x, flipped: false } : x));
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">Moves: {moves} | Match all pairs to complete</p>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <button key={card.id} onClick={() => flip(card)}
            className={`aspect-square rounded-xl border-2 text-2xl transition-all ${card.matched ? "border-emerald-400 bg-emerald-50 cursor-default" : card.flipped ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-slate-100 hover:bg-slate-200"}`}>
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
      {done && <p className="mt-3 text-center font-bold text-emerald-600">🎉 Completed in {moves} moves!</p>}
    </div>
  );
}

// ── Number Sequence ────────────────────────────────────────────────────────────
function NumberSequenceGame({ onComplete }) {
  const [sequence] = useState(() => {
    const start = Math.floor(Math.random() * 5) + 1;
    const step = Math.floor(Math.random() * 4) + 2;
    return Array.from({ length: 6 }, (_, i) => start + i * step);
  });
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = sequence[sequence.length - 1];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const isCorrect = parseInt(answer) === correct;
    onComplete(isCorrect ? 100 : 0, 0);
  };

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">What comes next in the sequence?</p>
      <div className="flex gap-3 items-center mb-6 flex-wrap">
        {sequence.slice(0, -1).map((n, i) => (
          <span key={i} className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-600 text-lg font-bold border border-violet-200">{n}</span>
        ))}
        <span className="grid h-12 w-16 place-items-center rounded-xl bg-amber-50 text-amber-600 text-sm font-bold border border-amber-200 border-dashed">?</span>
      </div>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer"
            className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500" />
          <Button type="submit" disabled={!answer}>Submit</Button>
        </form>
      ) : (
        <div className={`rounded-xl p-4 ${parseInt(answer) === correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {parseInt(answer) === correct ? "✅ Correct!" : `❌ The answer was ${correct}`}
        </div>
      )}
    </div>
  );
}

// ── Reaction Challenge ─────────────────────────────────────────────────────────
function ReactionGame({ onComplete }) {
  const [state, setState] = useState("waiting"); // waiting | ready | go | done
  const [reactionTime, setReactionTime] = useState(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const start = () => {
    setState("waiting");
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setState("go");
      startRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (state === "waiting") {
      clearTimeout(timerRef.current);
      setState("waiting");
      setTimeout(start, 500);
      return;
    }
    if (state === "go") {
      const rt = Date.now() - startRef.current;
      setReactionTime(rt);
      setState("done");
      const score = rt < 200 ? 100 : rt < 300 ? 80 : rt < 400 ? 60 : rt < 600 ? 40 : 20;
      onComplete(score, 0);
    }
  };

  useEffect(() => { start(); return () => clearTimeout(timerRef.current); }, []);

  return (
    <div className="text-center">
      <p className="text-sm text-slate-500 mb-4">Click the button as fast as possible when it turns green!</p>
      <button onClick={handleClick}
        className={`w-48 h-48 rounded-full text-lg font-bold transition-all mx-auto block ${
          state === "go" ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-200"
          : state === "waiting" ? "bg-rose-100 text-rose-500 cursor-pointer"
          : "bg-slate-100 text-slate-500"
        }`}>
        {state === "go" ? "CLICK!" : state === "waiting" ? "Wait..." : state === "done" ? `${reactionTime}ms` : "Ready"}
      </button>
      {state === "done" && reactionTime && (
        <p className="mt-4 text-sm font-semibold text-slate-700">
          {reactionTime < 250 ? "⚡ Lightning fast!" : reactionTime < 400 ? "✅ Good reaction!" : "🐢 Keep practicing!"}
        </p>
      )}
    </div>
  );
}

// ── Quick Aptitude ─────────────────────────────────────────────────────────────
function AptitudeGame({ onComplete }) {
  const questions = [
    { q: "If 5 workers build a wall in 10 days, how many days for 2 workers?", a: "25", choices: ["20","25","30","50"] },
    { q: "What is 15% of 240?", a: "36", choices: ["30","36","40","45"] },
    { q: "A train travels 120km in 2 hours. Speed in km/h?", a: "60", choices: ["40","50","60","70"] },
    { q: "If 3x - 7 = 14, then x = ?", a: "7", choices: ["5","6","7","8"] },
  ];
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);

  const handleAnswer = (choice) => {
    if (answered !== null) return;
    setAnswered(choice);
    const correct = choice === questions[current].a;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        const finalScore = Math.round(((correct ? score + 1 : score) / questions.length) * 100);
        onComplete(finalScore, 0);
      } else {
        setCurrent((c) => c + 1);
        setAnswered(null);
      }
    }, 800);
  };

  const q = questions[current];

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">Question {current + 1} of {questions.length}</p>
      <p className="font-semibold text-slate-900 mb-4">{q.q}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.choices.map((c) => (
          <button key={c} onClick={() => handleAnswer(c)} disabled={answered !== null}
            className={`rounded-xl border p-3 text-sm font-semibold transition ${
              answered === null ? "border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-700"
              : c === q.a ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : answered === c ? "border-rose-400 bg-rose-50 text-rose-700"
              : "border-slate-200 text-slate-400"
            }`}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const GAMES = [
  { id: "memory", type: "memory", label: "Memory Challenge", icon: "🧠", desc: "Match all emoji pairs", Component: MemoryGame },
  { id: "number_sequence", type: "number_sequence", label: "Number Sequence", icon: "🔢", desc: "Find the next number", Component: NumberSequenceGame },
  { id: "reaction", type: "reaction", label: "Reaction Challenge", icon: "⚡", desc: "Test your reflexes", Component: ReactionGame },
  { id: "quick_aptitude", type: "quick_aptitude", label: "Quick Aptitude", icon: "🧮", desc: "Speed math & reasoning", Component: AptitudeGame },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    getGameStats()
      .then((r) => setStats(r.stats || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGameComplete = async (score, duration) => {
    try {
      const r = await submitGameResult({ gameType: activeGame.type, score, duration });
      if (r.gamification?.xpResult?.xpAdded > 0) showToast(`⭐ +${r.gamification.xpResult.xpAdded} XP! Score: ${score}`);
      else showToast(`Game complete! Score: ${score}`);
      getGameStats().then((r) => setStats(r.stats || []));
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const statsMap = {};
  stats.forEach((s) => { statsMap[s._id] = s; });

  return (
    <div>
      <PageHeader
        eyebrow="Cognitive Training"
        title="Games"
        description="Sharpen your placement-relevant cognitive skills. Games award small XP bonuses."
      />

      {activeGame ? (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-lg">{activeGame.icon} {activeGame.label}</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setGameKey((k) => k + 1)}>↺ Restart</Button>
              <Button variant="ghost" onClick={() => setActiveGame(null)}>← Back</Button>
            </div>
          </div>
          <Card className="p-5">
            <activeGame.Component key={gameKey} onComplete={handleGameComplete} />
          </Card>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-6">
            {GAMES.map((game) => {
              const s = statsMap[game.type];
              return (
                <Card key={game.id} className="p-5 cursor-pointer hover:border-violet-400 transition" onClick={() => { setActiveGame(game); setGameKey((k) => k + 1); }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{game.icon}</span>
                    {s && <span className="text-xs font-bold text-violet-500 bg-violet-50 px-2 py-1 rounded-full">Best: {s.bestScore}</span>}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{game.label}</h3>
                  <p className="text-sm text-slate-500 mb-3">{game.desc}</p>
                  {s && <p className="text-xs text-slate-400">{s.attempts} attempts · avg {Math.round(s.avgScore)}</p>}
                  <Button className="w-full mt-3">Play</Button>
                </Card>
              );
            })}
          </div>

          {/* High scores */}
          {stats.length > 0 && (
            <Card>
              <div className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">Your High Scores</div>
              {stats.map((s) => {
                const game = GAMES.find((g) => g.type === s._id);
                return (
                  <div key={s._id} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{game?.icon || "🎮"}</span>
                      <p className="text-sm font-semibold text-slate-700">{game?.label || s._id}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-violet-500 font-bold">Best: {s.bestScore}</span>
                      <span className="text-slate-400">{s.attempts} plays</span>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
