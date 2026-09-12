import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import PublicHeader from "../components/PublicHeader";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import * as authService from "../services/authService";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { startSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      nextErrors.email = "Enter a valid email address";
    if (!form.password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const response = await authService.login(form);
      startSession(response);
      showToast("Welcome back — your workspace is ready.");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      showToast(
        getErrorMessage(error, "Login failed. Check your details."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-7 lg:min-h-[calc(100vh-76px)] lg:grid-cols-2 lg:py-16">
        <div className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Welcome back
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-bold tracking-[-0.04em] text-slate-950">
            A clearer path to your next offer.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-500">
            Pick up where you left off and turn today’s practice into lasting
            momentum.
          </p>
        </div>
        <Card className="mx-auto w-full max-w-md p-6 sm:p-8 lg:justify-self-end">
          <p className="text-sm font-semibold text-violet-600">Sign in</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your details to continue preparing.
          </p>
          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              value={form.email}
              error={errors.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              error={errors.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
            <Button type="submit" className="mt-2 w-full" loading={submitting}>
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to CareerTrack?{" "}
            <Link
              to="/register"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Create an account
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
