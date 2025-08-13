# CAS PRD Aug 2025

<!-- CI Badge -->
![Verify](https://github.com/dunnhtomas/cas-prd-aug2025/actions/workflows/verify.yml/badge.svg)

## Overview

Mono-repo style minimal product requirements demo with:

- Next.js web frontend (port 3000)
- Express tracker backend with health endpoint (port 8080 + auto fallback)
- Playwright SEO + health tests
- Prisma + SQLite schema (no migrations run by default)

## Structure

```text
cas_prd_aug2025/
  package.json
  start-servers.js
  setup_prd.ps1
  tracker/index.js
  web/next.config.js
  web/pages/index.js
  tests/seo.spec.ts
  playwright.config.ts
  prisma/schema.prisma
```

## Install

```powershell
cd .\cas_prd_aug2025
npm install --legacy-peer-deps
```

## Run (dev)

```powershell
npm run dev            # tracker (nodemon) + web
# or
node .\start-servers.js
# or PowerShell helper
./setup_prd.ps1
```

Web: [http://localhost:3000](http://localhost:3000)  
Tracker: [http://localhost:8080/health](http://localhost:8080/health)

### Force start (kill existing ports 3000/8080 then run)

```powershell
npm run force:start
```

### Production build/start (web only)

```powershell
npm run prod           # builds Next.js then next start -p 3000
```

## One-shot Verification (spin up, test, tear down)

```powershell
npm run verify
```

What it does:

1. Kills anything on configured ports (defaults 3000/8080)
2. Starts tracker + web in background
3. Waits for health + homepage
4. Runs Playwright tests
5. Shuts everything down

Exit code reflects test success.

## Tests

Ensure servers are running, then:

```powershell
npx playwright test
```

(First run triggers browser install via pretest script.)

### Lint & Format

```powershell
npm run lint          # check
npm run lint:fix      # fix
npm run format        # prettier check
npm run format:write  # prettier write
```

### Cross-platform Verify

Node-based script (no PowerShell dependency):

```powershell
npm run verify
```

PowerShell variant retained:

```powershell
npm run verify:ps
```

## Prisma (optional)

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

## Environment Vars

- TRACKER_PORT: override default 8080
- WEB_URL / TRACKER_URL: overrides for Playwright tests

See `.env.example` for template.

## Next Steps / Ideas

- (Done) CI workflow (GitHub Actions) running Playwright + Prisma + matrix
- Introduce Dockerfile + docker-compose
- Extend EventLog usage in tracker API
- Add linter + formatter (ESLint/Prettier)
- Add coverage reporting & HTML report publishing
- Add Prisma migrations + migrations CI gate

 

## License

MIT (add LICENSE file as needed)
