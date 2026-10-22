import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth-context";
import { getAuthErrorMessage } from "../lib/authErrors";
import AuthLayout from "../components/AuthLayout";
import {
  Alert,
  PasswordField,
  SubmitButton,
  TextField,
} from "../components/AuthForm";

export default function Login() {
  const { login, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If the user was sent here from a protected page, go back there after login.
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Officer sign-in"
      subtitle="Sign in with your registered account to open the evidence dashboard."
      footer={
        <>
          No account yet?{" "}
          <Link to="/signup" className="font-semibold text-blue-600 underline-offset-2 hover:underline">
            Request access
          </Link>
        </>
      }
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

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={loading || !isFirebaseConfigured}
          labelAction={
            <Link
              to="/forgot-password"
              className="text-[13px] font-medium text-blue-600 underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <SubmitButton
          loading={loading}
          loadingText="Signing in…"
          disabled={!isFirebaseConfigured}
        >
          Sign in
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
