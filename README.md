# Digital Evidence System

Encrypt, hash and digitally sign digital evidence, verify its integrity, and keep a
tamper-evident chain of custody.

```
DigitalEvidenceSystem/
  backend/    Flask API (app.py, database.py, requirements.txt)  -> http://127.0.0.1:5000
  frontend/   React + Vite + Tailwind + Firebase Auth            -> http://localhost:5173
  storage/    Created/used by the backend (evidence, keys, hashes, database)
```

Pages: `/` landing, `/login`, `/signup`, `/forgot-password`, `/dashboard` (login required).

---

## 1. Run the backend (Terminal 1)

Windows:
```
cd DigitalEvidenceSystem\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python database.py
python app.py
```
Mac / Linux: use `source venv/bin/activate` instead of `venv\Scripts\activate`.

* Run these commands from inside the `backend` folder (the code uses `../storage`).
* `python database.py` creates the database tables. It is safe to run more than once.
* You should see the server running on http://127.0.0.1:5000

## 2. Set up Firebase (one time)

1. Open https://console.firebase.google.com and click **Add project**.
2. **Build > Authentication > Get started > Sign-in method** -> enable **Email/Password** -> Save.
3. **Project settings** (gear icon) **> General > Your apps** -> click the web icon `</>` ->
   register the app -> copy the values from `firebaseConfig`.
4. In the `frontend` folder copy `.env.example` to `.env` and paste the six values:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. Optional: **Authentication > Templates** lets you edit the password-reset email.
6. When you deploy, add your domain under **Authentication > Settings > Authorized domains**
   (`localhost` is already allowed).

Notes
* A Firebase web API key identifies your project; it is not a password. Still, `.env` is in
  `.gitignore` so it is not committed by accident.
* If `.env` is missing, the login pages show a "Firebase is not set up yet" message.
* Password-reset emails can arrive in spam. For privacy the app shows the same message whether
  or not the email has an account.

## 3. Run the frontend (Terminal 2)

Windows:
```
cd DigitalEvidenceSystem\frontend
copy .env.example .env
npm install
npm run dev
```
Mac / Linux: `cp .env.example .env`

Fill in `.env` (step 2), **restart** `npm run dev` after any change to it, then open
http://localhost:5173

## Using the dashboard

* **Chain of Custody** shows the 3 newest records first. Use **Show more** to see older
  records and **Show less** to collapse. To change how many show by default, edit
  `RECENT_RECORDS_LIMIT` at the top of `frontend/src/pages/Dashboard.jsx`.

## What changed from your original project

* `backend/` - unchanged (only `requirements.txt` added).
* `frontend/src/pages/Dashboard.jsx` - your original `App.jsx`, same logic and layout, plus:
  user name/email and **Log out** in the header, and the newest-first, show more/less list.
* `frontend/src/index.css` - defines `.form-input` (it was used but never defined).
* New: landing page, login, signup, forgot password, Firebase auth, route protection.

## Known limitation

Firebase login protects the website pages. The Flask endpoints themselves are not yet
checking a Firebase token, so anyone who can reach the API directly can call them.
Verifying the Firebase ID token in Flask would fix this.
