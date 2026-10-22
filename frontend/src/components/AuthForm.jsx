import { useState } from "react";
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "./icons";

// Label + input, wired together for screen readers.
export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  hint,
  invalid = false,
  autoFocus = false,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={invalid}
        className="form-input"
      />

      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Password input with a show / hide button.
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  hint,
  invalid = false,
  labelAction = null,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
          {label}
        </label>

        {labelAction}
      </div>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={invalid}
          className="form-input pr-12"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-slate-400 transition hover:text-slate-700"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Error / success / info message box.
export function Alert({ type = "error", children }) {
  const styles = {
    error: "border-red-200 border-l-[3px] border-l-red-600 bg-red-50 text-red-800",
    success:
      "border-emerald-200 border-l-[3px] border-l-emerald-600 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 border-l-[3px] border-l-blue-600 bg-blue-50 text-blue-800",
    warning: "border-amber-200 border-l-[3px] border-l-amber-600 bg-amber-50 text-amber-900",
  };

  const Icon = type === "success" ? CheckIcon : AlertIcon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-sm border p-4 text-sm ${styles[type]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// Full-width primary button with a loading state.
export function SubmitButton({ loading, disabled, children, loadingText }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-sm bg-blue-600 px-5 py-2.5 text-sm font-semibold tracking-wide text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {loading && <SpinnerIcon className="h-4 w-4" />}
      {loading ? loadingText : children}
    </button>
  );
}
