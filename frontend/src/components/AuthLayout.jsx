import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Alert } from "./AuthForm";
import Logo from "./Logo";
import { ArrowLeftIcon } from "./icons";

// Standing configuration of the registry. Fixed reference information only —
// no case data, no evidence records and no activity is shown before sign-in.
const REGISTRY_SPEC = [
  ["encryption", "AES-256-GCM"],
  ["integrity", "SHA-256"],
  ["signature", "ML-DSA-65"],
  ["custody log", "HMAC-SHA-256 chained"],
];

// Shared shell for the sign-in, registration and password reset pages.
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { isFirebaseConfigured } = useAuth();

  return (
    <div className="font-brand grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Institutional panel (desktop only) */}
      <aside className="surface-navy relative hidden overflow-hidden border-r-[3px] border-red-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-overlay absolute inset-0" aria-hidden="true" />

        <div className="relative">
          <Logo theme="light" />
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow text-slate-400">Restricted system</p>

          <h2 className="mt-4 text-[2rem] leading-tight">
            Authorised officers only.
          </h2>

          <p className="mt-5 text-[15px] leading-relaxed text-slate-300">
            This terminal provides access to sealed digital evidence and its
            chain of custody. Sign-in is individual and non-transferable. Every
            action taken after sign-in is recorded against your account and
            cannot be removed from the custody log.
          </p>

          <dl className="mt-9 divide-y divide-white/10 border-y border-white/15">
            {REGISTRY_SPEC.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3">
                <dt className="font-code text-[11px] uppercase tracking-wider text-slate-500">
                  {key}
                </dt>
                <dd className="font-code text-[13px] text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Digital Evidence System · Unauthorised
          access is an offence
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-slate-100 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <Link
            to="/"
            className="mb-8 hidden items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 lg:inline-flex"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to home
          </Link>

          <h1 className="text-[1.85rem] leading-tight tracking-tight text-slate-900">
            {title}
          </h1>

          <p className="mt-2 text-[15px] text-slate-600">{subtitle}</p>

          <div className="mt-7 rounded-sm border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
            {!isFirebaseConfigured && (
              <div className="mb-6">
                <Alert type="warning">
                  <p className="font-semibold">Firebase is not set up yet</p>
                  <p className="mt-1">
                    Copy <code className="font-code text-[13px]">frontend/.env.example</code> to{" "}
                    <code className="font-code text-[13px]">frontend/.env</code>, paste your
                    Firebase keys, then restart{" "}
                    <code className="font-code text-[13px]">npm run dev</code>.
                  </p>
                </Alert>
              </div>
            )}

            {children}
          </div>

          {footer && <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>}

          <p className="mt-8 border-t border-slate-300 pt-5 text-xs leading-relaxed text-slate-500">
            All sign-in attempts, successful or otherwise, are recorded. Do not
            share credentials or leave this terminal signed in and unattended.
          </p>
        </div>
      </main>
    </div>
  );
}
