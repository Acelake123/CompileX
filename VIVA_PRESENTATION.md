# CompileX: Full-Stack Architecture Explanation for Viva
## A Complete Guide for Student Presentation

---

# STEP 1: PROJECT OVERVIEW

## What is CompileX?

**CompileX** is a **cloud-based code execution and analysis platform** that allows users to:
- Write and execute code in **13+ programming languages** instantly
- Save and share code snippets with the community
- Analyze GitHub repositories with **AI-powered insights**
- Chat with AI about codebases to understand them better
- Download execution results as PDF

Think of it as: **"Google Docs for Coding + GitHub Repository Analyzer + AI Code Assistant"**

---

## High-Level Features Explained

### 1️⃣ **Interactive Code Editor**
```
User writes code in Monaco Editor
   ↓
Code stored in memory (Zustand store)
   ↓
User clicks "Run"
   ↓
Code sent to OneCompiler API (Convex Action)
   ↓
Result returned: stdout or stderr
   ↓
Displayed in Output Panel
```

**Why this flow?**
- We can't run untrusted code on our server
- OneCompiler is a safe, sandboxed environment
- Uses Convex Actions because it's async external API call

---

### 2️⃣ **Snippet Sharing System**
```
User creates snippet (title, code, language)
   ↓
Saved to Convex Database (with userId)
   ↓
Other users can view, comment, star
   ↓
Stars stored as separate records (user → snippet mapping)
   ↓
Stars counted on each view
```

**Why separate stars table?**
- Each user can star/unstar once
- Multiple users can star same snippet
- Supports "toggle star" operation (star again = unstar)

---

### 3️⃣ **GitHub Repository Analyzer**
The most complex feature. Flow:
```
User enters GitHub URL (e.g., facebook/react)
   ↓
Parse URL to extract owner/repo
   ↓
Fetch metadata from GitHub API (stars, language, description)
   ↓
Fetch recent commits (last 50)
   ↓
Fetch file tree structure
   ↓
Get README content
   ↓
Send ALL this to Gemini AI
   ↓
Gemini generates analysis:
  - Tech stack detected
  - Strengths/weaknesses
  - Suggested use cases
  - Commit patterns
   ↓
Save everything to Convex Database
   ↓
Display to user with beautiful UI
```

**Key insight:** This is a **snapshot** - once analyzed, it's cached forever

---

### 4️⃣ **AI Chat About Repos**
```
User asks: "What does this project do?"
   ↓
Chat stored with context (repo analysis ID)
   ↓
Previous messages retrieved
   ↓
Current message + repo context + code snippets sent to Gemini
   ↓
Gemini responds
   ↓
Response saved to database
   ↓
Shown to user
```

**Why is this stored?**
- Build conversation history
- User can come back later and continue discussion
- Tree-like structure: repo → analysis → multiple chats

---

### 5️⃣ **PDF Export**
- Takes current code + execution output
- Generates PDF with jsPDF library
- User downloads to their computer

---

### 6️⃣ **Authentication**
- Uses **Clerk** (third-party auth service)
- User login → Clerk validates
- Clerk ID stored in database
- All operations check: "Is this user's data?"
- Features behind auth:
  - Share snippets (requires sign-in)
  - Star snippets (requires sign-in)
  - Repo analyzer (requires sign-in)

---

## Architecture Diagram (Simple View)

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  (Next.js Pages + React Components + Zustand Store)        │
│                                                              │
│  ├─ Editor Page          (Monaco Editor)                    │
│  ├─ Snippets Page        (Grid view + search)               │
│  ├─ Snippet Detail       (Comments + Stars)                 │
│  ├─ Repo Analyzer Page   (Form + Analysis Display)          │
│  └─ Repo Chat Page       (Chat UI + File Explorer)          │
└──────────────────────────────────────────────────────────────┘
                              ↓ (HTTP API calls)
┌──────────────────────────────────────────────────────────────┐
│                    Backend Layer (Convex)                    │
│                                                               │
│  ├─ Queries    (fetch data)                                  │
│  │  ├─ getSnippets                                           │
│  │  ├─ getRepoAnalysis                                       │
│  │  └─ listRepositoryFiles                                   │
│  │                                                            │
│  ├─ Mutations  (write data)                                  │
│  │  ├─ createSnippet                                         │
│  │  ├─ starSnippet                                           │
│  │  ├─ saveRepoAnalysis                                      │
│  │  └─ addChatMessage                                        │
│  │                                                            │
│  └─ Actions   (external async calls)                         │
│     ├─ executeCode        (→ OneCompiler)                    │
│     ├─ generateRepoChatResponse (→ Gemini/Ollama)            │
│     └─ saveRepoAnalysis    (→ GitHub API + Gemini)           │
└──────────────────────────────────────────────────────────────┘
                              ↓ (Database)
┌──────────────────────────────────────────────────────────────┐
│                  Convex Database (NoSQL)                     │
│                                                               │
│  Tables:                                                      │
│  ├─ users                 (Clerk integration)                 │
│  ├─ snippets              (Code storage)                      │
│  ├─ snippetComments       (Comments on snippets)             │
│  ├─ stars                 (User stars)                        │
│  ├─ repoAnalyses          (GitHub analysis results)          │
│  ├─ repositories          (Repo metadata)                     │
│  ├─ repositoryFiles       (File tree)                         │
│  ├─ cachedFileContents    (File source code)                  │
│  ├─ repoChatHistory       (Conversations)                     │
│  └─ codeExecutions        (Execution history)                 │
└──────────────────────────────────────────────────────────────┘
                              ↓ (External APIs)
