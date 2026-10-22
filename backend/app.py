from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import hashlib
import hmac
import json
import sqlite3
from datetime import datetime
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pqcrypto.sign import ml_dsa_65

app = Flask(__name__)
CORS(app)

# -----------------------------
# Storage Paths
# -----------------------------

STORAGE_FOLDER = "../storage"
ENCRYPTED_FOLDER = "../storage/encrypted"
KEYS_FOLDER = "../storage/keys"
EVIDENCE_ID_FOLDER = "../storage/evidence_ids"
HASH_FOLDER = "../storage/hashes"
METADATA_FOLDER = "../storage/metadata"

HMAC_KEY_PATH = "../storage/hmac.key"
AUDIT_LOG_PATH = "../storage/audit_log.json"
DATABASE_PATH = "../storage/evidence.db"


def get_db_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


os.makedirs(STORAGE_FOLDER, exist_ok=True)
os.makedirs(ENCRYPTED_FOLDER, exist_ok=True)
os.makedirs(KEYS_FOLDER, exist_ok=True)
os.makedirs(EVIDENCE_ID_FOLDER, exist_ok=True)
os.makedirs(HASH_FOLDER, exist_ok=True)
os.makedirs(METADATA_FOLDER, exist_ok=True)


# -----------------------------
# HMAC
# -----------------------------

def create_hmac(data):

    with open(HMAC_KEY_PATH, "rb") as f:
        key = f.read()

    return hmac.new(
        key,
        data.encode(),
        hashlib.sha256
    ).hexdigest()


# -----------------------------
# Create Evidence ID
# -----------------------------

def create_evidence_id(filename):

    unique_data = filename + datetime.now().isoformat()

    return hashlib.sha256(
        unique_data.encode()
    ).hexdigest()[:12]


# -----------------------------
# Save Evidence Metadata
# -----------------------------

def save_metadata(
    filename,
    evidence_id,
    case_id,
    evidence_type,
    description,
    collected_by,
    collection_location,
    file_hash
):

    created_at = datetime.now().isoformat()

    metadata = {
        "evidence_id": evidence_id,
        "filename": filename,
        "case_id": case_id,
        "evidence_type": evidence_type,
        "description": description,
        "collected_by": collected_by,
        "collection_location": collection_location,
        "sha256": file_hash,
        "created_at": created_at
    }

    metadata_path = os.path.join(
        METADATA_FOLDER,
        filename + ".json"
    )

    with open(
        metadata_path,
        "w"
    ) as f:

        json.dump(
            metadata,
            f,
            indent=4
        )

    # -----------------------------
    # Save Evidence Metadata to SQLite
    # -----------------------------

    connection = get_db_connection()

    connection.execute(
        """
        INSERT INTO evidence (
            evidence_id,
            filename,
            case_id,
            evidence_type,
            description,
            collected_by,
            collection_location,
            sha256,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            evidence_id,
            filename,
            case_id,
            evidence_type,
            description,
            collected_by,
            collection_location,
            file_hash,
            created_at
        )
    )

    connection.commit()
    connection.close()

    return metadata


# -----------------------------
# Get Evidence Metadata
# -----------------------------

def get_metadata(filename):

    metadata_path = os.path.join(
        METADATA_FOLDER,
        filename + ".json"
    )

    if not os.path.exists(metadata_path):
        return None

    with open(
        metadata_path,
        "r"
    ) as f:

        return json.load(f)


# -----------------------------
# Add Audit Record
# -----------------------------

def add_audit_record(
    filename,
    action,
    file_hash,
    handler="System",
    evidence_id=None
):

    if os.path.exists(AUDIT_LOG_PATH):

        with open(
            AUDIT_LOG_PATH,
            "r"
        ) as f:

            logs = json.load(f)

    else:

        logs = []

    if evidence_id is None:

        evidence_id = create_evidence_id(
            filename
        )

    previous_hmac = (
        logs[-1]["hmac"]
        if logs
        else ""
    )

    record = {
        "evidence_id": evidence_id,
        "filename": filename,
        "action": action,
        "handler": handler,
        "purpose": action,
        "timestamp": datetime.now().isoformat(),
        "sha256": file_hash,
        "previous_hmac": previous_hmac
    }

    record_data = json.dumps(
        record,
        sort_keys=True
    )

    record["hmac"] = create_hmac(
        record_data
    )

    logs.append(record)

    with open(
        AUDIT_LOG_PATH,
        "w"
    ) as f:

        json.dump(
            logs,
            f,
            indent=4
        )

    # -----------------------------
    # Save Audit Record to SQLite
    # -----------------------------

    connection = get_db_connection()

    connection.execute(
        """
        INSERT INTO audit_records (
            evidence_id,
            filename,
            action,
            handler,
            purpose,
            timestamp,
            sha256,
            previous_hmac,
            hmac
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record["evidence_id"],
            record["filename"],
            record["action"],
            record["handler"],
            record["purpose"],
            record["timestamp"],
            record["sha256"],
            record["previous_hmac"],
            record["hmac"]
        )
    )

    connection.commit()
    connection.close()

    return evidence_id


