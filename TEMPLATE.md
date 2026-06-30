# Making the plug-and-play template (one-time, ~5 min)

This is the only step that needs a human with a Google account. You do it **once**
to create a master Sheet; after that, anyone gets their own working copy by
clicking a link — no clasp, no code, no GitHub.

## Why this works

A Google Sheet can have a **container-bound** Apps Script. When someone uses
**"Make a copy"** of that Sheet, Google copies the bound script with it. The
copier opens their copy, the `⚙ gads-warehouse` menu appears, they run **Setup**,
and they're live. Critically, **Script Properties (the secrets) are NOT copied** —
so every copy starts blank and each deployment stays isolated and secure.

## Build the master (you, once)

1. Create a new blank Google Sheet. This becomes the template.
2. Attach this code as a bound script. Easiest with clasp:
   ```bash
   git clone https://github.com/thewatermouse/gads-warehouse && cd gads-warehouse
   clasp create --type sheets --title "gads-warehouse" --parentId <THE_SHEET_ID>
   clasp push
   ```
   (Or: Extensions → Apps Script in the Sheet, then paste each `src/*` file.)
3. Reload the Sheet. Confirm the **⚙ gads-warehouse** menu appears.
4. (Optional) Run Setup yourself once to sanity-check, then clear those Script
   Properties — you don't want your creds traveling in the master. Actually the
   safest master has **no** Setup run at all.

## Distribute (the plug-and-play link)

Share a URL that forces a copy. Take the Sheet's ID and hand out:

```
https://docs.google.com/spreadsheets/d/<THE_SHEET_ID>/copy
```

Anyone who opens it clicks **"Make a copy"** → gets their own Sheet + bound
script → **⚙ gads-warehouse → 1. Setup** → paste credentials → **2. Check
connection** → **3. Run now**. Done. New account later = new copy, new Setup.

> Set the master's sharing to "Anyone with the link can view" so the `/copy`
> link works for others. The code holds no secrets, so this is safe.

## What each new user still does (unavoidable, ~2 min)

- Paste credentials once in Setup (mostly reusable — see `CREDENTIALS.md`; only
  the Customer ID truly changes per account if they share an MCC/login).
- Click **Authorize** the first time the script runs (Google requires the user
  to consent to the script's scopes — this can't be pre-done for them).