┌──────────────────────────────────────────────────────────────┐
│                    External Services                         │
│                                                               │
│  ├─ Clerk        (Authentication)                            │
│  ├─ GitHub API   (Repo data)                                 │
│  ├─ Gemini API   (AI Analysis)                               │
│  ├─ Ollama       (Local AI - optional)                        │
│  └─ OneCompiler  (Code Execution)                            │
└──────────────────────────────────────────────────────────────┘
```

---

# STEP 2: FOLDER STRUCTURE EXPLAINED

## Directory Organization

```
compileX/
│
├─ convex/                          👈 BACKEND (Serverless compute + DB)
│  ├─ schema.ts                     Define all tables
│  ├─ auth.config.ts                Clerk authentication config
│  ├─ users.ts                      User queries/mutations
│  ├─ snippets.ts                   Snippet CRUD operations
│  ├─ codeExecution.ts              Action: Execute code
│  ├─ codeExecutions.ts             Query: User execution history
│  ├─ repoAnalyzer.ts               Repo analysis CRUD
│  ├─ repoChat.ts                   Action: Chat with AI
│  ├─ repositories.ts               GitHub repo management
│  └─ _generated/                   Auto-generated types (don't edit)
│
├─ src/
│  │
│  ├─ app/                          👈 ROUTING (Next.js App Router)
│  │  ├─ layout.tsx                 Root layout
│  │  ├─ globals.css                Global styles
│  │  ├─ (root)/                    👈 Main app routes
│  │  │  ├─ page.tsx                Home page
│  │  │  ├─ editor/page.tsx         Code editor
│  │  │  ├─ snippets/page.tsx       Snippets library
│  │  │  │  ├─ [id]/page.tsx        Snippet detail view
│  │  │  │  └─ _components/         Snippet components
│  │  │  ├─ profile/page.tsx        User profile
│  │  │  └─ repo/[repoId]/page.tsx  Repo analyzer display
│  │  ├─ repo-analyzer/page.tsx     Repo analyzer form
│  │  └─ _components/               Shared UI components
│  │     ├─ EditorPanel.tsx
│  │     ├─ OutputPanel.tsx
│  │     ├─ Header.tsx
│  │     └─ ...
│  │
│  ├─ actions/                      👈 SERVER-SIDE FUNCTIONS
│  │  ├─ aiAnalysis.ts              AI analysis helpers
│  │  ├─ repoAnalyzer.ts            Repo analysis logic
│  │  └─ repoChat.ts                Chat helpers
│  │
│  ├─ config/                       👈 EXTERNAL SERVICE SETUP
│  │  ├─ geminiClient.ts            Google Gemini API wrapper
│  │  └─ ai.ts                      Re-export for compatibility
│  │
│  ├─ components/                   👈 REUSABLE UI COMPONENTS
│  │  ├─ AuthRequiredDialog.tsx     Login prompt
│  │  ├─ DeleteRepoDialog.tsx       Confirmation delete
│  │  ├─ MarkdownContent.tsx        Render markdown
│  │  ├─ NavigationHeader.tsx       Top navigation
│  │  ├─ providers/                 Context providers
│  │  │  └─ ConvexClientProvider.tsx Connect to Convex
│  │  └─ ...
│  │
│  ├─ hooks/                        👈 CUSTOM REACT HOOKS
│  │  └─ useMounted.tsx             Check if mounted (SSR safe)
│  │
│  ├─ store/                        👈 STATE MANAGEMENT (Zustand)
│  │  └─ useCodeEditorStore.ts      Editor state (code, output, theme)
│  │
│  ├─ types/                        👈 TYPE DEFINITIONS (TypeScript)
│  │  ├─ index.ts                   Main types
│  │  └─ repo-analyzer/             Repo analyzer types
│  │     └─ index.ts                GitHub + Analysis types
│  │
│  ├─ utils/                        👈 HELPER FUNCTIONS
│  │  └─ pdfGenerator.ts            jsPDF wrapper
│  │
│  └─ middleware.ts                 👈 AUTH MIDDLEWARE (Clerk)
│
├─ public/                          Static files (images, etc)
├─ package.json                     Dependencies
├─ tsconfig.json                    TypeScript config
├─ next.config.ts                   Next.js config
├─ tailwind.config.ts               Tailwind CSS config
└─ README.md                        Documentation
```

---

## Purpose of Each Folder

| Folder | Purpose | Used By |
|--------|---------|---------|
| `convex/` | Backend database + functions | Frontend calls via API |
| `src/app/` | Page routing (Next.js) | Users navigate to pages |
| `src/actions/` | Server-side helpers (fetches from GitHub, processes data) | Frontend calls these |
| `src/config/` | External service configs (Gemini, Ollama) | Backend actions use these |
| `src/components/` | Reusable React components | All pages use these |
| `src/hooks/` | Custom React logic | Pages/components use |
| `src/store/` | Client-side state (Zustand) | Pages/components use |
| `src/types/` | TypeScript interfaces | All code uses for type safety |
| `src/utils/` | Pure functions (PDF generation) | Any code that needs them |
| `convex/_generated/` | **DO NOT EDIT** - Auto-generated from schema | Auto-imports in code |

---

# STEP 3: BACKEND DEEP DIVE (MOST IMPORTANT)

## What is Convex?

**Convex = Backend-as-a-Service for full-stack apps**

Traditional backend:
```
Write server code → Deploy to server → Set up database → Write API routes
Complex, lots of DevOps
```

With Convex:
```
Write query/mutation/action functions → Deploy → Auto-generates API
Simple, handles scaling automatically
```

### Three Types of Functions in Convex

---

## 🔍 1. QUERIES (Read-Only)

### What is a Query?
- Fetches data from database
- **Never writes** (can't cause side effects)
- **Real-time subscriptions** (if data changes, UI updates instantly)
- Runs with **authentication check** (can't access other users' data)

### Example from Project: Get All Snippets

```typescript
// convex/snippets.ts
export const getSnippets = query({
  handler: async (ctx) => {
    // No args needed - returns all snippets
    return await ctx.db
      .query("snippets")
      .collect();
  },
});
```

**How it's used:**
```typescript
// src/app/(root)/snippets/page.tsx
const snippets = useQuery(api.snippets.getSnippets);

// useQuery returns:
// - undefined while loading
// - [] when done
// - updates in real-time if database changes
```

**Frontend:**
```
When page loads → useQuery triggered
↓
Call getSnippets in backend
↓
Fetch all snippets from database
↓
Return to frontend
↓
UI renders snippets
↓
If any snippet added by anyone → UI updates automatically ✨
```

### Another Example: Get User's Stars

```typescript
export const getUserStarredSnippets = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Find all star records for this user
    const stars = await ctx.db
      .query("stars")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    // Extract snippet IDs
    const snippetIds = stars.map(s => s.snippetId);
    
    // Fetch actual snippets
    return Promise.all(snippetIds.map(id => ctx.db.get(id)));
  },
});
```

**Authentication in action:** 🔒
- `ctx.auth.getUserIdentity()` returns current user
- Returns `null` if user not logged in
- We check and return empty if not authenticated
- User can only see THEIR own stars

---

## ✏️ 2. MUTATIONS (Write Operations)

### What is a Mutation?
- **Writes to database** (insert, update, delete)
- Requires authentication (can't write for anonymous users)
- **NOT real-time** (frontend must manually refresh)
- Runs inside a **transaction** (all-or-nothing)

### Example 1: Create Snippet

```typescript
export const createSnippet = mutation({
  args: {
    title: v.string(),
    language: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Step 1: Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Step 2: Check if user exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    // Step 3: Auto-create user if needed
    if (!user) {
      const userId = await ctx.db.insert("users", {
        userId: identity.subject,
        name: identity.name ?? "Anonymous",
        email: identity.email ?? "",
      });
      user = await ctx.db.get(userId);
    }

    // Step 4: Create and return snippet
    return await ctx.db.insert("snippets", {
      userId: identity.subject,
      userName: user!.name,
      title: args.title,
      language: args.language,
      code: args.code,
    });
  },
});
```

**Flow:**
```
User types title, code, language
  ↓
Clicks "Save as Snippet"
  ↓
Frontend calls: createSnippet({ title, language, code })
  ↓
Backend receives request
  ↓
Check: Is user logged in?
  ├─ No? → Throw error → Frontend shows dialog
  ├─ Yes? → Continue
  ↓
Check: Does user exist in database?
  ├─ No? → Create user automatically
  ├─ Yes? → Use existing user
  ↓
Create snippet with userId + userName
  ↓
Return snippet ID
  ↓
