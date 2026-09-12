import { useEffect, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { getLeaderboard } from "../services/gamificationService";
import { getErrorMessage } from "../utils/getErrorMessage";

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (p) => {
    setLoading(true);
    try {
      const r = await getLeaderboard(p);
      setBoard(r.leaderboard);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(period); }, [period]);

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Leaderboard"
        description="See where you rank among other CareerTrack users. Rankings update in real time."
      />

      <div className="mb-5 flex gap-2">
        {[["all", "All Time"], ["weekly", "This Week"], ["monthly", "This Month"]].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${period === v ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : error ? (
        <EmptyState title="Leaderboard unavailable" description={error} actionLabel="Retry" onAction={() => load(period)} />
      ) : board.length === 0 ? (
        <EmptyState title="No rankings yet" description="Earn XP to appear on the leaderboard." />
      ) : (
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="hidden grid-cols-[60px_1fr_auto_auto_auto] gap-4 border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 sm:grid">
            <span>Rank</span><span>User</span><span>Level</span><span>Streak</span><span>XP</span>
          </div>
          {board.map((entry) => (
            <div key={entry._id} className={`flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0 transition ${entry.isCurrentUser ? "bg-violet-50/40" : "hover:bg-slate-50"}`}>
              <div className="w-12 text-center">
                {entry.rank <= 3
                  ? <span className="text-2xl">{RANK_ICONS[entry.rank - 1]}</span>
                  : <span className={`text-lg font-black ${entry.isCurrentUser ? "text-violet-600" : "text-slate-400"}`}>#{entry.rank}</span>}
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${entry.isCurrentUser ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {entry.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className={`font-bold text-sm ${entry.isCurrentUser ? "text-violet-600" : "text-slate-900"}`}>
                    {entry.name} {entry.isCurrentUser && <span className="text-xs font-normal">(you)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-amber-500">Lv.{entry.level}</span>
                <span className="text-slate-500">🔥 {entry.currentStreak}d</span>
                <span className="font-bold text-violet-500">{entry.xp?.toLocaleString()} XP</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
