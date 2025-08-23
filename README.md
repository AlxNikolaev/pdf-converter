## Google Slides Editor Add-on: PDF → Slides with gpt-4o-mini and Firebase

This repository contains a working scaffold for a Google Slides Editor Add-on. The add-on shows a ReactJS sidebar UI to upload a PDF, sends it to a Firebase Cloud Function which processes the PDF using OpenAI `gpt-4o-mini` into a slide specification (with simple images), and then creates slides in the current Google Slides deck through Apps Script.

### What’s included
- Apps Script code for a Slides Editor Add-on (`apps-script/`)
- ReactJS sidebar UI embedded via HTMLService using React CDN + in-browser Babel (`apps-script/ui/index.html`)
- Firebase Cloud Function (`firebase/functions`) to convert a base64 PDF to a slide JSON spec using `gpt-4o-mini`, with optional SVG→PNG rasterization
- Minimal project configs and example env

---

## Prerequisites
- A Google account with access to Google Slides and Apps Script
- A Firebase project (billing enabled if needed for functions + `sharp` install)
- Node.js 18+ and npm
- An OpenAI API key with access to `gpt-4o-mini`

---

## Step 1: Create the Google Apps Script Project
You can do this manually (copy/paste files) or with `clasp`.

### Option A: Use clasp (recommended)
1. Install clasp and login:
```bash
npm run clasp:login
```
2. Create or link a project:
- If you already created a Script project in the UI, copy `.clasp.json.example` to `.clasp.json` and set `scriptId`.
- Otherwise, create a new one:
```bash
npm run clasp:create
# Then copy the generated scriptId into .clasp.json (replace the placeholder)
```
3. Push code:
```bash
npm run clasp:push
```
4. Open the project in browser:
```bash
npm run clasp:open
```
5. Set your Firebase Function URL in `apps-script/ui/index.html` as `FUNCTION_URL`.
6. Deploy the add-on (Test deployments) and try it in Slides.

### Option B: Manual copy/paste
1. Go to `script.new` and create a new project. Rename it to your full name as required.
2. Create a Slides Editor Add-on:
   - Add the following files/contents:
     - `Code.gs` → copy from `apps-script/Code.gs`
     - `appsscript.json` → copy from `apps-script/appsscript.json`
     - `ui/index.html` → create a subfolder `ui` and copy from `apps-script/ui/index.html`
3. In `ui/index.html`, set your Firebase Function URL in `FUNCTION_URL`.
4. Deploy the add-on:
   - Click Deploy → Test deployments. Authorize scopes when prompted.
   - Open a Slides presentation → Extensions → `Your Add-on Name` → Open Sidebar.

Note: You can also use `clasp` to push these files if you prefer, but manual copy-paste is fine for the challenge.

---

## Step 2: Firebase Cloud Functions Setup
1. Install dependencies and configure the function:
```bash
cd firebase/functions
npm install
cp .env.example .env
# Add your OpenAI key to .env
```

2. Edit `firebase/functions/.env`:
```
OPENAI_API_KEY=sk-...your-key...
```

3. (Optional) Ensure your Firebase project is selected and initialized:
```bash
cd ..
firebase use your-project-id
```

4. Deploy the function:
```bash
firebase deploy --only functions
```

5. Get your HTTPS function URL from the deploy output and paste it into `apps-script/ui/index.html` as `FUNCTION_URL`.

---

## How it works
- React sidebar allows PDF upload.
- Client reads the PDF as base64 and POSTs to the Firebase function.
- Function extracts text with `pdf-parse`, prompts `gpt-4o-mini` to return a slide JSON spec with title, bullets, and simple SVG illustrations.
- Function rasterizes SVG to PNG using `sharp` and returns PNGs as base64.
- Client calls `google.script.run.createSlides(slideSpec)` to build slides in the active presentation (title, bullets, and images).

---

## Configuration Notes
- Images: SVGs are rasterized server-side to PNG for Slides compatibility.
- CORS: The function responds with permissive CORS headers for the HTMLService origin.
- Scopes: The manifest requests Slides, Drive (blob handling), and Script UI scopes.

---

## Demo/Submission
1. Share the Apps Script project link with "Anyone with the link".
2. Record a short demo video showing:
   - Opening the add-on in Google Slides
   - Uploading a PDF
   - Slides being created
3. Send via Telegram to `t.me/nathgilson` along with this repo link.

---

## Troubleshooting
- If images don’t appear: Ensure function returns `imagePngBase64` and that Apps Script converts base64 to blob.
- If deployment fails due to `sharp`: Enable billing on the Firebase project and redeploy.
- If CORS errors appear: Confirm your function URL and that it returns the `Access-Control-Allow-*` headers.