# -----------------------------
# Verify Audit Log
# -----------------------------

def verify_audit_log():

    if not os.path.exists(
        AUDIT_LOG_PATH
    ):
        return False

    with open(
        AUDIT_LOG_PATH,
        "r"
    ) as f:

        logs = json.load(f)

    previous_hmac = ""

    for record in logs:

        stored_hmac = record["hmac"]

        record_without_hmac = record.copy()

        del record_without_hmac["hmac"]

        record_data = json.dumps(
            record_without_hmac,
            sort_keys=True
        )

        expected_hmac = create_hmac(
            record_data
        )

        if not hmac.compare_digest(
            stored_hmac,
            expected_hmac
        ):

            return False

        if record["previous_hmac"] != previous_hmac:

            return False

        previous_hmac = stored_hmac

    return True


# -----------------------------
# Home
# -----------------------------

@app.route("/")
def home():

    return (
        "Digital Evidence System Backend "
        "is Running!"
    )


# -----------------------------
# Upload Evidence
# -----------------------------

@app.route(
    "/upload",
    methods=["POST"]
)
def upload():

    # -----------------------------
    # Check File
    # -----------------------------

    if "file" not in request.files:

        return "No file uploaded", 400

    file = request.files["file"]

    if file.filename == "":

        return "No file selected", 400

    filename = secure_filename(
        file.filename
    )

    if not filename:

        return "Invalid filename", 400


    # -----------------------------
    # Case Metadata
    # -----------------------------

    case_id = request.form.get(
        "case_id",
        "CASE-001"
    ).strip()

    evidence_type = request.form.get(
        "evidence_type",
        "Digital File"
    ).strip()

    description = request.form.get(
        "description",
        "Digital evidence"
    ).strip()

    collected_by = request.form.get(
        "collected_by",
        "System"
    ).strip()

    collection_location = request.form.get(
        "collection_location",
        "Not specified"
    ).strip()


    # -----------------------------
    # Save Original File
    # -----------------------------

    file_path = os.path.join(
        STORAGE_FOLDER,
        filename
    )

    file.save(file_path)

    with open(
        file_path,
        "rb"
    ) as f:

        file_data = f.read()


    # -----------------------------
    # Create HMAC Key If Needed
    # -----------------------------

    if not os.path.exists(
        HMAC_KEY_PATH
    ):

        with open(
            HMAC_KEY_PATH,
            "wb"
        ) as f:

            f.write(
                os.urandom(32)
            )


    # -----------------------------
    # SHA-256
    # -----------------------------

    file_hash = hashlib.sha256(
        file_data
    ).hexdigest()


    # -----------------------------
    # ML-DSA Signature
    # -----------------------------

    public_key, private_key = (
        ml_dsa_65.keygen()
    )

    signature = ml_dsa_65.sign(
        private_key,
        file_hash.encode()
    )


    # Create filename-safe base

    safe_base = os.path.splitext(
        filename
    )[0]


    private_key_path = os.path.join(
        KEYS_FOLDER,
        safe_base +
        "_private_key.bin"
    )

    public_key_path = os.path.join(
        KEYS_FOLDER,
        safe_base +
        "_public_key.bin"
    )

    signature_path = os.path.join(
        KEYS_FOLDER,
        filename + ".sig"
    )


    # -----------------------------
    # Save Private Key
    # -----------------------------

    with open(
        private_key_path,
        "wb"
    ) as f:

        f.write(private_key)


    # -----------------------------
    # Save Public Key
    # -----------------------------

    with open(
        public_key_path,
        "wb"
    ) as f:

        f.write(public_key)


    # -----------------------------
    # Save Signature
    # -----------------------------

    with open(
        signature_path,
        "wb"
    ) as f:

        f.write(signature)


    # -----------------------------
    # AES-256-GCM
    # -----------------------------

    key = AESGCM.generate_key(
        bit_length=256
    )

    key_path = os.path.join(
        ENCRYPTED_FOLDER,
        filename + ".key"
    )

    with open(
        key_path,
        "wb"
    ) as f:

        f.write(key)


    aesgcm = AESGCM(key)

    nonce = os.urandom(12)

    encrypted_data = aesgcm.encrypt(
        nonce,
        file_data,
        None
    )


    encrypted_path = os.path.join(
        ENCRYPTED_FOLDER,
        filename + ".enc"
    )

    with open(
        encrypted_path,
        "wb"
    ) as f:

        f.write(
            nonce + encrypted_data
        )


    # -----------------------------
    # Evidence ID
    # -----------------------------

    evidence_id = create_evidence_id(
        filename
    )

    evidence_id_path = os.path.join(
        EVIDENCE_ID_FOLDER,
        filename + ".id"
    )

    with open(
        evidence_id_path,
        "w"
    ) as f:

        f.write(evidence_id)


    # -----------------------------
    # Store Original Hash
    # -----------------------------

    hash_path = os.path.join(
        HASH_FOLDER,
        filename + ".sha256"
    )

    with open(
        hash_path,
        "w"
    ) as f:

        f.write(file_hash)


    # -----------------------------
    # Save Metadata
    # -----------------------------

    save_metadata(
        filename,
        evidence_id,
        case_id,
        evidence_type,
        description,
        collected_by,
        collection_location,
        file_hash
    )


    # -----------------------------
    # Audit Record
    # -----------------------------

    add_audit_record(
        filename,
        "UPLOAD",
        file_hash,
        "System",
        evidence_id
    )


    # -----------------------------
    # Response
    # -----------------------------

    return jsonify({

        "message":
            f"File {filename} uploaded successfully!",

        "filename":
            filename,

        "sha256":
            file_hash,

        "evidence_id":
            evidence_id,

        "case_id":
            case_id,

        "evidence_type":
            evidence_type,

        "description":
            description,

        "collected_by":
            collected_by,

        "collection_location":
            collection_location

    })


