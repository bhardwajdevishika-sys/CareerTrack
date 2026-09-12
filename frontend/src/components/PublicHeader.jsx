import { Link, NavLink } from "react-router-dom";
import Button from "./Button";

export default function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-7">
      <Link to="/" className="flex items-center gap-2.5 text-slate-950">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-lg font-black text-white shadow-lg shadow-violet-200">
          P
        </span>
        <span className="font-bold tracking-tight">
          CareerTrack <span className="text-violet-600">AI</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <NavLink to="/login">
          <Button variant="ghost">Log in</Button>
        </NavLink>
        <NavLink to="/register">
          <Button className="hidden sm:inline-flex">Get started</Button>
        </NavLink>
      </div>
    </header>
  );
}
