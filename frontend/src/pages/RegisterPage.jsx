import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import PublicHeader from "../components/PublicHeader";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import * as authService from "../services/authService";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { startSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      nextErrors.email = "Enter a valid email address";
    if (form.password.length < 6)
      nextErrors.password = "Password must have at least 6 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const response = await authService.register(form);
      startSession(response);
      showToast("Your CareerTrack workspace is ready.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      showToast(
        getErrorMessage(error, "Registration failed. Please try again."),
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
            Start with intent
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-bold tracking-[-0.04em] text-slate-950">
            Your placement plan starts here.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-500">
            Create a focused space for DSA practice, thoughtful revision, and
            steady progress.
          </p>
        </div>
        <Card className="mx-auto w-full max-w-md p-6 sm:p-8 lg:justify-self-end">
          <p className="text-sm font-semibold text-violet-600">
            Create account
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Build your prep system
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            It takes less than a minute to begin.
          </p>
          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              id="name"
              label="Full name"
              autoComplete="name"
              value={form.name}
              error={errors.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
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
              autoComplete="new-password"
              value={form.password}
              error={errors.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
            <Button type="submit" className="mt-2 w-full" loading={submitting}>
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