# -----------------------------
# Verify Evidence
# -----------------------------

@app.route(
    "/verify",
    methods=["POST"]
)
def verify():

    filename = request.form.get(
        "filename"
    )

    if not filename:

        return "Filename required", 400

    filename = secure_filename(
        filename
    )


    file_path = os.path.join(
        STORAGE_FOLDER,
        filename
    )

    signature_path = os.path.join(
        KEYS_FOLDER,
        filename + ".sig"
    )

    evidence_id_path = os.path.join(
        EVIDENCE_ID_FOLDER,
        filename + ".id"
    )

    hash_path = os.path.join(
        HASH_FOLDER,
        filename + ".sha256"
    )


    # Find matching public key

    safe_base = os.path.splitext(
        filename
    )[0]

    public_key_path = os.path.join(
        KEYS_FOLDER,
        safe_base +
        "_public_key.bin"
    )


    # -----------------------------
    # Check Required Files
    # -----------------------------

    if not os.path.exists(
        file_path
    ):

        return "Evidence file not found", 404

    if not os.path.exists(
        signature_path
    ):

        return "Signature not found", 404

    if not os.path.exists(
        public_key_path
    ):

        return "Public key not found", 404

    if not os.path.exists(
        evidence_id_path
    ):

        return "Evidence ID not found", 404

    if not os.path.exists(
        hash_path
    ):

        return "Original hash not found", 404


    # -----------------------------
    # Read Current Evidence
    # -----------------------------

    with open(
        file_path,
        "rb"
    ) as f:

        file_data = f.read()

    current_hash = hashlib.sha256(
        file_data
    ).hexdigest()


    # -----------------------------
    # Read Original Hash
    # -----------------------------

    with open(
        hash_path,
        "r"
    ) as f:

        original_hash = f.read().strip()


    # -----------------------------
    # Read Evidence ID
    # -----------------------------

    with open(
        evidence_id_path,
        "r"
    ) as f:

        evidence_id = f.read().strip()


    # -----------------------------
    # Detect Tampering
    # -----------------------------

    if not hmac.compare_digest(
        current_hash,
        original_hash
    ):

        add_audit_record(
            filename,
            "TAMPER_DETECTED",
            current_hash,
            "System",
            evidence_id
        )

        return (
            f"EVIDENCE TAMPERED! "
            f"SHA-256 mismatch for {filename}. "
            f"Evidence ID: {evidence_id}"
        ), 400


    # -----------------------------
    # Read Signature
    # -----------------------------

    with open(
        signature_path,
        "rb"
    ) as f:

        signature = f.read()


    # -----------------------------
    # Read Public Key
    # -----------------------------

    with open(
        public_key_path,
        "rb"
    ) as f:

        public_key = f.read()


    # -----------------------------
    # Verify ML-DSA
    # -----------------------------

    try:

        ml_dsa_65.verify(
            public_key,
            current_hash.encode(),
            signature
        )

        add_audit_record(
            filename,
            "VERIFY_SUCCESS",
            current_hash,
            "System",
            evidence_id
        )

        return (
            f"Signature VALID for {filename}! "
            f"Evidence ID: {evidence_id}"
        )


    except Exception:

        add_audit_record(
            filename,
            "VERIFY_FAILED",
            current_hash,
            "System",
            evidence_id
        )

        return (
            f"Signature INVALID for {filename}. "
            f"Evidence ID: {evidence_id}"
        ), 400


