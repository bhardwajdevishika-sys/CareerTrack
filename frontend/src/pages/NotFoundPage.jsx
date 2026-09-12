import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          This page wandered off.
        </h1>
        <p className="mt-3 text-slate-500">
          Let’s get you back to a productive place.
        </p>
        <Link to="/">
          <Button className="mt-7">Back home</Button>
        </Link>
      </div>
    </main>
  );
}
