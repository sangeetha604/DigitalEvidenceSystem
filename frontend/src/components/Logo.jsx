import { Link } from "react-router-dom";

/**
 * Institutional wordmark: a square crest with the section mark,
 * followed by the system name in the record-office serif.
 * Use theme="light" on the dark ink surfaces.
 */
export default function Logo({ theme = "dark", className = "", subtitle = true }) {
  const light = theme === "light";

  return (
    <Link
      to="/"
      className={`font-brand inline-flex items-center gap-3 ${className}`}
      aria-label="Digital Evidence System home"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border text-[17px] font-record leading-none ${
          light
            ? "border-slate-400/60 bg-white/5 text-white"
            : "border-slate-900 bg-slate-900 text-white"
        }`}
        aria-hidden="true"
      >
        §
      </span>

      <span className="min-w-0">
        <span
          className={`block font-record text-[15px] font-semibold leading-tight tracking-tight ${
            light ? "text-white" : "text-slate-900"
          }`}
        >
          Digital Evidence System
        </span>

        {subtitle && (
          <span
            className={`block text-[11px] leading-tight ${
              light ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Custody &amp; Integrity Registry
          </span>
        )}
      </span>
    </Link>
  );
}