Frontend shows success toast
```

**Key Pattern: Safe Error Handling**
```typescript
if (!identity) {
  throw new ConvexError("AUTH_REQUIRED");
}
```
When this throws → Frontend catches it → Shows error dialog

---

### Example 2: Star Snippet (Toggle)

```typescript
export const starSnippet = mutation({
  args: {
    snippetId: v.id("snippets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Step 1: Check if THIS user already starred THIS snippet
    const existing = await ctx.db
      .query("stars")
      .withIndex("by_user_id_and_snippet_id")
      .filter((q) =>
        q
          .eq("userId", identity.subject)
          .eq("snippetId", args.snippetId)
      )
      .first();

    if (existing) {
      // Already starred → Remove star (unstar)
      await ctx.db.delete(existing._id);
    } else {
      // Not starred yet → Add star
      await ctx.db.insert("stars", {
        userId: identity.subject,
        snippetId: args.snippetId,
      });
    }
  },
});
```

**Why not a single boolean field on snippets?**
- A snippet has ONE owner but MANY stars from different users
- Each user's star is independent
- Need many-to-many relationship → separate table

```
Snippets Table:
┌─────────────────┐
│ _id | title     │
├─────────────────┤
│  1  | Hello     │
│  2  | World     │
└─────────────────┘

Stars Table:
┌──────────────────────────┐
│ userId | snippetId       │
├──────────────────────────┤
│ user1  | snippet1        │
│ user2  | snippet1        │
│ user1  | snippet2        │
└──────────────────────────┘

Result: snippet1 has 2 stars, snippet2 has 1 star
```

---

### Example 3: Delete Snippet

```typescript
export const deleteSnippet = mutation({
  args: {
    snippetId: v.id("snippets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Get the snippet
    const snippet = await ctx.db.get(args.snippetId);
    
    // Check: Does it exist?
    if (!snippet) {
      throw new ConvexError("SNIPPET_NOT_FOUND");
    }

    // Check: Is this snippet mine?
    if (snippet.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    // Step 1: Delete all comments on this snippet
    const comments = await ctx.db
      .query("snippetComments")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Step 2: Delete all stars for this snippet
    const stars = await ctx.db
      .query("stars")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .collect();

    for (const star of stars) {
      await ctx.db.delete(star._id);
    }

    // Step 3: Delete the snippet itself
    await ctx.db.delete(args.snippetId);
  },
});
```

**Cascade Delete Pattern:**
```
When deleting a snippet:
  1. Delete all comments (dependencies)
  2. Delete all stars (dependencies)
  3. Then delete snippet (parent)

Why important? 
- Database integrity
- No orphaned records
- Prevents foreign key errors
```

---

## ⚡ 3. ACTIONS (External Async Calls)

### What is an Action?
- Calls **external APIs** (OneCompiler, Gemini, GitHub, etc.)
- **Async/await** works like normal JavaScript
- No real-time streaming in base actions (but can stream)
- Can call queries/mutations inside using `ctx.runQuery()`

### Example 1: Execute Code on OneCompiler

```typescript
// convex/codeExecution.ts

export const executeCode = action({
  args: {
    language: v.string(),
    code: v.string(),
  },
  handler: async (_, args) => {
    const { language, code } = args;

    // Step 1: Get API key from environment
    const apiKey = process.env.ONECOMPILER_API_KEY;
    if (!apiKey) {
      throw new Error("ONECOMPILER_API_KEY is not configured");
    }

    // Step 2: Map our language to OneCompiler's language
    const oneCompilerLanguage = LANGUAGE_MAP[language];
    if (!oneCompilerLanguage) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Step 3: Map file extension
    const fileExtension = FILE_EXTENSIONS[language];
    const fileName = `main.${fileExtension}`;

    try {
      // Step 4: Call OneCompiler API
      const response = await fetch("https://api.onecompiler.com/v1/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          language: oneCompilerLanguage,
          files: [
            {
              name: fileName,
              content: code,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OneCompiler error: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      // Step 5: Parse response
      const result = await response.json();

      // Step 6: Return normalized result
      return {
        success: result.status === "success",
        output: result.stdout || result.output || "",
        error: result.stderr || result.error || null,
        executionTime: result.executionTime || 0,
      };
    } catch (error) {
      console.error("Code execution error:", error);
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: 0,
      };
    }
  },
});
```

**Complete Data Flow:**
```
Frontend (Editor Component):
  ├─ User clicks "Run"
  ├─ Get code from editor
  └─ Call action: await executeCode({ language, code })
       ↓
Backend (Action):
  ├─ Validate API key exists
  ├─ Map language to OneCompiler format
  └─ Make HTTP POST to OneCompiler API
       ↓
OneCompiler (External Service):
  ├─ Receive code
  ├─ Compile/run code in sandbox
  └─ Return stdout/stderr
       ↓
Backend (Action):
  ├─ Parse response
  ├─ Normalize format {success, output, error, time}
  └─ Return to frontend
       ↓
Frontend (Store):
  ├─ Update Zustand store
  ├─ Set output/error
  └─ UI renders result
```

---

### Example 2: AI Chat (Gemini + Context)

```typescript
// convex/repoChat.ts

export const generateRepoChatResponse = action({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
    repositoryId: v.id("repositories"),
    userMessage: v.string(),
    scopeType: v.union(v.literal("repo"), v.literal("dir"), v.literal("file")),
    scopePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1: Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Step 2: Fetch repo analysis (using runQuery - runs from action)
    const analysis = await ctx.runQuery(
      api.repoAnalyzer.getRepoAnalysis,
      { repoAnalysisId: args.repoAnalysisId }
    );
    if (!analysis) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    // Step 3: Get repository info
    const repository = await ctx.runQuery(
      api.repositories.getRepository,
      { repositoryId: args.repositoryId }
    );
    if (!repository) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    // Step 4: Get list of files
    const files = await ctx.runQuery(
      api.repositories.listRepositoryFiles,
      { repositoryId: args.repositoryId }
    );

    // Step 5: Build context for Gemini
    let scopeContext = "";
    if (args.scopeType === "file" && args.scopePath) {
      // Fetch actual file content from cache
      const cached = await ctx.runQuery(
        api.repositories.getCachedFileContent,
        {
          repositoryId: args.repositoryId,
          path: args.scopePath,
        }
      );
      // Use cached content
      scopeContext = `\nFile: ${args.scopePath}\n\`\`\`\n${cached?.content || ""}\n\`\`\``;
    }

    // Step 6: Build AI prompt
    const prompt = `
      You are analyzing a GitHub repository.
      
      Repository: ${analysis.metadata.name}
      Description: ${analysis.metadata.description}
      Tech Stack: ${analysis.analysis.techStack.join(", ")}
      
      User Question: ${args.userMessage}
      
      Context: ${scopeContext}
      
      Provide a helpful, concise response.
    `;

    // Step 7: Call Gemini AI
    const response = await generateWithGemini(prompt);

    // Step 8: Save chat message to database
    await ctx.runMutation(
      api.repoChat.addRepoChatMessage,
      {
        repoAnalysisId: args.repoAnalysisId,
        role: "assistant",
        message: response,
        scopeType: args.scopeType,
        scopePath: args.scopePath,
      }
    );

    return response;
  },
});
```

**Why use Action?**
- Calling Gemini API = async external call
- Can't put in query (not deterministic)
- Can't put in mutation (shouldn't call external APIs there)
- Action = perfect for this

---

## 📊 Convex Schema Summary

The **schema.ts** defines all database tables:

```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    userId: v.string(),        // From Clerk
    email: v.string(),
    name: v.string(),
  }).index("by_user_id", ["userId"]),

  snippets: defineTable({
    userId: v.string(),        // Who owns it
    title: v.string(),
    language: v.string(),
    code: v.string(),
    userName: v.string(),      // For display
  }).index("by_user_id", ["userId"]),

  stars: defineTable({
    userId: v.string(),        // Who starred
    snippetId: v.id("snippets"),  // What snippet
  })
    .index("by_user_id", ["userId"])
    .index("by_snippet_id", ["snippetId"])
    .index("by_user_id_and_snippet_id", ["userId", "snippetId"]),

  repoAnalyses: defineTable({
    userId: v.string(),
    repoUrl: v.string(),
    metadata: v.object({...}), // GitHub metadata
    analysis: v.object({...}), // AI-generated analysis
    readme: v.optional(v.string()),
    analyzedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_user_id_and_repo", ["userId", "repoUrl"]),

  repoChatHistory: defineTable({
    repoAnalysisId: v.id("repoAnalyses"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    message: v.string(),
    timestamp: v.number(),
  }).index("by_repo_analysis_id", ["repoAnalysisId"]),

  // ... more tables
});
```

**Key Pattern: Indexes**
```typescript
.index("by_user_id", ["userId"])
```
- Faster queries: `query("snippets").withIndex("by_user_id")`
- Essential for filtering by userId
- Without index: table scan (slow on large data)

---

# STEP 4: DATA FLOW (VERY IMPORTANT)

## Complete End-to-End Flows

---

## Flow 1: Code Execution

### Step-by-Step Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Frontend - User triggers run                         │
└─────────────────────────────────────────────────────────────┘

  User opens editor → Editor Page (src/app/(root)/editor/page.tsx)
                        ↓
                   Monaco Editor rendered
                        ↓
                   User types JavaScript:
                   
                   console.log("Hello, World!");
                        ↓
                   User clicks "Run" button
                        ↓
                   RunButton component triggers


┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Store Update - Code stored in memory               │
└─────────────────────────────────────────────────────────────┘

  RunButton.tsx:
    const store = useCodeEditorStore();
    const code = store.getCode();  // Get from Monaco editor
    
    store.runCode(executeCode);    // Pass Convex action
    
    Inside runCode():
      - Set isRunning = true  (show spinner)
      - Set error = null      (clear old errors)
      - Set output = ""       (clear old output)
      
    UI updates → shows loading skeleton


┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Frontend → Convex (Backend)                         │
└─────────────────────────────────────────────────────────────┘

  Frontend calls Convex action:
    
    const result = await executeCodeAction({
      language: "javascript",
      code: "console.log('Hello, World!');"
    });
    
    This HTTP POST request is sent to Convex backend


┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Convex Backend (Action)                             │
└─────────────────────────────────────────────────────────────┘

  Backend receives request in codeExecution.ts:
  
    export const executeCode = action({
      args: { language, code },
      handler: async (ctx, args) => {
        // Get OneCompiler API key from env
        const apiKey = process.env.ONECOMPILER_API_KEY;
        
        // Map language
        const oneCompilerLang = LANGUAGE_MAP["javascript"] = "javascript"
        
        // Call OneCompiler API...
      }
    });


┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Convex → OneCompiler (External)                     │
└─────────────────────────────────────────────────────────────┘

  Backend makes HTTP POST to:
    https://api.onecompiler.com/v1/run
    
  With body:
    {
      "language": "javascript",
      "files": [{
        "name": "main.js",
        "content": "console.log('Hello, World!');"
      }]
    }


┌─────────────────────────────────────────────────────────────┐
│ STEP 6: OneCompiler Sandbox                                  │
└─────────────────────────────────────────────────────────────┘

  OneCompiler service:
    ├─ Receives code
    ├─ Sandboxes environment (isolated container)
    ├─ Executes: console.log("Hello, World!");
    ├─ Captures stdout: "Hello, World!\n"
    ├─ Captures stderr: "" (empty, no errors)
    └─ Returns response


┌─────────────────────────────────────────────────────────────┐
│ STEP 7: OneCompiler → Convex                                 │
└─────────────────────────────────────────────────────────────┘

  OneCompiler response:
    {
      "status": "success",
      "stdout": "Hello, World!",
      "stderr": "",
      "executionTime": 142
    }


┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Convex Normalizes Response                           │
└─────────────────────────────────────────────────────────────┘

  Backend parseResponse:
    
    return {
      success: true,
      output: "Hello, World!",
      error: null,
      executionTime: 142
    };


┌─────────────────────────────────────────────────────────────┐
│ STEP 9: Convex → Frontend                                   │
└─────────────────────────────────────────────────────────────┘

  Backend sends response back to frontend


┌─────────────────────────────────────────────────────────────┐
│ STEP 10: Frontend Store Update                               │
└─────────────────────────────────────────────────────────────┘

  Frontend receives result:
    
    useCodeEditorStore.setState({
      isRunning: false,
      output: "Hello, World!",
      error: null,
      executionResult: {
        code: "console.log('Hello, World!');",
        output: "Hello, World!",
        error: null
      }
    });


┌─────────────────────────────────────────────────────────────┐
│ STEP 11: UI Renders Output                                   │
└─────────────────────────────────────────────────────────────┘

  OutputPanel component:
    
    const { output, error, isRunning } = useCodeEditorStore();
    
    If isRunning = true:
      → Show loading skeleton
    
    Else if error:
      → Show red error box with error message
    
    Else if output:
      → Show green success box with output
    
    Else:
      → Show "No output"
    
    Result visible to user! ✅

```

---

## Flow 2: Snippet Sharing

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User shares code as snippet                         │
└─────────────────────────────────────────────────────────────┘

  Current code: "console.log('Hello');"
  
  User clicks "Share" button
        ↓
  ShareSnippetDialog opens
        ↓
  User fills:
    - Title: "Hello World"
    - (Language auto-detected)
    - (Code auto-filled)
  
  User clicks "Share"


┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Frontend validation & auth check                    │
└─────────────────────────────────────────────────────────────┘

  ShareSnippetDialog:
    
    const { isLoaded, isSignedIn } = useAuth();
    
    If NOT signed in:
      → AuthRequiredDialog shown
      → Redirect to login
      → Stop here
    
    Else:
      → Continue to create snippet


┌─────────────────────────────────────────────────────────────┘
│ STEP 3: Call backend mutation                                │
└─────────────────────────────────────────────────────────────┘

  Frontend calls:
    
    const createSnippet = useMutation(api.snippets.createSnippet);
    
    await createSnippet({
      title: "Hello World",
      language: "javascript",
      code: "console.log('Hello');"
    });


┌─────────────────────────────────────────────────────────────┘
│ STEP 4: Backend mutation execution                           │
└─────────────────────────────────────────────────────────────┘

  Backend (snippets.ts):
    
    export const createSnippet = mutation({
      handler: async (ctx, args) => {
        // 1. Get current user from Clerk
        const identity = await ctx.auth.getUserIdentity();
        
        if (!identity) {
          throw new ConvexError("AUTH_REQUIRED");
        }
        
        // 2. Check if user exists in database
        let user = await ctx.db
          .query("users")
          .withIndex("by_user_id")
          .filter(q => q.eq(q.field("userId"), identity.subject))
          .first();
        
        // 3. If not, auto-create user
        if (!user) {
          const userId = await ctx.db.insert("users", {
            userId: identity.subject,
            name: identity.name,
            email: identity.email
          });
          user = await ctx.db.get(userId);
        }
        
        // 4. Insert snippet
        return await ctx.db.insert("snippets", {
          userId: identity.subject,
          userName: user.name,
          title: "Hello World",
          language: "javascript",
          code: "console.log('Hello');"
        });
      }
    });


┌─────────────────────────────────────────────────────────────┘
│ STEP 5: Data saved to database                               │
└─────────────────────────────────────────────────────────────┘

  Convex Database:
    
    INSERT INTO snippets VALUES (
      _id: "k12x23j",           ← Auto-generated ID
      userId: "user_12345",     ← From Clerk
      userName: "John Doe",
      title: "Hello World",
      language: "javascript",
      code: "console.log('Hello');",
      _creationTime: 1700000000
    );


┌─────────────────────────────────────────────────────────────┘
│ STEP 6: Frontend success                                     │
└─────────────────────────────────────────────────────────────┘

  Frontend receives ID:
    
    "Snippet shared successfully!" (toast)
    ↓
    Navigate to: /snippets/k12x23j


┌─────────────────────────────────────────────────────────────┘
│ STEP 7: Other users see snippet                              │
└─────────────────────────────────────────────────────────────┘

  Other user visits /snippets:
    
    - Page loads
    - useQuery(api.snippets.getSnippets) called
    - Backend: SELECT * FROM snippets (all public)
    - Returns all snippets including "Hello World"
    - UI renders card showing:
      ├─ Title: "Hello World"
      ├─ By: "John Doe"
      ├─ Language: JavaScript
      └─ Code preview


┌─────────────────────────────────────────────────────────────┘
│ STEP 8: User stars snippet                                   │
└─────────────────────────────────────────────────────────────┘

  Other user clicks star icon:
    
    await starSnippet({ snippetId: "k12x23j" });
    
    Backend starSnippet mutation:
      ├─ Get current user
      ├─ Check if already starred
      ├─ If yes: DELETE from stars
      ├─ If no: INSERT into stars
      └─ Return
    
    Result:
      INSERT INTO stars VALUES (
        userId: "user_67890",
        snippetId: "k12x23j"
      );


┌─────────────────────────────────────────────────────────────┘
│ STEP 9: Star count reflects                                  │
└─────────────────────────────────────────────────────────────┘

  On snippet detail page:
    
    The star icon becomes filled 🌟
    Star count increments by 1
    
    How?
    - useQuery runs when dependencies change
    - OR manually refetch after mutation
    - Stars now show: 1 person starred this

```

---

## Flow 3: GitHub Repo Analysis (Complex)

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: User submits repo URL                                │
└──────────────────────────────────────────────────────────────┘

  User goes to /repo-analyzer
  ↓
  Sees form: "Enter GitHub URL"
  ↓
  Types: "https://github.com/facebook/react"
  ↓
  Clicks "Analyze Repository"


┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Frontend form validation                             │
└──────────────────────────────────────────────────────────────┘

  RepoForm component:
    
    const handleSubmit = async (url) => {
      // 1. Validate URL format
      if (!url.includes("github.com")) {
        toast.error("Please enter a valid GitHub URL");
        return;
      }
      
      // 2. Set loading state
      setIsLoading(true);
      
      // 3. Call server action
      const result = await analyzeRepository(url);
    };


┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Call server action (analyzeRepository)               │
└──────────────────────────────────────────────────────────────┘

  src/actions/repoAnalyzer.ts - analyzeRepository():
    
    "use server";  ← Runs ONLY on server
    
    export async function analyzeRepository(url: string) {
      try {
        // Step 1: Parse URL
        const parsed = await parseGitHubUrl(url);
        if (!parsed) throw new Error("Invalid GitHub URL");
        
        const { owner, repo } = parsed;  // "facebook", "react"


┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Fetch GitHub metadata                                │
└──────────────────────────────────────────────────────────────┘

        // Step 2: Fetch repo metadata
        const metadata = await fetchRepositoryMetadata(owner, repo);
        
        // Makes HTTP GET: https://api.github.com/repos/facebook/react
        // Headers include GITHUB_TOKEN from env
        
        // Response includes:
        {
          "name": "react",
          "description": "The library for web...",
          "stargazers_count": 213000,
          "language": "JavaScript",
          "default_branch": "main",
          "private": false
        }


┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Fetch recent commits                                 │
└──────────────────────────────────────────────────────────────┘

        // Step 3: Fetch commits
        const commits = await fetchRecentCommits(owner, repo);
        
        // Makes HTTP GET: https://api.github.com/repos/facebook/react/commits
        // Returns last 50 commits with author, date, message
        
        // Processes to:
        {
          "totalCommits": 18532,
          "averageCommitsPerWeek": 25.3,
          "recentCommits": [
            {
              "message": "Fix useTransition during...",
              "author": "sebmarkbage",
              "date": "2024-01-15T10:30:00Z",
              "hash": "abc1234..."
            },
            // ... more commits
          ]
        }


┌──────────────────────────────────────────────────────────────┐
│ STEP 6: Fetch file tree structure                             │
└──────────────────────────────────────────────────────────────┘

        // Step 4: Fetch file structure
        const fileStructure = await fetchRepositoryTree(owner, repo);
        
        // Makes recursive GitHub API calls to build tree
        // Returns:
        {
          "Files": ["package.json", "README.md", "src/index.js", ...],
          "Directories": ["src", "node_modules", "docs", ...]
        }


┌──────────────────────────────────────────────────────────────┐
│ STEP 7: Send to Gemini AI for analysis                        │
└──────────────────────────────────────────────────────────────┘

        // Step 5: Get AI analysis
        const analysis = await generateAnalysis({
          metadata,
          commits,
          fileStructure,
          readme
        });
        
        // Inside generateAnalysis:
        const prompt = `
          Analyze this GitHub repository:
          
          Name: ${metadata.name}
          Description: ${metadata.description}
          Stars: ${metadata.stars}
          Language: ${metadata.language}
          
          Recent commits: ${JSON.stringify(commits.recentCommits)}
          File structure: ${JSON.stringify(fileStructure)}
          README: ${readme}
          
          Provide:
          - Tech stack (list 5-10 technologies)
          - Strengths (list 3-5)
          - Weaknesses (list 2-3)
          - Suggested use cases
          - Key findings
          - Commit activity overview
          - Timeline insights
        `;
        
        // Call Gemini API
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });
        
        // Parse response into structured format:
        {
          "techStack": ["React", "JavaScript", "Node.js", ...],
          "strengths": ["Well-maintained", "Excellent documentation", ...],
          "weaknesses": ["Steep learning curve", ...],
          "suggestedUseCases": ["Web app development", ...],
          "keyFindings": "Mature, production-ready...",
          "commitActivityOverview": "Regular commits...",
          "timelineInsights": "Project started in 2013..."
        }


┌──────────────────────────────────────────────────────────────┐
│ STEP 8: Save analysis to Convex                               │
└──────────────────────────────────────────────────────────────┘

        // Step 6: Save to database
        const saved = await saveRepoAnalysisAction({
          repoUrl: url,
          owner,
          repoName: "react",
          metadata,
          commits,
          fileStructure,
          analysis,
          readme
        });
        
        // Calls Convex mutation: repoAnalyzer.saveRepoAnalysis
        // 
        // Backend checks:
        // 1. Is user logged in?
        // 2. Does analysis exist for this user + repo?
        //    - YES: Update existing
        //    - NO: Create new
        // 3. Store everything in repoAnalyses table


┌──────────────────────────────────────────────────────────────┐
│ STEP 9: Return result to frontend                             │
└──────────────────────────────────────────────────────────────┘

        return {
          success: true,
          analysisId: "repoAnalysis_xyz",
          analysis
        };


┌──────────────────────────────────────────────────────────────┐
│ STEP 10: Frontend shows analysis                              │
└──────────────────────────────────────────────────────────────┘

      } catch (error) {
        return {
          success: false,
          error: error.message || "Analysis failed"
        };
      }
    }
    
    Frontend receives result:
      ├─ If success:
      │  ├─ Navigate to: /repo/[repoId]
      │  └─ Show analysis in beautiful UI
      │     ├─ Tech stack badges
      │     ├─ Strengths/weaknesses lists
      │     ├─ File tree explorer
      │     ├─ Recent commits
      │     └─ Chat interface
      │
      └─ If error:
         └─ Show error toast
            "This repo is private" OR
            "GitHub API rate limit exceeded"


┌──────────────────────────────────────────────────────────────┐
│ STEP 11: User can now chat about repo                         │
└──────────────────────────────────────────────────────────────┘

  User sees chat interface
  ↓
  Types: "What is this project for?"
  ↓
  Clicks send
  ↓
  Calls:  generateRepoChatResponse action
    - Pass repo analysis ID
    - Pass user message
    - Current scope (whole repo vs specific file)
  ↓
  Backend action:
    ├─ Fetch repo analysis
    ├─ If file-scoped: fetch file content
    ├─ Build prompt with context
    ├─ Call Gemini API
    ├─ Save chat message to database
    └─ Return response
  ↓
  UI shows: "This project is a JavaScript library for..."
  ↓
  Message saved in database for future reference

```

---

# STEP 5: FRONTEND EXPLAINED

## Next.js App Router

### What is App Router?
File-based routing system. Each file = a route.

```
src/app/
  (root)/
    page.tsx                    → GET /
    editor/page.tsx             → GET /editor
    snippets/page.tsx           → GET /snippets
    snippets/[id]/page.tsx      → GET /snippets/hello-world
    profile/page.tsx            → GET /profile
    repo/[repoId]/page.tsx      → GET /repo/abc123
```

### Key Pages

1. **Home (/)**
   - `src/app/(root)/page.tsx`
   - Shows 4 feature cards
   - Links to Editor, Snippets, etc.

2. **Code Editor (/editor)**
   - `src/app/(root)/editor/page.tsx`
   - Split panel layout:
     - Left: Monaco Editor (EditorPanel component)
     - Right: Output Terminal (OutputPanel component)
   - Controls: Language selector, theme, font size, run button, share, download PDF

3. **Snippets (/snippets)**
   - `src/app/(root)/snippets/page.tsx`
   - Grid view of all public snippets
   - Search + language filter
   - Each card shows: title, code preview, author, star count

4. **Snippet Detail (/snippets/[id])**
   - `src/app/(root)/snippets/[id]/page.tsx`
   - Full snippet view
   - Code with syntax highlighting
   - Comments section
   - Star button

5. **Repo Analyzer (/repo-analyzer)**
   - `src/app/repo-analyzer/page.tsx`
   - Form to enter GitHub URL
   - List of previous analyses
   - Can click to view analysis

6. **Repo Detail (/repo/[repoId])**
   - `src/app/(root)/repo/[repoId]/page.tsx`
   - Full analysis display:
     - Metadata (stars, language, description)
     - Tech stack badges
     - Strengths/weaknesses
     - File tree (clickable)
     - Recent commits
     - Chat interface (tab-based)

---

## Component Architecture

### EditorPanel Component

```typescript
// src/app/(root)/_components/EditorPanel.tsx

"use client";  ← Client-side component

export default function EditorPanel() {
  // 1. Get store
  const { language, editor, setEditor } = useCodeEditorStore();
  
  // 2. Get auth
  const { isSignedIn } = useAuth();
  
  // 3. Handle language change
  const handleLanguageChange = (newLang) => {
    // Get code from old language
    const currentCode = editor?.getValue();
    localStorage.setItem(`editor-code-${language}`, currentCode);
    
    // Load code for new language
    const savedCode = localStorage.getItem(`editor-code-${newLang}`);
    editor?.setValue(savedCode || getDefaultCode(newLang));
    
    setLanguage(newLang);
  };
  
  // 4. Handle refresh (reset to default)
  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    editor?.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
  };
  
  // 5. Handle share click
  const handleShareClick = () => {
    if (!isLoaded) {
      toast.error("Auth loading...");
      return;
    }
    
    if (!isSignedIn) {
      setShowAuthDialog(true);  ← Show login prompt
      return;
    }
    
    setIsShareDialogOpen(true);  ← Show share dialog
  };
  
  // 6. Render Monaco Editor
  return (
    <Editor
      height="100%"
      language={LANGUAGE_CONFIG[language].monacoLanguage}
      value={editor?.getValue()}
      onChange={handleEditorChange}
      theme={theme}
      onMount={setEditor}
    />
  );
}
```

**State Flow:**
```
Zustand Store (useCodeEditorStore)
  ├─ language: "javascript"
  ├─ theme: "vs-dark"
  ├─ fontSize: 16
  ├─ editor: Monaco instance
  ├─ output: ""
  ├─ error: null
  ├─ isRunning: false
  └─ executionResult: null

User Types Code
  ↓
localStorage saves incremental changes
  ↓
On language switch:
  ├─ Save current code
  ├─ Load new language code
  └─ Update store

On run:
  └─ Store: isRunning = true
      ↓
     OneCompiler result
      ↓
     Store: isRunning = false, output = "result"
```

---

### OutputPanel Component

```typescript
export default function OutputPanel() {
  const { output, error, isRunning } = useCodeEditorStore();
  
  if (isRunning) {
    return <RunningCodeSkeleton />;  ← Loading skeleton
  }
  
  if (error) {
    return (
      <div className="text-red-400">
        ❌ Error: {error}
      </div>
    );
  }
  
  if (output) {
    return (
      <div className="text-green-400">
        {output}
        <button>Copy</button>
      </div>
    );
  }
  
  return <div>No output yet</div>;
}
```

---

## State Management with Zustand

### Why Zustand?
- Simple, lightweight state management
- No boilerplate (unlike Redux)
- Direct mutations + getters + setters
- Persists to localStorage automatically

### useCodeEditorStore

```typescript
// src/store/useCodeEditorStore.ts

import { create } from "zustand";

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
  return {
    // Initial state
    language: "javascript",
    theme: "vs-dark",
    fontSize: 16,
    output: "",
    error: null,
    isRunning: false,
    editor: null,
    
    // Getters
    getCode: () => get().editor?.getValue() || "",
    
    // Setters
    setLanguage: (language) => {
      localStorage.setItem("editor-language", language);
      set({ language, output: "", error: null });
    },
    
    setTheme: (theme) => {
      localStorage.setItem("editor-theme", theme);
      set({ theme });
    },
    
    setEditor: (editor) => {
      const current = get().editor?.getValue();
      if (current) {
        localStorage.setItem(`editor-code-${get().language}`, current);
      }
      set({ editor });
    },
    
    // Complex action
    runCode: async (executeCodeAction) => {
      const code = get().getCode();
      const language = get().language;
      
      set({ isRunning: true, error: null, output: "" });
      
      try {
        // Call Convex action
        const result = await executeCodeAction({
          language,
          code
        });
        
        set({
          isRunning: false,
          output: result.output,
          error: result.error,
          executionResult: {
            code,
            output: result.output,
            error: result.error
          }
        });
      } catch (err) {
        set({
          isRunning: false,
          error: err.message
        });
      }
    }
  };
});
```

---

## Authentication Flow with Clerk

### Clerk Setup

```typescript
// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Run middleware on all routes except Next internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)).*|\.well-known).*)",
    // Always run on API routes
    "/(api|trpc)(.*)",
  ],
};
```

### Using Auth in Components

```typescript
"use client";

import { useAuth, useUser } from "@clerk/nextjs";

export default function MyComponent() {
  // Hook 1: Check if logged in
  const { isLoaded, isSignedIn, userId } = useAuth();
  
  // Hook 2: Get user details
  const { user } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  
  if (!isSignedIn) {
    return (
      <AuthRequiredDialog>
        <p>Please sign in to continue</p>
      </AuthRequiredDialog>
    );
  }
  
  return (
    <div>
      Welcome, {user?.firstName}!
      Your ID: {userId}
    </div>
  );
}
```

### Auth in Convex Actions/Mutations

```typescript
export const createSnippet = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Get current user from Clerk
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      // User not logged in
      throw new ConvexError("AUTH_REQUIRED");
    }
    
    // User details
    const { subject, email, name } = identity;
    // subject = Clerk user ID
    // email = "user@example.com"
    // name = "John Doe"
    
    // Save with userId
    return ctx.db.insert("snippets", {
      userId: subject,
      code: args.code
    });
  }
});
```

---

# STEP 6: AUTHENTICATION EXPLAINED

## Clerk Integration

### What is Clerk?
- Third-party authentication service
- Handles login, signup, OAuth
- Secure, industry-standard
- Returns user ID (subject)

### Flow

```
1. User visits website
   ↓
2. Click "Sign In"
   ↓
3. Redirected to Clerk login page (modal or redirect)
   ↓
4. Enter email/password OR use Google/GitHub OAuth
   ↓
5. Clerk verifies credentials
   ↓
6. Clerk issues JWT token
   ↓
7. Token stored in browser secure cookie
   ↓
8. Redirected back to app
   ↓
9. useAuth() hook now returns isSignedIn = true
   ↓
10. Identity.subject = unique Clerk user ID
```

### Why Clerk?

| Without Clerk | With Clerk |
|---|---|
| Build login form | Pre-built UI |
| Hash passwords | Clerk handles |
| Session management | Automatic |
| OAuth setup | One click |
| Rate limiting | Built-in |

---

### Feature Restrictions Behind Auth

```typescript
// 1. Creating Snippets requires login
export const createSnippet = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("AUTH_REQUIRED");
    // ... proceed
  }
});

// 2. Starring snippets requires login
export const starSnippet = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("AUTH_REQUIRED");
    // ... proceed
  }
});

// 3. Accessing repo analyzer requires login
export default function RepoAnalyzerPage() {
  const { isSignedIn } = useAuth();
  
  if (!isSignedIn) {
    return <p>Sign in to use Repo Analyzer</p>;
  }
  
  // ... show analyzer
}
```

---

# STEP 7: AI INTEGRATION EXPLAINED

## Why Gemini?

```
Gemini API (Google's LLM)
  ├─ Fast inference
  ├─ Cheaper than GPT-4
  ├─ Good for coding analysis
  ├─ Supports long context windows
  └─ Free tier available
```

## Gemini Client Setup

```typescript
// src/config/geminiClient.ts

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
// Automatically loads GEMINI_API_KEY from env

export async function generateWithGemini(
  prompt: string,
  maxTokens: number = 2048
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    throw new Error("AI_SERVICE_ERROR");  ← Safe error
  }
}
```

---

## Use Case 1: Repository Analysis

### Prompt Building

```typescript
function buildAnalysisPrompt(repo) {
  return `
    Analyze this GitHub repository:
    
    NAME: ${repo.metadata.name}
    DESCRIPTION: ${repo.metadata.description}
    STARS: ${repo.metadata.stars}
    LANGUAGE: ${repo.metadata.language}
    
    RECENT COMMITS:
    ${repo.commits.recentCommits.map(c => 
      `- ${c.date}: ${c.message} (by ${c.author})`
    ).join('\n')}
    
    FILE STRUCTURE:
    ${repo.fileStructure.Directories.join(', ')}
    ${repo.fileStructure.Files.slice(0, 30).join(', ')}
    
    README:
    ${repo.readme}
    
    Provide analysis in JSON format:
    {
      "techStack": ["tech1", "tech2"],
      "strengths": ["strength1"],
      "weaknesses": ["weakness1"],
      "suggestedUseCases": ["use case1"],
      "keyFindings": "summary",
      "commitActivityOverview": "overview",
      "timelineInsights": "insights"
    }
  `;
}
```

### Parsing Response

```typescript
const response = await generateWithGemini(prompt);

try {
  const analysis = JSON.parse(response);
  // Use analysis object
} catch {
  // If not valid JSON, return safe default
  return {
    techStack: [],
    strengths: ["Unable to analyze"],
    weaknesses: [],
    suggestedUseCases: [],
    keyFindings: "Analysis failed",
    commitActivityOverview: "",
    timelineInsights: ""
  };
}
```

---

## Use Case 2: Repo Chat with Context

### Chat Prompt with File Context

```typescript
async function generateChatWith Context(
  analysis,       // Repo metadata
  userMessage,    // "What is this project?"
  scopeType,      // "repo" | "dir" | "file"
  scopePath,      // "/src/index.js"
  fileContent     // Actual source code (if file scope)
) {
  let context = `
    Repository: ${analysis.name}
    Description: ${analysis.description}
    Tech Stack: ${analysis.analysis.techStack.join(", ")}
    
    Analysis:
    ${analysis.analysis.summary}
  `;
  
  // Add file context if scoped
  if (scopeType === "file" && fileContent) {
    context += `
    
    Current File: ${scopePath}
    \`\`\`${getLanguage(scopePath)}
    ${fileContent}
    \`\`\`
    `;
  }
  
  const prompt = `
    ${context}
    
    User Question: ${userMessage}
    
    Provide a helpful, concise response.
  `;
  
  return await generateWithGemini(prompt);
}
```

### Three Scope Types

| Scope | Context | Use Case |
|-------|---------|----------|
| **repo** | Whole analysis | "What's this for?" |
| **dir** | Directory  files | "What's in /src?" |
| **file** | Full file content | "Explain this function" |

---

## Error Handling (Safe Pattern)

```typescript
export async function generateAnalysis(prompt) {
  try {
    const response = await generateWithGemini(prompt);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // NEVER expose internal error to user
    return {
      success: false,
      error: "AI_SERVICE_ERROR",
      message: "Unable to generate analysis right now"
    };
  }
}
```

**Why?**
- Users shouldn't see "API key invalid"
- Users shouldn't see rate limit details
- Safe error codes → better UX

---

## Ollama Integration (Optional Local AI)

```typescript
// convex/repoChat.ts - Fallback to Ollama

async function generateWithOllama(
  prompt: string,
  maxTokens: number
): Promise<string> {
  const model = await detectOllamaModel();
  
  const response = await fetch(
    `http://localhost:11434/api/generate`,
    {
      method: "POST",
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        temperature: 0.2,
        num_predict: maxTokens
      })
    }
  );
  
  const data = await response.json();
  return data.response;
}
```

**Why Ollama?**
- Local alternative to Gemini
- No API calls = more privacy
- Can use offline
- Fallback option

---

# STEP 8: ERROR HANDLING EXPLAINED

## Safe Response Pattern

### Why We Never Throw

Traditional approach (❌ Bad):
```typescript
export const createSnippet = mutation({
  handler: async (ctx, args) => {
    if (!args.title) {
      throw new Error("Title is required");  ← User sees raw error
    }
    // ...
  }
});
```

Problems:
- Stack traces exposed to frontend
- Internal implementation details visible
- Inconsistent error format
- Bad user experience

---

### Safe Approach (✅ Good)

```typescript
export const createSnippet = mutation({
  handler: async (ctx, args) => {
    try {
      if (!args.title) {
        throw new ConvexError("VALIDATION_ERROR");
      }
      
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new ConvexError("AUTH_REQUIRED");
      }
      
      // ... proceed
      
      return {
        success: true,
        data: snippet
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "UNKNOWN_ERROR"
      };
    }
  }
});
```

---

### Frontend Handling

```typescript
const result = await createSnippet(args);

