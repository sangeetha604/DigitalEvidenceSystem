import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth-context";
import { getAuthErrorMessage } from "../lib/authErrors";
import AuthLayout from "../components/AuthLayout";
import {
  Alert,
  PasswordField,
  SubmitButton,
  TextField,
} from "../components/AuthForm";

const MIN_PASSWORD_LENGTH = 8;

export default function Signup() {
  const { signup, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      await signup(name.trim(), email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your account to start managing digital evidence."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 underline-offset-2 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}

        <TextField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Your full name"
          autoComplete="name"
          disabled={loading || !isFirebaseConfigured}
          autoFocus
        />

        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading || !isFirebaseConfigured}
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={loading || !isFirebaseConfigured}
          hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={loading || !isFirebaseConfigured}
          invalid={passwordsMismatch}
          hint={passwordsMismatch ? "The passwords don't match yet." : undefined}
        />

        <SubmitButton
          loading={loading}
          loadingText="Creating account…"
          disabled={!isFirebaseConfigured}
        >
          Create account
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
