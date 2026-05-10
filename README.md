<div align="center">

<img src="https://github.com/Acelake123/CompileX/blob/24aa43635248e9308fbc8f0c399b6858af5c1723/public/banner-compilex.svg" alt="compileX — Online Code Editor & IDE" width="100%"/>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-FF6C2F?style=for-the-badge&logoColor=white)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br/>

> **compileX** is a full-featured browser-based IDE — write, run, and share code in 10 languages,  
> collaborate with the community, and get AI-powered insights on any GitHub repository.  
> No installations. No setup. Just code.

<br/>

[✨ Features](#-features) · [📸 Screenshots](#-screenshots) · [🏗️ Tech Stack](#%EF%B8%8F-tech-stack) · [🚀 Getting Started](#-getting-started) · [🤝 Contributing](#-contributing)

</div>

---

## 📸 Screenshots

<div align="center">

### 🏠 Home Page
*Four core modules — all at a glance*

<img src="https://github.com/Acelake123/CompileX/blob/24aa43635248e9308fbc8f0c399b6858af5c1723/public/Home_Page.png" alt="compileX Home Page" width="100%"/>

<br/><br/>

### 💻 Code Editor &nbsp;·&nbsp; Live Output &nbsp;·&nbsp; PDF Export
*Monaco-powered editor with real-time execution and one-click PDF sharing*

<img src="https://github.com/Acelake123/CompileX/blob/24aa43635248e9308fbc8f0c399b6858af5c1723/public/Code_Editor_Page_with_PDF_Export.jpg" alt="compileX Code Editor with PDF Export" width="100%"/>

<br/><br/>

### 🔬 AI-Powered Repository Analyzer
*Paste any GitHub URL — get a full file tree, commit history, and AI insights in ~10 seconds*

<img src="https://github.com/Acelake123/CompileX/blob/24aa43635248e9308fbc8f0c399b6858af5c1723/public/Repo_Analyzer_Page.png" alt="compileX Repo Analyzer" width="100%"/>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🖊️ Editor & Execution
- **Monaco Editor** — the same engine powering VS Code
- **10 programming languages** supported out of the box
- **5 VSCode themes** — fully customizable experience
- **Adjustable font size** for comfortable coding
- **Smart output panel** with ✅ Success & ❌ Error states
- **Cloud-based execution** via One Compiler API

</td>
<td width="50%" valign="top">

### 🤝 Community & Sharing
- **Code snippet manager** — save, organize & share
- **Public snippet feed** — browse the community
- **Share via public links** — one click to share
- **Star & comment** on community snippets
- **Advanced search & filtering** across all snippets
- **Export code as PDF** — shareable in one click

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 👤 Profile & Stats
- **Personal dashboard** with execution history
- **Comprehensive statistics** on your coding activity
- **Execution history tracker** per language & date
- **Registered vs Guest** user access tiers
- **Secure auth** via Clerk — no passwords to manage

</td>
<td width="50%" valign="top">

### 🔬 AI Repo Analyzer &nbsp;`✦ NEW`
- **Paste any GitHub URL** to analyze instantly
- **Recursive file tree explorer** with syntax highlighting
- **AI-generated summary & insights** via Gemini AI
- **Commit history viewer** — recent activity at a glance
- **AI code chat** — ask questions about the codebase
- **Previous analyses** saved to your dashboard

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### 🖥️ Frontend
- **Next.js 15** (App Router)
- **React** + TypeScript
- **Tailwind CSS**
- **Monaco Editor** (browser IDE)
- **shadcn/ui** components

</td>
<td valign="top" width="33%">

### ⚙️ Backend & Auth
- **Convex** — DB, queries & serverless APIs
- **Clerk** — authentication & sessions
- **One Compiler API** — cloud code execution
- **GitHub API** — repository data & file trees

</td>
<td valign="top" width="33%">

### 🤖 AI & Integrations
- **Gemini AI** — repo analysis & insights
- **Webhook support** for external services
- **PDF export** for sharing code

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- A [Convex](https://convex.dev/) account
- A [Clerk](https://clerk.com/) account
- A [Gemini AI](https://ai.google.dev/) API key

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/compileX.git
cd compileX
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Gemini AI (Repo Analyzer)
GEMINI_API_KEY=your_gemini_api_key

# One Compiler (Code Execution)
ONE_COMPILER_API_KEY=your_one_compiler_key
```

**4. Start Convex backend**

```bash
npx convex dev
```

**5. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start coding 🎉

---

## 🗺️ Project Timeline

| Phase | Description | Duration |
|---|---|---|
| 🟦 **01 — Initiation** | Project kickoff, planning & role assignments | Day 1–2 |
| 🟣 **02 — UI/UX Design** | Wireframes & user interface mockups | Day 3–12 |
| 🟢 **03 — Frontend Dev** | Web layout & Next.js components | Day 10–50 |
| 🟠 **04 — Backend Dev** | APIs, Convex schema & core functions | Day 15–45 |
| 🔵 **05 — Integration** | API integration & runtime handling | Day 40–70 |
| 🔴 **06 — Testing & QA** | End-to-end testing & quality assurance | Day 60–80 |

---

## 👥 User Roles

<table>
<tr>
<td width="50%" valign="top">

### 🔓 Guest User
- Access the basic code editor
- Browse public snippets shared by registered users

</td>
<td width="50%" valign="top">

### 🔐 Registered User
- Secure registration & login via Clerk
- Write, edit, and run code in multiple languages
- Save snippets to a personal dashboard
- Share snippets via public links
- Full execution history & stats
- Access to AI Repo Analyzer

</td>
</tr>
</table>

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

```bash
# 1. Fork the repo and create your branch
git checkout -b feature/your-feature-name

# 2. Make your changes and commit
git commit -m "feat: describe your change"

# 3. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please keep commits prefixed — `feat:`, `fix:`, `docs:`, `chore:`.

---

## 📚 References

| Resource | Description |
|---|---|
| [Next.js Docs](https://nextjs.org/docs) | App Router, routing & server-side rendering |
| [Convex Docs](https://docs.convex.dev/) | Backend DB & serverless functions |
| [Clerk Docs](https://clerk.com/docs) | Authentication & user management |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Browser-based IDE engine |
| [One Compiler API](https://onecompiler.com/apis/code-execution) | Cloud code execution service |

---

<div align="center">

Made with ❤️ by the compileX team

⭐ **Star this repo** if compileX made your coding life easier!

*Code. Collaborate. Compile. Succeed.*

</div>
