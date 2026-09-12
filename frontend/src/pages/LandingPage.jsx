import { Link } from "react-router-dom";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Button from "../components/Button";
import Card from "../components/Card";
import CountUp from "../components/CountUp";
import PublicHeader from "../components/PublicHeader";

const features = [
  [
    "◌",
    "DSA command center",
    "Track concepts, revision dates, and the problems that move you forward.",
  ],
  [
    "⌁",
    "Focused problem practice",
    "Keep every attempt, link, and insight in one calm workspace.",
  ],
  [
    "✦",
    "Momentum at a glance",
    "See your streak, daily target, and next revision without the noise.",
  ],
];

const steps = [
  [
    "01",
    "Map your topics",
    "Start with a clear DSA foundation and shape it around your own pace.",
  ],
  [
    "02",
    "Log real practice",
    "Capture every problem, attempt, and insight while it is still fresh.",
  ],
  [
    "03",
    "Protect your streak",
    "Use your daily goal and revision queue to build lasting consistency.",
  ],
  [
    "04",
    "Walk in prepared",
    "Arrive at interviews with visible progress and stronger recall.",
  ],
];

const fullFeatureSet = [
  [
    "◌",
    "DSA Tracker",
    "A focused home for concepts, revision dates, and solved counts.",
  ],
  [
    "↗",
    "Progress dashboard",
    "Keep your streak, daily target, and recent work in view.",
  ],
  [
    "⌁",
    "Problem workspace",
    "Log practice from major coding platforms without losing context.",
  ],
  [
    "▱",
    "Study roadmap",
    "Plan your preparation path and move through it deliberately.",
  ],
  [
    "◎",
    "Interview prep",
    "Keep future interview practice organized in one calm workspace.",
  ],
  [
    "✦",
    "AI guidance",
    "Thoughtful AI-powered prep support, arriving in a future phase.",
  ],
];

const proofPoints = [
  [
    10,
    "Core DSA areas",
    "Start with a structured foundation, then shape it around your own pace.",
  ],
  [
    4,
    "Steps to momentum",
    "Turn a scattered plan into a repeatable daily preparation rhythm.",
  ],
  [
    7,
    "Day revision view",
    "Keep the next week of review work visible before it slips away.",
  ],
];