if (!result.success) {
  // Show user-friendly error in dialog
  showErrorDialog(result.error);
  
  switch (result.error) {
    case "AUTH_REQUIRED":
      showLoginPrompt();
      break;
    case "VALIDATION_ERROR":
      toast.error("Please fill in all fields");
      break;
    case "NOT_AUTHORIZED":
      toast.error("This isn't your snippet");
      break;
    default:
      toast.error("Something went wrong");
  }
  return;
}

// Success
toast.success("Snippet created!");
```

---

## Error Types in Project

| Error | Cause | User Message |
|-------|-------|--------------|
| `AUTH_REQUIRED` | Not logged in | "Please sign in" |
| `NOT_AUTHORIZED` | Accessing someone else's data | "You don't have permission" |
| `SNIPPET_NOT_FOUND` | Snippet deleted | "Snippet not found" |
| `PRIVATE_REPO` | Private GitHub repo | "This repository is private" |
| `AI_SERVICE_ERROR` | Gemini/Ollama failed | "Unable to analyze right now" |
| `API_TIMEOUT` | External API slow | "Request timed out" |

---

### Dialog-Based UX

Instead of alerts/errors everywhere, use dialogs:

```typescript
// OllamaErrorDialog.tsx
export function OllamaErrorDialog() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <h2>⚠️ Ollama Not Available</h2>
        <p>Make sure Ollama is running: ollama serve</p>
        <button onClick={() => window.open("https://ollama.ai")}>
          Install Ollama
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

