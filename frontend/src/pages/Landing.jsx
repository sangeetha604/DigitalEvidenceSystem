import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/auth-context";
import Logo from "../components/Logo";
import {
  AlertIcon,
  CloseIcon,
  DocumentIcon,
  HashIcon,
  LinkIcon,
  LockIcon,
  MenuIcon,
  SignatureIcon,
} from "../components/icons";

// -----------------------------
// Content
// -----------------------------

const NAV_LINKS = [
  { label: "Guarantees", href: "#guarantees" },
  { label: "Procedure", href: "#procedure" },
  { label: "Cryptography", href: "#cryptography" },
  { label: "Scope", href: "#scope" },
];

// The properties the system is accountable for, and how each is met.
const GUARANTEES = [
  {
    icon: HashIcon,
    name: "Integrity",
    mechanism: "SHA-256",
    text: "A fingerprint is taken the moment evidence is registered and recomputed at every verification. A single altered bit produces an entirely different value.",
  },
  {
    icon: LockIcon,
    name: "Confidentiality",
    mechanism: "AES-256-GCM",
    text: "Each file is encrypted under its own key before it is written to storage. The stored bytes carry no meaning without that key.",
  },
  {
    icon: AlertIcon,
    name: "Tamper detection",
    mechanism: "Authenticated encryption",
    text: "GCM rejects modified ciphertext outright rather than returning corrupted data, so interference with storage is caught rather than inherited.",
  },
  {
    icon: SignatureIcon,
    name: "Authenticity",
    mechanism: "ML-DSA-65",
    text: "Every evidence hash is signed with a NIST-standardised post-quantum signature, establishing which officer registered the exhibit.",
  },
  {
    icon: LinkIcon,
    name: "Accountability",
    mechanism: "HMAC-SHA-256",
    text: "Each custody record is chained to the record before it, so removing or editing any entry invalidates every entry that follows.",
  },
  {
    icon: DocumentIcon,
    name: "Attribution",
    mechanism: "Case register",
    text: "Case identifier, evidence type, collecting officer, location and description are recorded against the exhibit at the point of registration.",
  },
];

const PROCEDURE = [
  {
    title: "Register the exhibit",
    text: "The file is submitted with its case identifier, evidence type, collecting officer and place of collection.",
  },
  {
    title: "Protection is applied",
    text: "The system encrypts the file, records its SHA-256 hash, signs that hash with ML-DSA-65 and issues a unique evidence identifier.",
  },
  {
    title: "Verify on demand",
    text: "Integrity and signature can be re-checked at any time. Every result, pass or fail, is written to the chain of custody.",
  },
];

const ALGORITHMS = [
  {
    name: "AES-256-GCM",
    protects: "Confidentiality",
    text: "Encrypts each stored file under its own key, with an authentication tag over the ciphertext.",
  },
  {
    name: "SHA-256",
    protects: "Integrity",
    text: "Fingerprints the file at registration and re-checks it at every verification.",
  },
  {
    name: "ML-DSA-65",
    protects: "Authenticity",
    text: "Signs each evidence hash with a post-quantum digital signature (FIPS 204).",
  },
  {
    name: "HMAC-SHA-256",
    protects: "Audit trail",
    text: "Links every custody record to the one recorded before it.",
  },
];

// Fixed specification of what is applied at registration — not sample case data.
const INTAKE_SPEC = [
  ["cipher", "AES-256-GCM"],
  ["digest", "SHA-256"],
  ["signature", "ML-DSA-65"],
  ["chain", "HMAC-SHA-256"],
  ["register", "case id · type · officer · location"],
];

// -----------------------------
// Buttons
// -----------------------------

const primaryButton =
  "inline-flex items-center justify-center rounded-sm bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700";

const compactButton =
  "inline-flex items-center justify-center rounded-sm bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700";

const secondaryButtonDark =
  "inline-flex items-center justify-center rounded-sm border border-slate-400/50 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10";

function AuthButtons({ className = "", stacked = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className={className} aria-hidden="true" />;
  }

  if (user) {
    return (
      <div className={className}>
        <Link to="/dashboard" className={stacked ? primaryButton : compactButton}>
          Open dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link
        to="/login"
        className={
          stacked
            ? secondaryButtonDark
            : "px-2 text-sm font-medium text-slate-300 transition hover:text-white"
        }
      >
        Sign in
      </Link>

      <Link to="/signup" className={stacked ? primaryButton : compactButton}>
        Request access
      </Link>
    </div>
  );
}

// -----------------------------
// Masthead
// -----------------------------

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-red-600 bg-slate-900">
      <nav
        className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 sm:px-8"
        aria-label="Main"
      >
        <Logo theme="light" />

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="border-b-2 border-transparent pb-0.5 text-sm font-medium text-slate-300 transition hover:border-red-600 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <AuthButtons className="hidden items-center gap-4 md:flex" />

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-sm text-slate-200 transition hover:bg-white/10 md:hidden"
        >
          {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-white/10 px-5 pb-6 pt-3 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/10 py-3 text-base font-medium text-slate-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <AuthButtons className="mt-5 flex flex-col gap-3" stacked />
        </div>
      )}
    </header>
  );
}