function FloatingProductCards({ reduceMotion }) {
  const float = (duration, delay = 0) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -8, 0] },
          transition: { duration, delay, repeat: Infinity, ease: "easeInOut" },
        };

  return (
    <div
      className="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden="true"
    >
      <motion.div
        className="landing-float-card absolute right-5 top-8 w-48 p-4"
        {...float(5.8)}
      >
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Current streak</span>
          <span className="text-violet-600">Live</span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            04
          </span>
          <span className="pb-1 text-xs text-slate-500">days</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index < 4 ? "bg-violet-600" : "bg-slate-100"}`}
            />
          ))}
        </div>
      </motion.div>
      <motion.div
        className="landing-float-card absolute bottom-0 right-40 w-60 p-3.5"
        {...float(6.6, 0.6)}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-5 w-5 place-items-center rounded-md border border-violet-200 bg-violet-50 text-[10px] text-violet-600">
            ✓
          </span>
          <span className="flex-1 text-xs font-semibold text-slate-900">
            Two Sum
          </span>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Easy
          </span>
        </div>
      </motion.div>
      <motion.div
        className="landing-float-card absolute right-0 top-64 w-44 p-3.5"
        {...float(5.2, 1.1)}
      >
        <p className="text-[11px] font-semibold text-slate-500">
          Revision queue
        </p>
        <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
          3 topics due
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full w-3/5 rounded-full bg-violet-600" />
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll();
  const heroBackdropY = useTransform(scrollY, [0, 760], [0, -50]);

  const reveal = (initial, delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial,
          whileInView: { opacity: 1, x: 0, y: 0, scale: 1 },
          viewport: { once: true, amount: 0.18 },
          transition: { duration: 0.34, delay, ease: "easeOut" },
        };

  return (
    <div className="min-h-screen overflow-hidden bg-white">
      {!reduceMotion && (
        <motion.div
          className="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left bg-violet-600"
          style={{ scaleX: scrollYProgress }}
        />
      )}
      <PublicHeader />
      <main>
        <motion.section
          className="landing-hero relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-7 sm:pb-28 sm:pt-24"
          {...reveal({ opacity: 0, y: 14 })}
        >
          <motion.div
            className="landing-hero-backdrop"
            style={reduceMotion ? undefined : { y: heroBackdropY }}
            aria-hidden="true"
          >
            <div className="landing-dot-grid" />
            <div className="landing-orb landing-orb-one" />
            <div className="landing-orb landing-orb-two" />
          </motion.div>
          <FloatingProductCards reduceMotion={reduceMotion} />
          <motion.div
            className="relative z-10 max-w-3xl"
            {...reveal({ opacity: 0, y: 18, scale: 0.98 })}
          >
            <span className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              Placement preparation, without the chaos
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl">
              Build the discipline that gets you{" "}
              <span className="text-violet-600">placed.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              CareerTrack AI turns your DSA practice into a focused system — from
              the first array to your final interview round.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="landing-cta-glow px-5 py-3">
                  Start your prep journey <span>→</span>
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="px-5 py-3">
                  I already have an account
                </Button>
              </Link>
            </div>
          </motion.div>
          <div className="relative z-10 mt-14 grid gap-4 sm:grid-cols-3">
            {features.map(([icon, title, text], index) => (
              <motion.div
                key={title}
                {...reveal({ opacity: 0, y: 18, scale: 0.98 }, index * 0.07)}
              >
                <Card className="p-5 transition duration-200 hover:-translate-y-1 hover:shadow-md">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-lg text-violet-700">
                    {icon}
                  </span>
                  <h2 className="mt-4 font-bold tracking-tight text-slate-900">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-7 sm:py-28">
          <motion.div
            className="max-w-2xl"
            {...reveal({ opacity: 0, x: -22, scale: 0.98 })}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              A repeatable system
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              From scattered effort to a preparation rhythm.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              CareerTrack gives every part of your preparation a clear place, so
              you can spend less time managing plans and more time improving.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([number, title, text], index) => (
              <motion.div
                key={number}
                {...reveal({ opacity: 0, y: 20, scale: 0.96 }, index * 0.06)}
              >
                <Card className="h-full p-5">
                  <span className="text-sm font-bold text-violet-600">
                    {number}
                  </span>
                  <h3 className="mt-8 text-base font-bold tracking-tight text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="landing-feature-surface relative border-y border-slate-200 bg-slate-50/70">
          <div className="landing-feature-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-7 sm:py-28">
            <motion.div
              className="flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
              {...reveal({ opacity: 0, x: 22, scale: 0.98 })}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                  One preparation home
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                  Everything that supports your placement prep.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-slate-500">
                A product surface that grows with you — without making your
                daily workflow feel crowded.
              </p>
            </motion.div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fullFeatureSet.map(([icon, title, text], index) => (
                <motion.div
                  key={title}
                  {...reveal({ opacity: 0, y: 18, scale: 0.96 }, index * 0.05)}
                >
                  <Card className="h-full p-5 transition duration-200 hover:-translate-y-1 hover:shadow-md">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-lg text-violet-700">
                      {icon}
                    </span>
                    <h3 className="mt-5 font-bold tracking-tight text-slate-900">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {text}
                    </p>
                    {title === "AI guidance" && (
                      <span className="mt-4 inline-flex rounded-lg bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                        Coming soon
                      </span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-7 sm:py-28">
          <motion.div
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-3 sm:p-8"
            {...reveal({ opacity: 0, y: 18, scale: 0.97 })}
          >
            {proofPoints.map(([value, title, text], index) => (
              <motion.div
                key={title}
                {...reveal({ opacity: 0, y: 14 }, index * 0.08)}
                className="border-b border-slate-200 pb-5 last:border-0 last:pb-0 sm:border-b-0 sm:border-r sm:px-5 sm:pb-0 sm:last:border-r-0"
              >
                <p className="text-3xl font-bold tracking-tight text-violet-600">
                  <CountUp value={value} />
                </p>
                <p className="mt-2 text-base font-bold tracking-tight text-slate-900">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section
          className="mx-auto max-w-6xl px-5 pb-20 sm:px-7 sm:pb-28"
          {...reveal({ opacity: 0, y: 20, scale: 0.98 })}
        >
          <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-violet-50 p-8 sm:p-12">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-100 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
                Your next chapter starts small
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Start your prep journey with a plan you will want to return to.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Create your workspace, build the habit, and turn every session
                into visible progress.
              </p>
              <Link to="/register">
                <Button className="landing-cta-glow mt-7 px-5 py-3">
                  Start your prep journey <span>→</span>
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
      <footer className="border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="font-bold tracking-tight text-slate-900">
              CareerTrack <span className="text-violet-600">AI</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              A calmer system for serious placement preparation.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-500">
            <a href="#">About</a>
            <a href="#">GitHub</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