# -----------------------------
# Get All Audit Records
# -----------------------------

@app.route(
    "/audit-log",
    methods=["GET"]
)
def audit_log():

    if not os.path.exists(
        AUDIT_LOG_PATH
    ):

        return []

    with open(
        AUDIT_LOG_PATH,
        "r"
    ) as f:

        logs = json.load(f)

    return logs


# -----------------------------
# Get Evidence History
# -----------------------------

@app.route(
    "/audit-log/<evidence_id>",
    methods=["GET"]
)
def evidence_audit_log(
    evidence_id
):

    if not os.path.exists(
        AUDIT_LOG_PATH
    ):

        return []

    with open(
        AUDIT_LOG_PATH,
        "r"
    ) as f:

        logs = json.load(f)

    evidence_records = [
        record
        for record in logs
        if record.get(
            "evidence_id"
        ) == evidence_id
    ]

    return evidence_records


# -----------------------------
# Get Evidence Metadata
# -----------------------------

@app.route(
    "/metadata/<filename>",
    methods=["GET"]
)
def evidence_metadata(filename):

    filename = secure_filename(
        filename
    )

    metadata = get_metadata(
        filename
    )

    if metadata is None:

        return (
            "Metadata not found",
            404
        )

    return jsonify(metadata)


# -----------------------------
# Verify Audit
# -----------------------------

@app.route(
    "/verify-audit",
    methods=["GET"]
)
def verify_audit():

    if verify_audit_log():

        return "Audit Log VALID"

    else:

        return (
            "Audit Log INVALID",
            400
        )


# -----------------------------
# Dashboard Statistics
# -----------------------------

@app.route(
    "/dashboard-stats",
    methods=["GET"]
)
def dashboard_stats():

    try:

        # -----------------------------
        # Count Evidence
        # -----------------------------

        total_evidence = 0
        case_ids = set()

        if os.path.exists(METADATA_FOLDER):

            for filename in os.listdir(
                METADATA_FOLDER
            ):

                if filename.endswith(".json"):

                    metadata_path = os.path.join(
                        METADATA_FOLDER,
                        filename
                    )

                    try:

                        with open(
                            metadata_path,
                            "r"
                        ) as f:

                            metadata = json.load(f)

                        total_evidence += 1

                        case_id = metadata.get(
                            "case_id"
                        )

                        if case_id:
                            case_ids.add(case_id)

                    except Exception:

                        continue


        # -----------------------------
        # Read Audit Records
        # -----------------------------

        audit_records = []

        if os.path.exists(
            AUDIT_LOG_PATH
        ):

            try:

                with open(
                    AUDIT_LOG_PATH,
                    "r"
                ) as f:

                    audit_records = json.load(f)

            except Exception:

                audit_records = []


        # -----------------------------
        # Count Verification Results
        # -----------------------------

        verified = 0
        tampered = 0

        for record in audit_records:

            action = record.get(
                "action",
                ""
            )

            if action == "VERIFY_SUCCESS":

                verified += 1

            elif action == "TAMPER_DETECTED":

                tampered += 1


        # -----------------------------
        # Latest Activity
        # -----------------------------

        recent_activity = None

        if audit_records:

            recent_activity = audit_records[-1]


        # -----------------------------
        # Response
        # -----------------------------

        return jsonify({

            "total_evidence":
                total_evidence,

            "verified":
                verified,

            "tampered":
                tampered,

            "total_cases":
                len(case_ids),

            "recent_activity":
                recent_activity

        }), 200


    except Exception as e:

        return jsonify({

            "message":
                "Failed to generate dashboard statistics.",

            "error":
                str(e)

        }), 500


# -----------------------------
# Run Server
# -----------------------------

if __name__ == "__main__":

    app.run(
        debug=True
    )