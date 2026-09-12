import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import * as gamificationService from "../services/gamificationService";
import { getErrorMessage } from "../utils/getErrorMessage";

const LEVEL_THRESHOLDS = [0,100,250,500,850,1300,1900,2700,3700,5000,6600,8500,11000,14000,18000,23000,29000,36000,45000,56000];

const getLevelInfo = (xp) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const cur = LEVEL_THRESHOLDS[level - 1] || 0;
  const next = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pct = level >= LEVEL_THRESHOLDS.length ? 100 : Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100));
  return { level, cur, next, pct, xpIntoLevel: xp - cur, xpNeeded: next - cur };
};

function AchievementBadge({ achievement }) {
  return (
    <div className={`rounded-xl border p-4 transition ${achievement.unlocked
      ? "border-violet-200 bg-violet-50/50"
      : "border-slate-100 bg-slate-50 opacity-50"}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <p className={`font-bold text-sm ${achievement.unlocked ? "text-slate-900" : "text-slate-500"}`}>{achievement.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{achievement.description}</p>
          {achievement.xpReward > 0 && <p className="text-xs text-violet-500 mt-1">+{achievement.xpReward} XP</p>}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-emerald-500 mt-1">✓ {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge }) {
  const pct = challenge.target > 0 ? Math.min(100, Math.round((challenge.current / challenge.target) * 100)) : 0;
  const timeLeft = new Date(challenge.deadline) - new Date();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600000));

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-sm text-slate-900">{challenge.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{challenge.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {challenge.completed
            ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Completed ✓</span>
            : <span className="text-xs text-slate-400">{hoursLeft}h left</span>}
          <span className="text-xs text-amber-500 font-semibold">🪙 +{challenge.coinReward}</span>
        </div>
      </div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{challenge.current} / {challenge.target}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${challenge.completed ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-violet-500">⭐ +{challenge.xpReward} XP on completion</p>
    </Card>
  );
}

export default function GamificationPage() {
  const [status, setStatus] = useState(null);
  const [challenges, setChallenges] = useState({ daily: [], weekly: [] });
  const [achievements, setAchievements] = useState([]);
  const [xpHistory, setXPHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [claimingReward, setClaimingReward] = useState(false);
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, a, xp] = await Promise.all([
        gamificationService.getGamificationStatus(),
        gamificationService.getChallenges(),
        gamificationService.getAchievements(),
        gamificationService.getXPHistory(),
      ]);
      setStatus(s.gamification);
      setChallenges(c.challenges);
      setAchievements(a.achievements || []);
      setXPHistory(xp.transactions || []);
    } catch (e) { showToast(getErrorMessage(e), "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleClaimReward = async () => {
    setClaimingReward(true);
    try {
      const r = await gamificationService.claimDailyReward();
      showToast(`🎁 +${r.reward.xpReward} XP, +${r.reward.coinReward} coins!`);
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
    finally { setClaimingReward(false); }
  };

  const handleBuyFreeze = async () => {
    setBuyingFreeze(true);
    try {
      const r = await gamificationService.buyStreakFreeze();
      showToast(`🛡️ ${r.message}`);
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
    finally { setBuyingFreeze(false); }
  };

  if (loading) return <PageLoader />;

  const levelInfo = status ? getLevelInfo(status.xp) : null;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHeader
        eyebrow="Gamification"
        title="XP & Progress"
        description="Your placement journey, gamified. Earn XP, level up, maintain streaks."
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[["overview","Overview"], ["challenges","Challenges"], ["achievements","Achievements"], ["history","XP History"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === v ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && status && levelInfo && (
        <div className="space-y-5">
          {/* Level card */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Level</p>
                <p className="text-4xl font-black text-violet-500">Level {status.level}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{status.xp.toLocaleString()} XP</p>
                <p className="text-sm text-slate-500">{levelInfo.xpIntoLevel} / {levelInfo.xpNeeded} to Level {status.level + 1}</p>
              </div>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                initial={{ width: 0 }} animate={{ width: `${levelInfo.pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: "🔥", label: "Current Streak", value: `${status.currentStreak} days` },
              { icon: "📈", label: "Longest Streak", value: `${status.longestStreak} days` },
              { icon: "🪙", label: "Coins", value: status.coins.toLocaleString() },
              { icon: "🛡️", label: "Streak Freezes", value: status.streakFreezes },
            ].map(({ icon, label, value }) => (
              <Card key={label} className="p-4 text-center">
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </Card>
            ))}
          </div>

          {/* Daily Reward + Streak Freeze */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 mb-2">Daily Reward 🎁</h3>
              <p className="text-sm text-slate-500 mb-4">Claim once per day for XP and coins. Consecutive days give better rewards.</p>
              {status.dailyRewardAvailable ? (
                <Button onClick={handleClaimReward} loading={claimingReward} className="w-full">Claim Today's Reward</Button>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-600">
                  ✓ Claimed today — come back tomorrow!
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 mb-2">Streak Freeze 🛡️</h3>
              <p className="text-sm text-slate-500 mb-2">Costs 100 coins. Protects your streak if you miss a day.</p>
              <p className="text-sm font-semibold text-amber-500 mb-4">You have {status.coins} coins · {status.streakFreezes} freeze{status.streakFreezes !== 1 ? "s" : ""}</p>
              <Button variant="secondary" onClick={handleBuyFreeze} loading={buyingFreeze} disabled={status.coins < 100} className="w-full">
                Buy Streak Freeze (100 🪙)
              </Button>
            </Card>
          </div>

          {/* Achievement preview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Achievements</h3>
              <button onClick={() => setTab("achievements")} className="text-xs font-semibold text-violet-500 hover:underline">
                {unlockedCount}/{achievements.length} unlocked
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {achievements.filter((a) => a.unlocked).slice(0, 4).map((a) => (
                <AchievementBadge key={a._id} achievement={a} />
              ))}
              {unlockedCount === 0 && <p className="text-sm text-slate-500 col-span-2">Complete activities to unlock achievements!</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === "challenges" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-slate-900 mb-3">Daily Challenges</h2>
            {challenges.daily.length === 0 ? (
              <EmptyState title="No active challenges" description="Check back after logging some activity." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {challenges.daily.map((c) => <ChallengeCard key={c._id} challenge={c} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 mb-3">Weekly Challenges</h2>
            {challenges.weekly.length === 0 ? (
              <EmptyState title="No weekly challenges" description="Weekly challenges reset every Sunday." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {challenges.weekly.map((c) => <ChallengeCard key={c._id} challenge={c} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "achievements" && (
        <div>
          <p className="text-sm text-slate-500 mb-4">{unlockedCount}/{achievements.length} achievements unlocked</p>
          {["dsa","sql","streak","study","goals","tasks","general"].map((cat) => {
            const catAchievements = achievements.filter((a) => a.category === cat);
            if (!catAchievements.length) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="font-bold text-slate-900 mb-3 capitalize">{cat}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catAchievements.map((a) => <AchievementBadge key={a._id} achievement={a} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <Card>
          <div className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">XP Transaction History</div>
          {xpHistory.length === 0 ? (
            <EmptyState title="No XP history" description="Earn XP by solving problems, completing tasks, and more." />
          ) : (
            xpHistory.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{tx.description}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <span className="font-bold text-violet-500">+{tx.amount} XP</span>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}