Benefits:
- Modal blocks further interaction (prevents cascading errors)
- Clear explanation + action
- Professional appearance

---

# STEP 9: WHY EACH FUNCTION EXISTS

## Key Functions Explained

---

### 1. `saveRepoAnalysis` (Mutation)

```typescript
export const saveRepoAnalysis = mutation({...});
```

**What it does:**
- Stores GitHub repo analysis in database
- Update existing if already analyzed
- Prevents duplicate analyses

**Why it exists:**
- Analysis takes time (40+ API calls)
- Don't want to re-analyze same repo repeatedly
- Cache results for instant access later

**When called:**
- After `generateAnalysis` action completes
- User clicks "Analyze Repository"
- Server action: `src/actions/repoAnalyzer.ts`

**Data saved:**
```
repoAnalyses table:
├─ userId (who analyzed it)
├─ repoUrl (facebook/react)
├─ metadata (GitHub data)
├─ commits (commit history)
├─ analysis (AI-generated insights)
└─ readme (raw README content)
```

---

### 2. `getUserRepoAnalyses` (Query)

```typescript
export const getUserRepoAnalyses = query({...});
```

**What it does:**
- Gets all analyses the current user performed
- Real-time subscription (auto-refresh)

**Why it exists:**
- Users need to see their analysis history
- "Continue previous analysis" feature