// -----------------------------
// Hero
// -----------------------------

function IntakeSpec() {
  return (
    <figure
      className="rounded-sm border border-white/15 bg-white/[0.03]"
      aria-label="Protection applied at registration"
    >
      <figcaption className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-3.5">
        <span className="font-record text-[15px] font-semibold text-white">
          Applied at registration
        </span>

        <span className="font-code rounded-sm border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
          standing configuration
        </span>
      </figcaption>

      <dl className="divide-y divide-white/10">
        {INTAKE_SPEC.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 px-5 py-3.5">
            <dt className="font-code text-[11px] uppercase tracking-wider text-slate-500">
              {key}
            </dt>
            <dd className="font-code text-[13px] text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-white/15 px-5 py-4 text-[13px] leading-relaxed text-slate-400">
        The original file is never written to storage in readable form. Only the
        ciphertext, the digest and the signature are retained.
      </p>
    </figure>
  );
}

function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="surface-navy relative overflow-hidden text-white">
      <div className="grid-overlay absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-24">
        <div>
          <p className="eyebrow text-slate-400">Digital forensics · Evidence custody</p>

          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.12] sm:text-5xl">
            Prove that an exhibit is the same one that was seized.
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-300">
            Digital evidence is encrypted, fingerprinted and digitally signed the
            moment it is registered. Every handling of it — registration,
            verification, or a failed check — is written to a tamper-evident
            chain of custody that can be produced in court.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {!loading && user ? (
              <Link to="/dashboard" className={primaryButton}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className={primaryButton}>
                  Request access
                </Link>

                <Link to="/login" className={secondaryButtonDark}>
                  Sign in
                </Link>
              </>
            )}
          </div>

          <p className="mt-9 max-w-lg border-l-2 border-red-600 pl-4 text-[13px] leading-relaxed text-slate-400">
            Restricted system. Access is limited to authorised investigating
            officers, evidence custodians and forensic analysts. All activity is
            attributable and logged.
          </p>
        </div>

        <IntakeSpec />
      </div>
    </section>
  );
}

// -----------------------------
// Guarantees
// -----------------------------

