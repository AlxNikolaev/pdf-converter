## Google Slides Editor Add-on: PDF → Slides with gpt-4o-mini and Firebase

### Project brief
This add-on converts a user-uploaded PDF into a slide deck inside Google Slides. The sidebar UI (React rendered via Apps Script HTMLService) uploads the PDF as base64 to a Firebase Cloud Function. The function extracts text with `pdfjs-dist` and calls OpenAI `gpt-4o-mini` using the Responses API with Structured Outputs to produce a strict slide specification and simple SVG illustrations. The Apps Script then builds slides with titles, bullets, and rasterized images.

### What’s included
- Apps Script Slides Editor Add-on code (`apps-script/`)
- React sidebar UI via CDN UMD + in-browser Babel (`apps-script/ui/index.html`)
- Firebase Cloud Function (Node 20) (`firebase/functions/`) with modules in `firebase/functions/src/`
- Structured Outputs with `text.format: json_schema` and a defined slide schema

## CI/CD
The repo contains a GitHub Actions workflow that deploys both Apps Script and Firebase Functions on `main` pushes.

- Apps Script:
  - Uses `@google/clasp`. CI authenticates using `CLASP_RC` (contents of your `~/.clasprc.json`).
  - `.clasp.json` contains `scriptId` and `rootDir: "apps-script"`. CI pushes files, creates a version, and deploys.

- Firebase Functions:
  - Uses a Google Cloud service account (`FIREBASE_SERVICE_ACCOUNT`) and `FIREBASE_PROJECT_ID`.
  - Deploys Gen 2 Functions on Node 20, sets up artifact cleanup policy, and references `OPENAI_API_KEY` from Secret Manager.

Required GitHub secrets:
- `CLASP_RC`: JSON contents of `~/.clasprc.json` for the Apps Script account
- `FIREBASE_SERVICE_ACCOUNT`: service account JSON with deploy permissions
- `FIREBASE_PROJECT_ID`: your project id
Note: `OPENAI_API_KEY` is stored as a Firebase Secret; set via CLI and not in GitHub secrets.

## Tools and rationale
- Apps Script + HTMLService: simplest official way to render a Slides sidebar and call `google.script.run`.
- React via CDN UMD and Babel-in-browser: zero-build setup suitable for a coding exercise; easy to iterate.
- Firebase Cloud Functions (Gen 2, Node 20): managed runtime, easy HTTPS, secret management, and logging.
- OpenAI Responses API (`gpt-4o-mini`): good cost/performance; Structured Outputs enforce JSON validity.
- `pdfjs-dist`: reliable PDF text extraction without module-level side effects in serverless.
- `sharp`: rasterizes inline SVG to PNG for image insertion into Slides.

Trade-offs: CDN React + in-browser Babel is not optimal for production performance; a bundler (Vite) and TypeScript would be preferred long-term. HTMLService has CSP and module limitations but is fast to ship.