**When called:**
- Page load: `/repo-analyzer`
- Displayed as: "Previous Analyses"
- Can click to view/delete

---

### 3. `generateRepoChatResponse` (Action)

```typescript
export const generateRepoChatResponse = action({...});
```

**What it does:**
- User asks question about repo
- Build context from analysis
- Call Gemini AI
- Save message to database
- Return AI response

**Why it exists:**
- External API call (Gemini/Ollama)
- Need file content and context
- Must save conversation history

**When called:**
- User types message in chat
- Clicks send in `/repo/[repoId]` view

**Data flow:**
```
User Message
  ↓
Fetch previous messages (context)
  ↓
Fetch file content (if file-scoped)
  ↓
Build prompt
  ↓
Call Gemini/Ollama
  ↓
Save response
  ↓
Show to user
```

---

### 4. `executeCode` (Action)

```typescript
export const executeCode = action({...});
```

**What it does:**
- Takes code + language
- Calls OneCompiler API
- Returns stdout/stderr
- Handles errors safely

**Why it exists:**
- Can't execute untrusted code on our server
- OneCompiler is sandboxed
- Action = correct place for external API

**When called:**
- User clicks "Run" in `/editor`

**Error handling:**
```javascript
if (!response.ok) {
  return {
    success: false,
    error: error.message
  };
}
// Never throw - return safe response
```