function Guarantees() {
  return (
    <section id="guarantees" className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">Section 01</p>

          <h2 className="mt-3 text-3xl leading-tight text-slate-900 sm:text-[2.3rem]">
            What the system is accountable for
          </h2>

          <p className="mt-4 max-w-md leading-relaxed text-slate-600">
            Protection is applied automatically at registration, so no guarantee
            depends on an officer remembering to invoke it.
          </p>
        </div>

        <dl className="border-t border-slate-200">
          {GUARANTEES.map(({ icon: Icon, name, mechanism, text }) => (
            <div
              key={name}
              className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-8"
            >
              <dt>
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>

                  <span className="font-record text-[17px] font-semibold text-slate-900">
                    {name}
                  </span>
                </span>

                <span className="font-code mt-2 block pl-12 text-xs text-slate-500 sm:pl-0">
                  {mechanism}
                </span>
              </dt>

              <dd className="max-w-xl leading-relaxed text-slate-600">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// -----------------------------
// Procedure
// -----------------------------

function Procedure() {
  return (
    <section id="procedure" className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="eyebrow">Section 02</p>

        <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-slate-900 sm:text-[2.3rem]">
          Standard operating procedure
        </h2>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-sm border border-slate-200 bg-slate-200 md:grid-cols-3">
          {PROCEDURE.map((step, index) => (
            <li key={step.title} className="bg-white p-7">
              <span className="font-code flex h-8 w-8 items-center justify-center rounded-sm bg-slate-900 text-xs font-medium text-white">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-5 text-[18px] text-slate-900">{step.title}</h3>

              <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// -----------------------------
// Cryptography
// -----------------------------

function Cryptography() {
  return (
    <section
      id="cryptography"
      className="surface-navy relative overflow-hidden py-20 text-white sm:py-24"
    >
      <div className="grid-overlay absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <p className="eyebrow text-slate-400">Section 03</p>

          <h2 className="mt-3 text-3xl leading-tight sm:text-[2.3rem]">
            Four layers, each with one duty
          </h2>

          <p className="mt-4 max-w-md leading-relaxed text-slate-300">
            Established, published cryptography protects the evidence itself.
            Access to the system is controlled separately, through authenticated
            officer accounts.
          </p>
        </div>

        <div className="overflow-hidden rounded-sm border border-white/15 bg-white/[0.03]">
          <div className="hidden grid-cols-[10rem_9rem_minmax(0,1fr)] gap-4 border-b border-white/15 px-6 py-3 sm:grid">
            <span className="eyebrow text-slate-400">Algorithm</span>
            <span className="eyebrow text-slate-400">Protects</span>
            <span className="eyebrow text-slate-400">Function</span>
          </div>

          <ul className="divide-y divide-white/10">
            {ALGORITHMS.map((layer) => (
              <li
                key={layer.name}
                className="grid gap-1.5 px-6 py-5 sm:grid-cols-[10rem_9rem_minmax(0,1fr)] sm:gap-4"
              >
                <span className="font-code text-sm text-blue-200">{layer.name}</span>

                <span className="text-sm font-semibold text-white">{layer.protects}</span>

                <span className="text-sm leading-relaxed text-slate-300">{layer.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// -----------------------------
// Scope
// -----------------------------

function Scope() {
  return (
    <section id="scope" className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <p className="eyebrow">Section 04</p>

          <h2 className="mt-3 text-3xl leading-tight text-slate-900 sm:text-[2.3rem]">
            Where this system sits
          </h2>
        </div>

        <div className="max-w-2xl space-y-5 text-[15px] leading-relaxed text-slate-600">
          <p>
            Forensic suites such as Autopsy, FTK and EnCase acquire, carve and
            analyse. They answer the question{" "}
            <em className="text-slate-900">what is on the device</em>.
          </p>

          <p>
            This system begins after that, and answers a different question:{" "}
            <em className="text-slate-900">
              can anyone prove this exhibit is the same one that was collected,
              and that nobody unauthorised has touched it since
            </em>
            . It is a custody and integrity layer, not an investigation tool, and
            it is designed to sit alongside existing forensic practice rather
            than replace it.
          </p>

          <p className="border-l-2 border-slate-300 pl-5 text-slate-700">
            A failed check is never hidden. A mismatch between the stored
            fingerprint and the file is recorded against the exhibit and surfaced
            in the custody log, because a failed verification is itself a finding
            of evidential value.
          </p>
        </div>
      </div>
    </section>
  );
}

// -----------------------------
// Call to action
// -----------------------------

function CallToAction() {
  const { user, loading } = useAuth();
  const loggedIn = !loading && user;

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 border-l-[3px] border-red-600 bg-slate-900 px-8 py-10 text-white sm:px-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-[1.6rem] leading-tight sm:text-3xl">
              {loggedIn
                ? "Your dashboard is ready"
                : "Bring your evidence under custody control"}
            </h2>

            <p className="mt-3 leading-relaxed text-slate-300">
              {loggedIn
                ? "Register new evidence, verify existing exhibits and review the chain of custody."
                : "Register an officer account to submit your first exhibit and open its chain of custody."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {loggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-sm bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-sm bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Request access
                </Link>

                <Link to="/login" className={secondaryButtonDark}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------
// Footer
// -----------------------------

function Footer() {
  return (
    <footer className="border-t-[3px] border-red-600 bg-slate-900 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Logo theme="light" />

          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Custody and integrity registry for seized digital evidence:
            encryption, post-quantum signatures and a tamper-evident chain of
            custody.
          </p>
        </div>

        <div>
          <p className="eyebrow text-slate-400">Reference</p>

          <ul className="mt-4 space-y-3 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-slate-400">Access</p>

          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link to="/login" className="transition hover:text-white">
                Sign in
              </Link>
            </li>

            <li>
              <Link to="/signup" className="transition hover:text-white">
                Request access
              </Link>
            </li>

            <li>
              <Link to="/forgot-password" className="transition hover:text-white">
                Reset password
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs sm:px-8">
          <p>© {new Date().getFullYear()} Digital Evidence System</p>
          <p className="font-code">Authorised use only · all activity is logged</p>
        </div>
      </div>
    </footer>
  );
}

// -----------------------------
// Page
// -----------------------------

export default function Landing() {
  return (
    <div className="font-brand min-h-screen bg-white text-slate-900 antialiased">
      <Header />

      <main>
        <Hero />
        <Guarantees />
        <Procedure />
        <Cryptography />
        <Scope />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
