import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/auth-context";
import { getAuthErrorMessage } from "../lib/authErrors";
import AuthLayout from "../components/AuthLayout";
import { MailIcon } from "../components/icons";
import { Alert, SubmitButton, TextField } from "../components/AuthForm";

export default function ForgotPassword() {
  const { resetPassword, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter the email address you used to sign up.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      // For privacy we give the same answer whether or not the account exists,
      // so nobody can use this form to find out who has an account.
      if (err?.code === "auth/user-not-found") {
        setSentTo(email.trim());
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  function tryAnotherEmail() {
    setSentTo("");
    setEmail("");
    setError("");
  }

  const backToLogin = (
    <>
      Remembered it?{" "}
      <Link to="/login" className="font-semibold text-blue-600 underline-offset-2 hover:underline">
        Back to log in
      </Link>
    </>
  );

  // Confirmation screen
  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions."
        footer={backToLogin}
      >
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-slate-700">
            <MailIcon className="h-7 w-7" />
          </span>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            If an account exists for{" "}
            <span className="break-all font-semibold text-slate-900">{sentTo}</span>, a link to
            reset your password is on its way. It can take a few minutes to arrive, so check your
            spam folder too.
          </p>

          <button
            type="button"
            onClick={tryAnotherEmail}
            className="mt-6 text-sm font-semibold text-blue-600 underline-offset-2 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}

        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading || !isFirebaseConfigured}
          autoFocus
        />

        <SubmitButton
          loading={loading}
          loadingText="Sending link…"
          disabled={!isFirebaseConfigured}
        >
          Send reset link
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
