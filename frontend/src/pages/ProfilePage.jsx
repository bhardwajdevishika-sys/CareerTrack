import { useState } from "react";
import { motion } from "framer-motion";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../utils/getErrorMessage";

const LEVEL_THRESHOLDS = [0,100,250,500,850,1300,1900,2700,3700,5000,6600,8500,11000,14000,18000,23000,29000,36000,45000,56000];

const getLevelInfo = (xp = 0) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const cur = LEVEL_THRESHOLDS[level - 1] || 0;
  const next = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pct = level >= LEVEL_THRESHOLDS.length ? 100 : Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100));
  return { level, pct, xpIntoLevel: xp - cur, xpNeeded: next - cur };
};

export default function ProfilePage() {
  const { user, saveProfile } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    college: user?.college || "",
    degree: user?.degree || "",
    graduationYear: user?.graduationYear || "",
    targetRole: user?.targetRole || "",
    targetCompanies: user?.targetCompanies?.join(", ") || "",
    skills: user?.skills?.join(", ") || "",
    bio: user?.bio || "",
    dailyGoal: user?.dailyGoal || 3,
    dailyStudyGoalMinutes: user?.dailyStudyGoalMinutes || 60,
  });

  const levelInfo = getLevelInfo(user?.xp || 0);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({
        ...form,
        targetCompanies: form.targetCompanies ? form.targetCompanies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
      });
      showToast("Profile updated successfully");
      setEditing(false);
    } catch (e) { showToast(getErrorMessage(e), "error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Account" title="Your Profile" description="View and update your placement preparation profile." />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left panel */}
        <div className="space-y-5">
          {/* Avatar + level */}
          <Card className="p-6 text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-3xl font-black text-white shadow-lg">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <h2 className="font-bold text-slate-900 text-lg">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.targetRole && <p className="mt-1 text-sm text-violet-500">🎯 {user.targetRole}</p>}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1.5">Level {levelInfo.level} — {levelInfo.xpIntoLevel}/{levelInfo.xpNeeded} XP</p>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                  initial={{ width: 0 }} animate={{ width: `${levelInfo.pct}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-5">
            <h3 className="font-bold text-slate-900 mb-3">Stats</h3>
            <div className="space-y-2.5">
              {[
                { icon: "⭐", label: "Total XP", value: (user?.xp || 0).toLocaleString() },
                { icon: "🏆", label: "Level", value: user?.level || 1 },
                { icon: "🪙", label: "Coins", value: (user?.coins || 0).toLocaleString() },
                { icon: "🔥", label: "Current Streak", value: `${user?.currentStreak || 0} days` },
                { icon: "📈", label: "Longest Streak", value: `${user?.longestStreak || 0} days` },
                { icon: "🛡️", label: "Streak Freezes", value: user?.streakFreezes || 0 },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{icon} {label}</span>
                  <span className="font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Skills */}
          {user?.skills?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((s) => (
                  <span key={s} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">{s}</span>
                ))}
              </div>
            </Card>
          )}

          {/* Target Companies */}
          {user?.targetCompanies?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 mb-3">Target Companies</h3>
              <div className="flex flex-wrap gap-1.5">
                {user.targetCompanies.map((c) => (
                  <span key={c} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">{c}</span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-900 text-lg">Profile Information</h2>
            {!editing && <Button variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Button>}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="profile-name" label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input id="profile-college" label="College / University" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
                <Input id="profile-degree" label="Degree" placeholder="e.g. B.Tech CSE" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
                <Input id="profile-year" label="Graduation Year" type="number" min="2020" max="2035" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
                <Input id="profile-target-role" label="Target Role" placeholder="e.g. SDE, Data Analyst" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} />
                <Input id="profile-daily-goal" label="Daily DSA Goal (problems)" type="number" min="1" value={form.dailyGoal} onChange={(e) => setForm({ ...form, dailyGoal: parseInt(e.target.value) || 3 })} />
                <Input id="profile-study-goal" label="Daily Study Goal (minutes)" type="number" min="0" value={form.dailyStudyGoalMinutes} onChange={(e) => setForm({ ...form, dailyStudyGoalMinutes: parseInt(e.target.value) || 60 })} />
              </div>
              <Input id="profile-companies" label="Target Companies (comma separated)" placeholder="Google, Microsoft, Amazon" value={form.targetCompanies} onChange={(e) => setForm({ ...form, targetCompanies: e.target.value })} />
              <Input id="profile-skills" label="Skills (comma separated)" placeholder="Java, Python, SQL, React" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <label className="block text-sm font-medium text-slate-700">
                Bio (optional)
                <textarea rows="3" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {[
                { label: "Full Name", value: user?.name },
                { label: "Email", value: user?.email },
                { label: "College", value: user?.college || "—" },
                { label: "Degree", value: user?.degree || "—" },
                { label: "Graduation Year", value: user?.graduationYear || "—" },
                { label: "Target Role", value: user?.targetRole || "—" },
                { label: "Daily DSA Goal", value: `${user?.dailyGoal || 3} problems/day` },
                { label: "Daily Study Goal", value: `${user?.dailyStudyGoalMinutes || 60} minutes/day` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-wrap items-start gap-4 border-b border-slate-100 pb-4 last:border-0">
                  <p className="w-40 shrink-0 text-sm font-semibold text-slate-500">{label}</p>
                  <p className="text-sm text-slate-900">{value}</p>
                </div>
              ))}
              {user?.bio && (
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-sm font-semibold text-slate-500 mb-1">Bio</p>
                  <p className="text-sm text-slate-700">{user.bio}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