---

### 5. `starSnippet` (Mutation)

```typescript
export const starSnippet = mutation({...});
```

**What it does:**
- Toggle star (add or remove)
- Check if user already starred
- Update stars table

**Why it exists:**
- Users want to like/favorite code
- Public feature
- Needs reliable toggle mechanism

**When called:**
- Click star icon on snippet card
- `/snippets` page or detail view

**Key insight:**
```typescript
// Check if THIS user starred THIS snippet
const existing = await ctx.db
  .query("stars")
  .withIndex("by_user_id_and_snippet_id")
  .filter((q) =>
    q.eq("userId", identity.subject)
      .eq("snippetId", args.snippetId)
  )
  .first();

if (existing) {
  // Unstar
  await ctx.db.delete(existing._id);
} else {
  // Star
  await ctx.db.insert("stars", {...});
}
```

---

### 6. `deleteSnippet` (Mutation)

```typescript
export const deleteSnippet = mutation({...});
```

**What it does:**
- Delete snippet + all related data
- Comments
- Stars
- Cascade delete

**Why it exists:**
- Users should control their content
- Privacy concern
- Clean up database

**When called:**
- User deletes their snippet
- Profile page or detail view

**Cascade pattern:**
```typescript
// 1. Delete comments
const comments = await ctx.db
  .query("snippetComments")
  .withIndex("by_snippet_id")
  .filter(...)
  .collect();
for (const comment of comments) {
  await ctx.db.delete(comment._id);
}

// 2. Delete stars
const stars = await ctx.db
  .query("stars")
  .withIndex("by_snippet_id")
  .filter(...)
  .collect();
for (const star of stars) {
  await ctx.db.delete(star._id);
}

// 3. Delete snippet
await ctx.db.delete(args.snippetId);
```

