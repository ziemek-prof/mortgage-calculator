# Mortgage Pro by Prof. Ziemek

Interactive mortgage calculator with prepayment options, early payoff analysis, interest vs principal breakdown, interactive charts, dark mode, and PDF export.

---

# AI Studio to GitHub & GitHub Pages Deployment Guide

A step-by-step tutorial on building, exporting, importing, and publishing web applications built in Google AI Studio to GitHub and GitHub Pages.

---

## 📋 Table of Contents
1. [Overview](#1-overview)
2. [Setting Up a New App in AI Studio & Exporting to GitHub](#2-setting-up-a-new-app-in-ai-studio--exporting-to-github)
3. [Configuring GitHub Pages Deployment (Automated)](#3-configuring-github-pages-deployment-automated)
4. [Importing an Existing GitHub Repo into AI Studio](#4-importing-an-existing-github-repo-into-ai-studio)
5. [Preventing Blank Page Issues on GitHub Pages](#5-preventing-blank-page-issues-on-github-pages)
6. [Quick Troubleshooting Checklist](#6-quick-troubleshooting-checklist)

---

## 1. Overview

- **Google AI Studio**: Where you create, modify, and preview your full-stack or front-end React apps using natural language.
- **GitHub**: Where your source code is hosted and version-controlled.
- **GitHub Pages**: Free static site hosting provided by GitHub to serve your web application to the public at `https://<username>.github.io/<repository-name>/`.

---

## 2. Setting Up a New App in AI Studio & Exporting to GitHub

### Step 1: Create Your App
1. Prompt AI Studio to build your desired application (e.g., *Mortgage Calculator*, *Compounded Interest Visualizer*).
2. Test the app in the live preview iframe inside AI Studio.

### Step 2: Configure Relative Asset Base Path
Before exporting, ensure Vite is configured for relative paths so assets load correctly on GitHub Pages subpaths:

In `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // Crucial for GitHub Pages hosting under /<repo-name>/
  plugins: [react()],
});
```

### Step 3: Export Code to GitHub
1. In Google AI Studio, locate the top-right menu or project header.
2. Click **Export** or open **Settings ⚙️** -> **Export to GitHub**.
3. Authorize your GitHub account (e.g., `ziemek-prof`).
4. Select or enter the GitHub repository name (e.g., `mortgage-calculator` or `compounded_interest`).
5. Choose **Public** (required for free GitHub Pages) and click **Export / Commit**.

---

## 3. Configuring GitHub Pages Deployment (Automated)

To have GitHub automatically build and publish your site every time code changes:

### Step 1: Add the GitHub Action Workflow File
Ensure the file `.github/workflows/deploy.yml` exists in your repository root with the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 2: Enable GitHub Actions Pages on GitHub.com
1. Go to your repository on GitHub: `https://github.com/ziemek-prof/<repo-name>`
2. Click **Settings** (top toolbar of the GitHub repo page).
3. In the left menu under **Code and automation**, click **Pages**.
4. Under **Build and deployment**:
   - Change **Source** to **GitHub Actions**.
5. Go to the **Actions** tab at the top of your repository to view the build status.
6. Once the workflow completes, your app will be live at:
   `https://ziemek-prof.github.io/<repo-name>/`

---

## 4. Importing an Existing GitHub Repo into AI Studio

If you created an app previously or moved code into GitHub, you can import it into AI Studio to edit it:

### Step 1: Go to Google AI Studio Home
1. Navigate to **Google AI Studio** (`https://ai.studio` or `https://ai.studio/build`).
2. Click on **My Apps** or **New App** / **Import from GitHub**.

### Step 2: Select Your Repository
1. Paste or select your GitHub URL (e.g. `https://github.com/ziemek-prof/compounded_interest`).
2. Confirm the import. AI Studio will fetch the repository code into a container environment.

### Step 3: Make Changes & Export Back to GitHub
1. Ask the AI agent to perform updates (e.g. *"add by Prof. Ziemek to the title"*).
2. Click **Export to GitHub** (or sync changes) to send the new commits back to the GitHub repo.
3. The GitHub Actions workflow will automatically run and deploy the updated app to GitHub Pages!

---

## 5. Preventing Blank Page Issues on GitHub Pages

If your published GitHub Pages site opens to a blank screen:

1. **Incorrect Base Path**:
   - **Cause**: Assets look for `/assets/index.js` at root domain instead of `/repo-name/assets/index.js`.
   - **Fix**: In `vite.config.ts`, set `base: './'`.
2. **Missing Build Output / Wrong Pages Source**:
   - **Cause**: GitHub Pages is serving an empty branch or missing `dist/` directory.
   - **Fix**: In Repo **Settings** -> **Pages**, ensure **Source** is set to **GitHub Actions**.
3. **Console Routing Errors**:
   - **Cause**: Standard `BrowserRouter` looking for root `/` route.
   - **Fix**: Use relative paths or `HashRouter` if multi-page routing is used.

---

## 6. Quick Troubleshooting Checklist

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| Blank white page on GitHub Pages | Missing `base: './'` in `vite.config.ts` | Add `base: './'` inside `defineConfig()` |
| Page 404 on refresh | GitHub Pages static routing | Ensure relative paths or single-page fallback |
| AI Studio changes not showing on web | Commit not pushed to GitHub | Click **Export to GitHub** in AI Studio |
| GitHub Actions deployment fails | Missing permissions in workflow | Ensure `permissions: pages: write, id-token: write` in `.github/workflows/deploy.yml` |
