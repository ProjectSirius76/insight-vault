SETUP — Firebase sync + PWA build
==================================

This covers turning on cross-device sync and deploying the installable
version. It assumes you've already created a Firebase project and enabled
Google sign-in (see the checklist below).


1. FIREBASE CONSOLE (one-time, by hand)
----------------------------------------

  a. console.firebase.google.com -> Add project. Any name, no need for
     Google Analytics.

  b. Build -> Firestore Database -> Create database -> Production mode ->
     pick a region close to you.

  c. Build -> Authentication -> Get started -> Sign-in method -> enable
     "Google". Add your own email as an authorized test user if it asks.

  d. Project settings (gear icon) -> General -> "Your apps" -> click the
     </> (web) icon -> register an app (no Firebase Hosting setup needed
     here, we'll do that via CLI) -> copy the `firebaseConfig` object it
     shows you.


2. LOCAL CONFIG
----------------

  Copy .env.example to .env.local and paste the values from step 1d:

    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...

  .env.local is gitignored — this never gets committed.


3. RUN IT LOCALLY
-------------------

    npm install        (already done if you're reading this after the
                         initial scaffold)
    npm run dev

  Open the printed localhost URL. You should see a "Sign in with Google"
  screen. Sign in with the same Google account you added as a test user.
  A fresh vault (seeded with the same starter quotes as before) gets
  created in Firestore under /vaults/<your-uid>.


4. BRING OVER YOUR EXISTING ENTRIES (if any)
-----------------------------------------------

  If you've been using the live site and have real entries sitting in that
  browser's localStorage, they won't automatically follow you to the new
  Firebase-hosted domain (browsers keep localStorage per-origin). One-time
  fix:

    On the OLD site, DevTools console (F12):
      copy(localStorage.getItem("insight-vault-data"))
    (this copies the JSON straight to your clipboard)

    On the NEW site, signed in, DevTools console:
      insightVaultImport(`<paste>`)

  It merges by text, so it's safe to run more than once and won't create
  duplicates.


5. FIRESTORE SECURITY RULES
------------------------------

  No global install needed — `npx` runs firebase-tools straight from its
  package cache. Everything below runs from a PowerShell terminal in the
  project folder.

  a. If PowerShell refuses to run npx at all, with an error like
     "running scripts is disabled on this system" — that's Windows'
     default script execution policy blocking npx's .ps1 wrapper, nothing
     to do with Firebase. Use the .cmd wrapper instead of plain `npx` for
     every command below:

       npx.cmd firebase-tools <...>

  b. Log in:

       npx.cmd firebase-tools login --no-localhost

     Use `--no-localhost` specifically — the plain `firebase login` opens
     a browser AND starts a local callback server to catch the redirect,
     and that callback silently hangs on machines where a firewall/AV
     blocks it (browser looks fine, terminal never hears back, nothing
     ever saves). `--no-localhost` avoids that by using a manual
     code-paste flow instead. The actual steps it walks you through:

       1. Terminal prints a URL. Open it.
       2. Sign into Google, approve access.
       3. The browser shows "Step 2 of 3" with a short session ID code.
          The SAME code is printed in the terminal. Check they match —
          if they don't, stop and don't click anything. If they do,
          click "Yes, this is my session ID".
       4. "Step 3 of 3" shows an authorization code. Copy it, paste it
          back into the terminal where it's waiting, hit enter.
       5. Terminal prints "Success! Logged in as <you>@gmail.com".

     Confirm it actually saved before moving on:

       npx.cmd firebase-tools login:list

     This should list the account you just signed in with. If it says
     "No authorized accounts", the login above did not complete — don't
     proceed to the next step until this shows your account.

  c. Link this folder to the Firebase project (creates .firebaserc):

       npx.cmd firebase-tools use --add

     Pick insight-vault-auth from the list, accept the default alias.

  d. Deploy the rules in firestore.rules (locks each vault to its own
     owner) straight from this repo — no console page-hunting involved:

       npx.cmd firebase-tools deploy --only firestore:rules

     Should end with "✔ Deploy complete!".


6. DEPLOY (HOSTING)
----------------------

    npm run deploy

  This runs `vite build` then `firebase deploy --only hosting`, which
  publishes to https://<project-id>.web.app. That's the URL to use going
  forward — bookmark it, and it's what you'll install as an app in step 7.

  Every time you want to ship a change: repeat `npm run deploy`. Anyone
  with the app already installed picks up the update automatically next
  time they open it (the service worker checks for a new version on load).


7. INSTALL AS AN APP
------------------------

  Windows (Chrome or Edge): open the deployed URL -> click the install
  icon (a monitor-with-arrow) in the address bar, or the "..." menu ->
  "Install Insight Vault...". Creates a Start Menu entry and its own
  window, no browser chrome.

  Android (Chrome): open the deployed URL -> "..." menu -> "Install app"
  (or you may get an automatic "Add Insight Vault to Home screen" banner).
  Creates a home screen icon that opens full-screen.


TROUBLESHOOTING
------------------

  "Firebase isn't configured yet" screen — .env.local is missing or a
  variable name doesn't match .env.example exactly. Restart `npm run dev`
  after editing it (Vite only reads env files on startup).

  Sign-in redirects back to the sign-in screen — check that Google
  sign-in is enabled in Firebase Authentication, and that your Google
  account is added as a test user if the app is still in "Testing" mode
  under OAuth consent (Google Cloud Console, linked automatically from
  the Firebase project).

  Permission denied writing to Firestore — the security rules haven't
  been deployed yet (step 5), or you're signed into a different Google
  account than the one that created the vault doc.

  App is stuck on "syncing..." forever with no error — this used to be
  a real bug (initial vault creation failing silently); it now shows a
  red "Sync error: ..." message instead. If you see that message, it's
  telling you the actual problem — most likely the rules aren't deployed
  (step 5) or the Firestore database was never created (step 1b).

  "running scripts is disabled on this system" — see step 5a, use
  `npx.cmd` instead of `npx` in PowerShell.

  `firebase login` seems to hang / browser looks done but terminal never
  moves — see step 5b, use `login --no-localhost` instead of plain
  `login`. Verify it actually saved with `login:list` before continuing;
  don't assume it worked just because the browser flow looked complete.
