import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/auth-context";

const API = "http://127.0.0.1:5000";

// Number of most-recent chain-of-custody records shown before "Show more".
const RECENT_RECORDS_LIMIT = 3;

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);

  const [caseId, setCaseId] = useState("CASE-001");
  const [evidenceType, setEvidenceType] = useState("Document");
  const [description, setDescription] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [collectionLocation, setCollectionLocation] = useState("");

  const [auditRecords, setAuditRecords] = useState([]);

  // Chain of custody: collapsed by default, newest records first.
  const [showAllRecords, setShowAllRecords] = useState(false);
  const custodyRef = useRef(null);

  const [uploadStatus, setUploadStatus] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [fileHash, setFileHash] = useState("");

  const [verificationStatus, setVerificationStatus] =
    useState("");

  const [verificationType, setVerificationType] =
    useState("");

  const [metadata, setMetadata] = useState(null);

  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Dashboard Statistics
  // -----------------------------

  const [stats, setStats] = useState({
    total_evidence: 0,
    verified: 0,
    tampered: 0,
    total_cases: 0,
    recent_activity: null,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  // -----------------------------
  // Load Dashboard Statistics
  // -----------------------------

  async function fetchDashboardStats() {
    try {
      setStatsLoading(true);

      const response = await fetch(
        `${API}/dashboard-stats`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setStats(data);

    } catch (error) {
      console.error(
        "Failed to load dashboard statistics:",
        error
      );

    } finally {
      setStatsLoading(false);
    }
  }

  // -----------------------------
  // Load Audit Records
  // -----------------------------

  async function fetchAuditRecords() {
    try {
      const response = await fetch(
        `${API}/audit-log`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setAuditRecords(data);

    } catch (error) {
      console.error(
        "Failed to load audit records:",
        error
      );
    }
  }

  // -----------------------------
  // Load Data On Page Open
  // -----------------------------

  useEffect(() => {
    fetchDashboardStats();
    fetchAuditRecords();
  }, []);

  // -----------------------------
  // Select File
  // -----------------------------

  function selectFile(file) {
    setSelectedFile(file);

    setUploadStatus("");
    setEvidenceId("");
    setFileHash("");

    setVerificationStatus("");
    setVerificationType("");

    setMetadata(null);
  }

  // -----------------------------
  // Upload Evidence
  // -----------------------------

  async function uploadEvidence() {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    setLoading(true);

    setUploadStatus("");
    setVerificationStatus("");
    setVerificationType("");

    const formData = new FormData();

    formData.append(
      "file",
      selectedFile
    );

    formData.append(
      "case_id",
      caseId
    );

    formData.append(
      "evidence_type",
      evidenceType
    );

    formData.append(
      "description",
      description
    );

    formData.append(
      "collected_by",
      collectedBy
    );

    formData.append(
      "collection_location",
      collectionLocation
    );

    try {
      const response = await fetch(
        `${API}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setUploadStatus(
          data.message ||
          "Upload failed."
        );

        return;
      }

      setEvidenceId(
        data.evidence_id || ""
      );

      setFileHash(
        data.sha256 || ""
      );

      setMetadata({
        evidence_id:
          data.evidence_id,

        filename:
          data.filename,

        case_id:
          data.case_id,

        evidence_type:
          data.evidence_type,

        description:
          data.description,

        collected_by:
          data.collected_by,

        collection_location:
          data.collection_location,
      });

      setUploadStatus(
        data.message ||
        "Evidence uploaded successfully."
      );

      await fetchAuditRecords();
      await fetchDashboardStats();

    } catch (error) {
      console.error(error);

      setUploadStatus(
        "Backend connection failed."
      );

    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Verify Evidence
  // -----------------------------

  async function verifyEvidence() {
    if (!selectedFile) {
      alert(
        "Please select the evidence file first."
      );

      return;
    }

    setLoading(true);

    setVerificationStatus("");
    setVerificationType("");

    try {
      const formData = new FormData();

      formData.append(
        "filename",
        selectedFile.name
      );

      const response = await fetch(
        `${API}/verify`,
        {
          method: "POST",
          body: formData,
        }
      );

      const text =
        await response.text();

      if (
        text.includes(
          "EVIDENCE TAMPERED"
        )
      ) {
        setVerificationStatus(text);

        setVerificationType(
          "tampered"
        );

      } else if (
        text.includes(
          "Signature VALID"
        )
      ) {
        setVerificationStatus(text);

        setVerificationType(
          "success"
        );

      } else if (
        text.includes(
          "Signature INVALID"
        )
      ) {
        setVerificationStatus(text);

        setVerificationType(
          "failed"
        );

      } else {
        setVerificationStatus(text);

        setVerificationType(
          response.ok
            ? "success"
            : "failed"
        );
      }

      await fetchAuditRecords();
      await fetchDashboardStats();

    } catch (error) {
      console.error(error);

      setVerificationStatus(
        "Backend connection failed."
      );

      setVerificationType(
        "failed"
      );

    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Verify Audit Log
  // -----------------------------

  async function verifyAuditLog() {
    try {
      const response = await fetch(
        `${API}/verify-audit`
      );

      const text =
        await response.text();

      alert(text);

      await fetchAuditRecords();
      await fetchDashboardStats();

    } catch (error) {
      alert(
        "Backend connection failed."
      );
    }
  }

  // -----------------------------
  // Action Helpers
  // -----------------------------

  function getActionLabel(action) {
    switch (action) {
      case "UPLOAD":
        return "Evidence Collected";

      case "VERIFY_SUCCESS":
        return "Evidence Verified";

      case "VERIFY_FAILED":
        return "Verification Failed";

      case "TAMPER_DETECTED":
        return "Tamper Detected";

      default:
        return action ||
          "Unknown Action";
    }
  }

  function getActionDescription(action) {
    switch (action) {
      case "UPLOAD":
        return "Evidence was uploaded and securely registered.";

      case "VERIFY_SUCCESS":
        return "SHA-256 integrity check and ML-DSA signature verification succeeded.";

      case "VERIFY_FAILED":
        return "Digital signature verification failed.";

      case "TAMPER_DETECTED":
        return "The current SHA-256 hash does not match the original evidence hash.";

      default:
        return "Evidence activity recorded.";
    }
  }

  function getActionIcon(action) {
    switch (action) {
      case "UPLOAD":
        return "REG";

      case "VERIFY_SUCCESS":
        return "OK";

      case "VERIFY_FAILED":
        return "FAIL";

      case "TAMPER_DETECTED":
        return "ALT";

      default:
        return "LOG";
    }
  }

  function getActionStyle(action) {
    switch (action) {
      case "UPLOAD":
        return {
          circle:
            "bg-blue-100 text-blue-700",

          badge:
            "bg-blue-100 text-blue-700",

          border:
            "border-blue-200",
        };

      case "VERIFY_SUCCESS":
        return {
          circle:
            "bg-emerald-100 text-emerald-700",

          badge:
            "bg-emerald-100 text-emerald-700",

          border:
            "border-emerald-200",
        };

      case "VERIFY_FAILED":
        return {
          circle:
            "bg-yellow-100 text-yellow-700",

          badge:
            "bg-yellow-100 text-yellow-700",

          border:
            "border-yellow-200",
        };

      case "TAMPER_DETECTED":
        return {
          circle:
            "bg-red-100 text-red-700",

          badge:
            "bg-red-100 text-red-700",

          border:
            "border-red-200",
        };

      default:
        return {
          circle:
            "bg-slate-100 text-slate-700",

          badge:
            "bg-slate-100 text-slate-700",

          border:
            "border-slate-200",
        };
    }
  }

  // -----------------------------
  // Chain of Custody (newest first, show more / less)
  // -----------------------------

  // The backend returns the audit log oldest-first, so reverse it
  // to put the most recent activity at the top.
  const recordsNewestFirst = [...auditRecords].reverse();

  const visibleRecords = showAllRecords
    ? recordsNewestFirst
    : recordsNewestFirst.slice(0, RECENT_RECORDS_LIMIT);

  const hiddenCount =
    recordsNewestFirst.length - visibleRecords.length;

  function toggleRecords() {
    if (showAllRecords) {
      // Bring the section back into view when collapsing a long list.
      custodyRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setShowAllRecords((current) => !current);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="font-brand min-h-screen bg-slate-100 text-slate-900 antialiased">

      {/* HEADER */}

      <header className="border-b-[3px] border-red-600 bg-slate-900">

        <div className="mx-auto max-w-7xl px-6 py-4">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div className="flex items-center gap-3">

              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-400/50 bg-white/5 font-serif text-lg text-white"
                aria-hidden="true"
              >
                §
              </span>

              <div>

                <h1 className="text-[19px] leading-tight text-white">
                  Digital Evidence System
                </h1>

                <p className="mt-0.5 text-[12px] text-slate-400">
                  Custody &amp; Integrity Registry · authorised access only
                </p>

              </div>

            </div>

            <div className="flex flex-wrap items-center gap-4">

              <span className="chip chip-ok">system operational</span>

              <div className="hidden text-right sm:block">

                <p className="text-sm font-semibold text-white">
                  {user?.displayName || "Signed in"}
                </p>

                <p className="text-xs text-slate-400">
                  {user?.email}
                </p>

              </div>

              <button
                onClick={handleLogout}
                className="rounded-sm border border-slate-400/50 px-4 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Sign out
              </button>

            </div>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">

        {/* TITLE */}

        <section>

          <p className="eyebrow">
            Forensic evidence management
          </p>

          <h2 className="mt-3 text-[2rem] leading-tight">
            Evidence Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-slate-600">
            Register, protect and verify digital evidence, and review its chain
            of custody.
          </p>

        </section>


        {/* DASHBOARD SUMMARY */}

        <section>

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h3 className="text-xl font-semibold">
                Evidence Overview
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Live statistics from the evidence database.
              </p>

            </div>

            <button
              onClick={() => {
                fetchDashboardStats();
                fetchAuditRecords();
              }}
              className="rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Refresh
            </button>

          </div>


          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Total Evidence"
              value={
                statsLoading
                  ? "..."
                  : stats.total_evidence
              }
              icon="EVD"
              description="Stored evidence items"
            />

            <StatCard
              title="Verified"
              value={
                statsLoading
                  ? "..."
                  : stats.verified
              }
              icon="OK"
              description="Successful verification events"
            />

            <StatCard
              title="Tampered"
              value={
                statsLoading
                  ? "..."
                  : stats.tampered
              }
              icon="ALT"
              description="Tamper detection events"
            />

            <StatCard
              title="Cases"
              value={
                statsLoading
                  ? "..."
                  : stats.total_cases
              }
              icon="CSE"
              description="Registered case IDs"
            />

          </div>

        </section>


        {/* SECURITY STATUS */}

        <section>

          <h3 className="mb-4 text-xl font-semibold">
            Security Status
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <SecurityCard
              title="AES-256-GCM"
              description="Evidence Encryption"
            />

            <SecurityCard
              title="SHA-256"
              description="Integrity Verification"
            />

            <SecurityCard
              title="ML-DSA"
              description="Digital Signature"
            />

            <SecurityCard
              title="HMAC-SHA-256"
              description="Audit Protection"
            />

          </div>

        </section>


        {/* CASE INFORMATION */}

        <section className="rounded-sm border border-slate-300 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h3 className="text-xl font-semibold">
              Case Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Enter the details associated with this digital evidence.
            </p>

          </div>


          <div className="grid gap-5 md:grid-cols-2">

            <FormField label="Case ID">

              <input
                type="text"
                value={caseId}
                onChange={(e) =>
                  setCaseId(
                    e.target.value
                  )
                }
                placeholder="CASE-001"
                className="form-input"
              />

            </FormField>


            <FormField label="Evidence Type">

              <select
                value={evidenceType}
                onChange={(e) =>
                  setEvidenceType(
                    e.target.value
                  )
                }
                className="form-input"
              >

                <option>
                  Document
                </option>

                <option>
                  Image
                </option>

                <option>
                  Video
                </option>

                <option>
                  Audio
                </option>

                <option>
                  Text File
                </option>

                <option>
                  Log File
                </option>

                <option>
                  Other
                </option>

              </select>

            </FormField>


            <FormField
              label="Description"
              fullWidth
            >

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Enter a short description of the evidence..."
                rows="3"
                className="form-input"
              />

            </FormField>


            <FormField label="Collected By">

              <input
                type="text"
                value={collectedBy}
                onChange={(e) =>
                  setCollectedBy(
                    e.target.value
                  )
                }
                placeholder="Investigator name"
                className="form-input"
              />

            </FormField>


            <FormField label="Collection Location">

              <input
                type="text"
                value={collectionLocation}
                onChange={(e) =>
                  setCollectionLocation(
                    e.target.value
                  )
                }
                placeholder="Location where evidence was collected"
                className="form-input"
              />

            </FormField>

          </div>

        </section>


        {/* UPLOAD + VERIFY */}

        <section className="grid gap-6 lg:grid-cols-2">

          {/* UPLOAD */}

          <div className="rounded-sm border border-slate-300 bg-white p-6 shadow-sm">

            <h3 className="text-xl font-semibold">
              Upload Evidence
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Upload a digital evidence file to encrypt, hash and digitally sign it.
            </p>


            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50">

              <span className="font-code rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-[11px] uppercase tracking-wider text-slate-500">
                evidence file
              </span>

              <span className="mt-3 font-medium text-slate-700">

                {selectedFile
                  ? selectedFile.name
                  : "Choose evidence file"}

              </span>

              <span className="mt-1 text-xs text-slate-500">
                Select a file from your computer
              </span>

              <input
                type="file"
                className="hidden"
                onChange={(e) => {

                  if (
                    e.target.files?.[0]
                  ) {

                    selectFile(
                      e.target.files[0]
                    );

                  }

                }}
              />

            </label>


            <button
              onClick={uploadEvidence}
              disabled={loading}
              className="mt-5 w-full rounded-sm bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading
                ? "Processing..."
                : "Upload Evidence"}

            </button>


            {uploadStatus && (

              <div className="mt-4 rounded-sm border border-emerald-200 border-l-[3px] border-l-emerald-600 bg-emerald-50 p-4 text-sm text-emerald-700">

                {uploadStatus}

              </div>

            )}

          </div>


          {/* VERIFY */}

          <div className="rounded-sm border border-slate-300 bg-white p-6 shadow-sm">

            <h3 className="text-xl font-semibold">
              Verify Evidence
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Check whether the evidence has been modified after upload.
            </p>


            <div className="mt-6 rounded-sm border border-slate-200 bg-slate-50 p-5">

              <p className="text-sm text-slate-500">
                Selected Evidence
              </p>

              <p className="mt-2 break-all font-medium text-slate-800">

                {selectedFile?.name ||
                  "No file selected"}

              </p>

            </div>


            <button
              onClick={verifyEvidence}
              disabled={
                loading ||
                !selectedFile
              }
              className="mt-5 w-full rounded-sm bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading
                ? "Verifying..."
                : "Verify Evidence"}

            </button>

          </div>

        </section>


        {/* EVIDENCE DETAILS */}

        {(metadata || evidenceId) && (

          <section className="rounded-sm border border-slate-300 bg-white p-6 shadow-sm">

            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>

                <h3 className="text-xl font-semibold">
                  Evidence Details
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Registered information for the selected evidence.
                </p>

              </div>


              <span className="chip chip-ok w-fit">
                evidence registered
              </span>

            </div>


            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              <InfoBox
                title="Case ID"
                value={
                  metadata?.case_id ||
                  caseId
                }
              />

              <InfoBox
                title="File Name"
                value={
                  metadata?.filename ||
                  selectedFile?.name ||
                  "—"
                }
              />

              <InfoBox
                title="Evidence Type"
                value={
                  metadata?.evidence_type ||
                  evidenceType
                }
              />

              <InfoBox
                title="Collected By"
                value={
                  metadata?.collected_by ||
                  collectedBy ||
                  "—"
                }
              />

              <InfoBox
                title="Collection Location"
                value={
                  metadata?.collection_location ||
                  collectionLocation ||
                  "—"
                }
              />

              <InfoBox
                title="Evidence ID"
                value={
                  metadata?.evidence_id ||
                  evidenceId ||
                  "—"
                }
              />

            </div>


            <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </p>

              <p className="mt-2 text-sm text-slate-700">
                {metadata?.description ||
                  description ||
                  "No description provided."}
              </p>

            </div>


            <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                SHA-256 Integrity Hash
              </p>

              <p className="mt-2 break-all font-mono text-xs text-slate-700">

                {fileHash ||
                  "Hash generated after upload"}

              </p>

            </div>

          </section>

        )}


        {/* VERIFICATION RESULT */}

        {verificationStatus && (

          <section
            className={`rounded-sm border border-l-[3px] p-6 ${
              verificationType === "tampered"
                ? "border-red-200 border-l-red-600 bg-red-50"
                : verificationType === "success"
                ? "border-emerald-200 border-l-emerald-600 bg-emerald-50"
                : "border-yellow-200 border-l-yellow-600 bg-yellow-50"
            }`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`font-code mt-1 shrink-0 rounded-sm border px-2.5 py-1 text-[11px] uppercase tracking-wider ${
                  verificationType === "tampered"
                    ? "border-red-200 bg-white text-red-700"
                    : verificationType === "success"
                    ? "border-emerald-200 bg-white text-emerald-700"
                    : "border-amber-200 bg-white text-amber-700"
                }`}
              >

                {verificationType === "tampered"
                  ? "alert"
                  : verificationType === "success"
                  ? "pass"
                  : "fail"}

              </div>


              <div>

                <h3
                  className={`text-xl font-semibold ${
                    verificationType === "tampered"
                      ? "text-red-700"
                      : verificationType === "success"
                      ? "text-emerald-700"
                      : "text-yellow-700"
                  }`}
                >

                  {verificationType === "tampered"
                    ? "TAMPER DETECTED"
                    : verificationType === "success"
                    ? "EVIDENCE VERIFIED"
                    : "VERIFICATION FAILED"}

                </h3>


                <p className="mt-2 break-all text-sm text-slate-700">
                  {verificationStatus}
                </p>

              </div>

            </div>

          </section>

        )}


        {/* CHAIN OF CUSTODY */}

        <section
          ref={custodyRef}
          className="scroll-mt-6 rounded-sm border border-slate-300 bg-white p-6 shadow-sm"
        >

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <p className="eyebrow">
                Evidence History
              </p>

              <h3 className="mt-1 text-xl font-semibold">
                Chain of Custody
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Chronological record of evidence handling and verification.
              </p>

              {auditRecords.length > 0 && (

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Newest first — showing {visibleRecords.length} of {auditRecords.length} records
                </p>

              )}

            </div>


            <button
              onClick={fetchAuditRecords}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Refresh Records
            </button>

          </div>


          <div className="mt-8">

            {auditRecords.length === 0 ? (

              <div className="rounded-sm border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No chain-of-custody records loaded.
              </div>

            ) : (

              <div className="relative">

                <div className="absolute bottom-5 left-5 top-5 hidden w-px bg-slate-200 md:block" />


                <div className="space-y-8">

                  {visibleRecords.map(
                    (record, index) => {

                      const action =
                        record.action ||
                        "UNKNOWN";

                      const style =
                        getActionStyle(
                          action
                        );

                      return (

                        <div
                          key={record.hmac || index}
                          className="relative flex gap-5"
                        >

                          <div
                            className={`font-code relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-200 text-[10px] font-medium uppercase ${style.circle}`}
                          >

                            {getActionIcon(
                              action
                            )}

                          </div>


                          <div
                            className={`flex-1 rounded-sm border bg-white p-5 ${style.border}`}
                          >

                            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <span
                                    className={`font-code rounded-sm px-2 py-0.5 text-[11px] uppercase tracking-wide ${style.badge}`}
                                  >
                                    {getActionLabel(
                                      action
                                    )}
                                  </span>

                                  <span className="text-sm font-medium text-slate-700">
                                    {record.filename ||
                                      "Unknown file"}
                                  </span>

                                </div>


                                <p className="mt-3 text-sm text-slate-600">
                                  {getActionDescription(
                                    action
                                  )}
                                </p>

                              </div>


                              <div className="shrink-0 text-xs text-slate-500">
                                {formatTimestamp(
                                  record.timestamp
                                )}
                              </div>

                            </div>


                            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">

                              <SmallDetail
                                label="Handler"
                                value={
                                  record.handler ||
                                  "System"
                                }
                              />

                              <SmallDetail
                                label="Purpose"
                                value={
                                  record.purpose ||
                                  action
                                }
                              />

                              <SmallDetail
                                label="Evidence ID"
                                value={
                                  record.evidence_id ||
                                  "—"
                                }
                              />

                            </div>


                            {record.sha256 && (

                              <div className="mt-3 rounded-sm border border-slate-200 bg-slate-50 p-3">

                                <p className="text-xs font-semibold text-slate-500">
                                  SHA-256
                                </p>

                                <p className="mt-1 break-all font-mono text-xs text-slate-600">
                                  {record.sha256}
                                </p>

                              </div>

                            )}

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>

            )}

          </div>


          {auditRecords.length > RECENT_RECORDS_LIMIT && (

            <div className="mt-8 flex justify-center">

              <button
                onClick={toggleRecords}
                className="rounded-sm border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >

                {showAllRecords
                  ? "Show less"
                  : `Show more (${hiddenCount} older ${
                      hiddenCount === 1
                        ? "record"
                        : "records"
                    })`}

              </button>

            </div>

          )}

        </section>


        {/* AUDIT VERIFICATION */}

        <section className="rounded-sm border border-slate-300 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h3 className="text-xl font-semibold">
                Audit Verification
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Verify that the Chain of Custody audit records have not been modified.
              </p>

            </div>


            <button
              onClick={verifyAuditLog}
              className="rounded-sm bg-slate-800 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Verify Audit Log
            </button>

          </div>

        </section>


        {/* RECENT ACTIVITY */}

        {stats.recent_activity && (

          <section className="rounded-sm border border-slate-300 bg-white p-6 shadow-sm">

            <h3 className="text-xl font-semibold">
              Latest Activity
            </h3>

            <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 p-5">

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-800">

                    {getActionLabel(
                      stats.recent_activity.action
                    )}

                  </p>

                  <p className="mt-1 text-sm text-slate-500">

                    {stats.recent_activity.filename ||
                      "Unknown file"}

                  </p>

                </div>


                <p className="text-xs text-slate-500">

                  {formatTimestamp(
                    stats.recent_activity.timestamp
                  )}

                </p>

              </div>

            </div>

          </section>

        )}

      </main>


      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">

        Digital Evidence System • Secure Evidence Management

      </footer>

    </div>
  );
}


/* -----------------------------
   Statistics Card
----------------------------- */

function StatCard({
  title,
  value,
  icon,
  description
}) {

  return (

    <div className="rounded-sm border border-slate-300 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="font-record mt-2 text-[2rem] font-semibold leading-none text-slate-900">
            {value}
          </p>

        </div>


        <div className="font-code flex h-9 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 px-2 text-[11px] uppercase tracking-wider text-slate-500">
          {icon}
        </div>

      </div>


      <p className="mt-3 text-xs text-slate-500">
        {description}
      </p>

    </div>

  );
}


/* -----------------------------
   Form Field
----------------------------- */

function FormField({
  label,
  children,
  fullWidth = false
}) {

  return (

    <div
      className={
        fullWidth
          ? "md:col-span-2"
          : ""
      }
    >

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}

    </div>

  );
}


/* -----------------------------
   Security Card
----------------------------- */

function SecurityCard({
  title,
  description
}) {

  return (

    <div className="rounded-sm border border-slate-300 bg-white p-5 shadow-sm">

      <div className="mb-3 flex items-center justify-between">

        <span className="text-sm font-semibold text-slate-800">
          {title}
        </span>

        <span className="chip chip-ok">
          active
        </span>

      </div>


      <p className="text-sm text-slate-500">
        {description}
      </p>

    </div>

  );
}


/* -----------------------------
   Info Box
----------------------------- */

function InfoBox({
  title,
  value
}) {

  return (

    <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className="mt-2 break-all text-sm font-medium text-slate-800">
        {value}
      </p>

    </div>

  );
}


/* -----------------------------
   Timeline Detail
----------------------------- */

function SmallDetail({
  label,
  value
}) {

  return (

    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-all text-xs text-slate-600">
        {value}
      </p>

    </div>

  );
}


/* -----------------------------
   Timestamp
----------------------------- */

function formatTimestamp(timestamp) {

  if (!timestamp) {
    return "—";
  }

  try {

    return new Date(
      timestamp
    ).toLocaleString();

  } catch {

    return timestamp;

  }

}