---

### 7. `addChatMessage` (Mutation)

```typescript
export const addChatMessage = mutation({...});
```

**What it does:**
- Save chat message to database
- Track user/assistant messages
- Scope (repo/dir/file-level)
- Timestamp

**Why it exists:**
- Build conversation history
- User can continue later
- Shows chat thread in UI

**When called:**
- After AI generates response
- Both user and assistant messages saved

**Data:**
```typescript
{
  repoAnalysisId: "abc123",    // Which repo analysis
  userId: "user_123",
  role: "user" | "assistant",
  message: "What is this for?",
  timestamp: 1700000000,
  scopeType: "repo" | "dir" | "file",
  scopePath: "/src/index.js"   // If file-scoped
}
```

---

### 8. `createSnippet` (Mutation)

```typescript
export const createSnippet = mutation({...});
```

**What it does:**
- User saves code as public snippet
- Auto-create user if new
- Store with metadata

**Why it exists:**
- Core feature: share with community
- Track by owner
- Make searchable

**When called:**
- User clicks "Share" in editor
- Fill form dialog
- Click "Share Snippet"

**Auto-create user:**
```typescript
// 1. Check if user exists
let user = await ctx.db
  .query("users")
  .withIndex("by_user_id")
  .filter(...)
  .first();

// 2. If not, create
if (!user) {
  const userId = await ctx.db.insert("users", {
    userId: identity.subject,
    name: identity.name,
    email: identity.email
  });
  user = await ctx.db.get(userId);
}

// 3. Then create snippet with userName
await ctx.db.insert("snippets", {
  userId: identity.subject,
  userName: user.name,  ← Display name
  ...
});
```

---

# STEP 10: OUTPUT FORMAT FOR VIVA

## How to Present This

### 1. **Verbal Explanation Structure**

```
1. Start with high-level overview
   "CompileX is a cloud code IDE..."
   
2. Explain each major component
   "The frontend uses Next.js..."
   "The backend uses Convex..."
   
3. Dive into how they connect
   "When user clicks run..."
   
4. Discuss design decisions
   "We chose Convex because..."
   "We cache analyses because..."
   
5. Mention error handling
   "We return safe responses..."
   
6. Conclusion
   "The system is scalable because..."
```

---

### 2. **Technical Diagrams to Draw**

**Diagram 1: System Architecture**
```
NextJS (Frontend)
      ↓ HTTP
Convex Backend
      ↓ Database
NoSQL Database
      ↓
External APIs
```

**Diagram 2: Data Flow (Code Execution)**
```
Editor
  ↓
Zustand Store
  ↓
Convex Action
  ↓
OneCompiler
  ↓
Store Update
  ↓
Output Panel
```

**Diagram 3: Database Relationships**
```
Users
  ├─ Snippets (1-to-many)
  │  └─ Comments (1-to-many)
  │  └─ Stars (many-to-many)
  │
  ├─ RepoAnalyses (1-to-many)
  │  └─ RepoChat (1-to-many)
  │
  └─ Repositories (1-to-many)
     └─ RepositoryFiles
     └─ CachedFileContents
```

---

### 3. **Key Points to Emphasize**

| Point | Why It Matters |
|-------|---------------|
| **Three types of Convex functions** | Shows understanding of backend |
| **Real-time queries** | Shows UI updatesautomatically |
| **Safe error handling** | Shows production-ready thinking |
| **External API integration** | Shows how to combine services |
| **Authentication** | Shows security awareness |
| **Caching analysis results** | Shows performance thinking |
| **Cascade delete** | Shows database integrity |

---

### 4. **Questions You Might Get**

**Q: Why Convex instead of traditional server?**
A: "Convex is serverless backend-as-a-service. We don't manage servers, scaling, or databases. We just write queries/mutations and Convex handles the rest. Much faster to build."

**Q: Why can't we run code directly on your server?**
A: "Security risk. Untrusted user code could gain access to server resources. OneCompiler provides an isolated sandbox. Better practice."

**Q: How do you prevent users from seeing other users' personal data?**
A: "Every query/mutation checks `ctx.auth.getUserIdentity()`. We filter by userId. If someone tries to access another user's snippet, we throw `NOT_AUTHORIZED` error."

**Q: What if Gemini API fails?**
A: "We have error handling that catches the exception and returns a safe error code like `AI_SERVICE_ERROR`. We show user-friendly message in a dialog. No stack trace exposed."

**Q: How do you improve performance?**
A: "We cache repository analyses to avoid re-fetching GitHub data. We use indexes on frequently queried fields (userId). We use localStorage to persist editor state client-side."

**Q: How is real-time update implemented?**
A: "Convex queries have real-time subscriptions. When we use `useQuery(api.snippets.getSnippets)`, React component re-renders whenever database changes. Convex handles WebSocket connections automatically."

---

## Quick Reference Summary

### Technologies
- **Frontend**: Next.js 15, React 19, Tailwind, Monaco Editor
- **Backend**: Convex (queries, mutations, actions)
- **Auth**: Clerk
- **Database**: Convex built-in NoSQL
- **AI**: Gemini API + Ollama
- **Code Execution**: OneCompiler API
- **State**: Zustand
- **UI**: Framer Motion, Lucide Icons

### Core Concepts
- **Queries** = Read-only database access (real-time)
- **Mutations** = Write database access (transactional)
- **Actions** = External async API calls
- **Context** = Auth info (userId, user details)
- **Indexes** = Fast database lookups
- **Safe responses** = Never throw, return {success, error}

### Data Model
- **Users** - Clerk integration
- **Snippets** - Public code sharing
- **Stars** - Many-to-many relationships
- **RepoAnalyses** - Cached GitHub analysis
- **RepoChatHistory** - Conversations scoped to analyses
- **Repositories** - GitHub repo metadata
- **RepositoryFiles** - File tree structure
- **CachedFileContents** - Source code cache

---

## Final Presentation Tips

1. **Start simple, then go deep**
   - Don't overwhelming with details initially
   - Build up complexity progressively

2. **Use real examples**
   - "When user clicks run, here's what happens..."
   - Reference actual code files

3. **Draw diagrams**
   - Visual representation helps understanding
   - Boxes + arrows + labels

4. **Show code snippets**
   - Key snippets printed/displayed
   - Highlight the important parts

5. **Explain the "why"**
   - Why Convex? (serverless)
   - Why multiple files? (organization)
   - Why safe responses? (production-ready)

6. **Mention challenges solved**
   - "We handle private repos by checking auth..."
   - "We prevent cascade delete issues..."
   - "We rate limit API calls..."

7. **Be confident**
   - You understand the entire system now
   - Speak clearly and pace yourself
   - It's okay to draw diagrams during presentation

---

Good luck with your viva! You now understand:
✅ What CompileX does
✅ How it's architected
✅ How data flows through the system
✅ Why each technology was chosen
✅ How to explain it to others

You're ready! 🚀

