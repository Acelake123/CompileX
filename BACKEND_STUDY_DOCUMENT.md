# CompileX Backend Study Document
## A Complete Guide for Backend Developer & QA Engineer

---

## Table of Contents
1. [Convex Backend Fundamentals](#1-convex-backend-fundamentals)
2. [Database Design (Project-Specific)](#2-database-design-project-specific)
3. [Authentication System (Clerk)](#3-authentication-system-clerk)
4. [Snippet System (Backend Logic)](#4-snippet-system-backend-logic)
5. [Code Execution System](#5-code-execution-system)
6. [Repository Analyzer & Chat System](#6-repository-analyzer--chat-system)
7. [Error Handling & Security](#7-error-handling--security)
8. [Backend Data Flow (Complete Flows)](#8-backend-data-flow-complete-flows)
9. [QA / Testing Strategy](#9-qa--testing-strategy)

---

## 1. Convex Backend Fundamentals

### What is Convex?

**Simple Explanation:**
Convex is a **backend-as-a-service (BaaS)** platform that replaces traditional Express/Node.js servers. Instead of managing servers, databases, and APIs manually, Convex provides:
- A **real-time database** (like Firebase but more powerful)
- **Built-in TypeScript functions** that act as API endpoints
- **Automatic client-server communication** through generated code
- **Authentication support** (Clerk, Auth0, etc.)

**Technical Explanation:**
Convex is a serverless backend platform that:
- Runs functions (`queries`, `mutations`, `actions`) on a managed cloud infrastructure
- Uses **Convex Database** (similar to MongoDB) with ACID transactions
- Automatically generates a TypeScript client (`_generated/api`) that connects frontend to backend
- Provides `ctx` (context) object with database access, authentication, and utilities
- Uses **index-based queries** for efficient data retrieval

### Difference Between Queries, Mutations, and Actions

| Type | Purpose | Real-Time | Use Case |
|------|---------|-----------|----------|
| **Query** | Fetch data (READ) | Yes | Get snippets, user profile |
| **Mutation** | Modify data (CREATE/UPDATE/DELETE) | No | Create snippet, star snippet |
| **Action** | External API calls / Heavy processing | No | Code execution via OneCompiler, repo analysis |

```
User Request
    ↓
Is it READ-only? → Query (real-time subscription possible)
    ↓
Is it WRITE? → Mutation (modify database)
    ↓
Does it involve external API? → Action (run on Node.js)
```

### Where Each is Used in CompileX

**Queries** (Data Fetching):
- `getSnippets()` - Get all snippets for explore page
- `getSnippetById()` - Fetch single snippet details
- `getComments()` - Get comments on a snippet
- `getUserExecutions()` - Get code execution history
- `getRepoAnalysis()` - Get saved repository analysis

**Mutations** (Data Modification):
- `createSnippet()` - User creates new code snippet
- `deleteSnippet()` - User deletes their snippet
- `starSnippet()` - User stars/unstars a snippet
- `addComment()` - User adds comment to snippet
- `saveRepoAnalysis()` - Save repository analysis

**Actions** (External Work):
- `executeCode()` - Call OneCompiler API to run code
- `generateRepoChatResponse()` - Call Ollama AI for repo chat
- `fetchAndCacheFileContent()` - Fetch file content from GitHub

### Why Convex Over Traditional Backend?

| Feature | Traditional Backend | Convex |
|---------|-------------------|--------|
| Server Setup | Manual (Express, Docker) | ✅ Managed |
| Database Setup | Manual (MongoDB, PostgreSQL) | ✅ Built-in |
| Real-time Updates | Complex (WebSockets) | ✅ Built-in |
| Authentication | Complex integration | ✅ Built-in (Clerk) |
| API Endpoints | Manual routing | ✅ Auto-generated client |
| Deployment | Complex (Docker, AWS) | ✅ One command |
| Type Safety | Manual types | ✅ Full TypeScript |

**For CompileX, Convex is ideal because:**
- ✅ Real-time snippets feed (Queries update automatically)
- ✅ Instant snippet creation/deletion feedback
- ✅ Easy integration with Clerk authentication
- ✅ Built-in database = no separate MongoDB needed
- ✅ Can call external APIs (OneCompiler, GitHub, Ollama) via Actions

---

## 2. Database Design (Project-Specific)

### Overview of Tables

CompileX has **11 tables** organized into 3 main features:

```
SNIPPET SYSTEM:
  → users
  → snippets
  → snippetComments
  → stars
  → codeExecutions

REPOSITORY ANALYZER:
  → repositories
  → repositoryFiles
  → cachedFileContents
  → repoAnalyses
  → repoChatHistory
```

### Table Breakdown

#### **1. users Table**
**Purpose:** Store user accounts synchronized from Clerk authentication.

**Schema:**
```
_id: Id (auto-generated)
_creationTime: Number (auto)

userId: String (Clerk ID - unique per user)
email: String
name: String
```

**Important Fields:**
- `userId` - **Indexed** for fast lookup. Comes from Clerk's `identity.subject`
- `email` - Used for contact
- `name` - Display name on snippets and comments

**Usage:**
- When user first creates a snippet, system checks if they exist in `users`
- If not, auto-creates user record with their Clerk data
- Used to fetch user's name for snippets and comments

**Example Flow:**
```
Clerk Authentication → JWT Token → identity.subject (userId)
→ Query users table with userId → Get user record
→ Use user.name in snippets
```

---

#### **2. snippets Table**
**Purpose:** Store code snippets created by users.

**Schema:**
```
_id: Id (auto-generated)
_creationTime: Number (auto)

userId: String (Clerk ID)
userName: String (User's name at creation time)
title: String
language: String (javascript, python, etc.)
code: String (actual code content)
```

**Indexes:**
- `by_user_id` on `userId` - For fetching user's own snippets quickly

**Important Fields:**
- `userId` - Links to user, used for ownership check during delete
- `userName` - Cached user name (for faster reads, no join needed)
- `language` - Used for syntax highlighting, filtering
- `code` - Full code content

**Usage:**
- When user explores, the app queries ALL snippets (no filter) and displays them
- When user deletes, system checks `userId === auth.subject` (ownership validation)
- Comments and stars link to snippets via `snippetId`

**Example Query:**
```typescript
// Get all snippets (explore page)
const snippets = await ctx.db.query("snippets").order("desc").collect();

// Get single snippet
const snippet = await ctx.db.get(args.snippetId);

// Get user's snippets
const userSnippets = await ctx.db
  .query("snippets")
  .withIndex("by_user_id")
  .filter((q) => q.eq(q.field("userId"), identity.subject))
  .collect();
```

---

#### **3. snippetComments Table**
**Purpose:** Store comments users write on snippets.

**Schema:**
```
_id: Id
_creationTime: Number

snippetId: Id("snippets") (reference to snippet)
userId: String (who commented)
userName: String (commenter's name)
content: String (HTML content)
```

**Indexes:**
- `by_snippet_id` on `snippetId` - Get all comments for a snippet

**Usage:**
- When user opens a snippet, fetch all comments for that snippet
- When snippet is deleted, cascade delete all its comments (data integrity)
- Comments display with user's name and timestamp

**Cascade Delete Example:**
```typescript
// In deleteSnippet mutation:
const comments = await ctx.db
  .query("snippetComments")
  .withIndex("by_snippet_id")
  .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
  .collect();

for (const comment of comments) {
  await ctx.db.delete(comment._id);
}
```

---

#### **4. stars Table**
**Purpose:** Implement many-to-many relationship between users and snippets.

**Schema:**
```
_id: Id
_creationTime: Number

userId: String (who starred)
snippetId: Id("snippets") (which snippet)
```

**Indexes:**
- `by_user_id` - Get all stars by a user
- `by_snippet_id` - Get all stars on a snippet (for count)
- `by_user_id_and_snippet_id` - **COMPOSITE INDEX** - Check if THIS user starred THIS snippet

**Why Separate Table?**
Instead of adding `starrers: Array<userId>` to snippets:
- ❌ Would create bloat (array grows unbounded)
- ❌ Hard to query "did user X star snippet Y?"
- ✅ Many-to-many table is normalized and efficient

**Usage - Star Toggle Logic:**
```typescript
// Check if user already starred
const existing = await ctx.db
  .query("stars")
  .withIndex("by_user_id_and_snippet_id")
  .filter((q) =>
    q.eq("userId", identity.subject).eq("snippetId", args.snippetId)
  )
  .first();

if (existing) {
  // Already starred → Remove star (toggle OFF)
  await ctx.db.delete(existing._id);
} else {
  // Not starred → Add star (toggle ON)
  await ctx.db.insert("stars", {
    userId: identity.subject,
    snippetId: args.snippetId,
  });
}
```

**This is IMPORTANT for understanding UI state:**
- Click star once → Inserted in stars table → Star is "filled"
- Click again → Deleted from stars table → Star is "empty"

---

#### **5. codeExecutions Table**
**Purpose:** Log every code execution for user's history/stats.

**Schema:**
```
_id: Id
_creationTime: Number

userId: String
language: String
code: String (full code that was executed)
output: String (optional - stdout)
error: String (optional - stderr)
```

**Indexes:**
- `by_user_id` - Get all executions by user (with pagination)

**Usage:**
- When user clicks "Run", after code executes, save result with `saveExecution()` mutation
- Used to show execution history on profile
- Used to compute stats: total executions, favorite language, execution count in 24h

**Stats Example:**
```typescript
// Get user stats
const executions = await ctx.db
  .query("codeExecutions")
  .withIndex("by_user_id")
  .filter((q) => q.eq(q.field("userId"), args.userId))
  .collect();

const last24Hours = executions.filter(
  (e) => e._creationTime > Date.now() - 24 * 60 * 60 * 1000
).length;

const languageStats = executions.reduce((acc, curr) => {
  acc[curr.language] = (acc[curr.language] || 0) + 1;
  return acc;
}, {});
```

---

#### **6. repositories Table**
**Purpose:** Store GitHub repositories analyzed by users.

**Schema:**
```
_id: Id
_creationTime: Number

userId: String
repoUrl: String (https://github.com/owner/repo)
owner: String
name: String
defaultBranch: String
description: String
stars: Number
language: String
lastSyncedAt: Number (timestamp)
```

**Indexes:**
- `by_user_id_and_repo` - Check if user already analyzed this repo

**Usage:**
- When user enters a repo URL, system creates/updates repository record
- Stores basic metadata from GitHub API
- `lastSyncedAt` helps track when repo was last analyzed

---

#### **7. repositoryFiles Table**
**Purpose:** Store file tree structure of repositories.

**Schema:**
```
_id: Id
_creationTime: Number

repositoryId: Id("repositories")
path: String (e.g., "src/components/Button.tsx")
sha: String (Git SHA hash for versioning)
type: String ("file" | "dir")
size: Number
language: String (detected from extension)
```

**Indexes:**
- `by_repository_id` - List all files in repo
- `by_repository_id_and_path` - Get specific file

**Usage:**
- File tree UI displays all files/folders from this table
- Users can click files to view content
- Used in chat context to identify which files to analyze

---

#### **8. cachedFileContents Table**
**Purpose:** Cache GitHub file contents to avoid repeated API calls.

**Schema:**
```
_id: Id
_creationTime: Number

repositoryId: Id("repositories")
path: String (file path)
sha: String (cache key - changes when file is modified)
content: String (actual file content - can be large)
fetchedAt: Number (timestamp)
```

**Indexes:**
- `by_repository_id_and_path` - Check if content already cached

**Why Cache?**
- GitHub API has rate limits (~60 requests/hour without auth)
- File contents are large (storing in DB is faster than repeated API calls)
- Users often view same file multiple times in chat

**Example Flow:**
```
User clicks to view "src/App.tsx"
    ↓
Check cachedFileContents with repositoryId + path
    ↓
Cache hit? → Return cached content (instant)
    ↓
Cache miss? → Fetch from GitHub → Store in cache → Return
```

---

#### **9. repoAnalyses Table**
**Purpose:** Store AI-generated analysis of repositories.

**Schema:**
```
_id: Id
_creationTime: Number

userId: String
repoUrl: String
repositoryId: Id("repositories") (optional - link to repo)
owner: String
repoName: String

metadata: Object {
  owner, name, url, description, stars, language, 
  isPrivate, defaultBranch
}

commits: Object {
  totalCommits: Number,
  recentCommits: Array[{
    message, author, date, hash
  }],
  averageCommitsPerWeek: Number
}

fileStructure: Object {
  Files: Array<String>,
  Directories: Array<String>
}

analysis: Object {
  summary, techStack[], strengths[], weaknesses[],
  suggestedUseCases[], keyFindings, commitActivityOverview,
  timelineInsights
}

readme: String (optional - README content)
analyzedAt: Number (timestamp)
```

**Indexes:**
- `by_user_id` - Get all analyses by user
- `by_user_id_and_repo` - Check if already analyzed
- `by_repository_id` - Link to repository

**Usage:**
- When user analyzes a repo, this stores the AI analysis
- If user re-analyzes same repo, system updates existing record (duplicate prevention)
- Chat history links to this analysis

---

#### **10. repoChatHistory Table**
**Purpose:** Store conversation history for repository AI chat.

**Schema:**
```
_id: Id
_creationTime: Number

repoAnalysisId: Id("repoAnalyses")
userId: String
role: String ("user" | "assistant")
message: String
timestamp: Number

scopeType: String (optional - "repo" | "dir" | "file")
scopePath: String (optional - which file/dir was questioned)
contextFiles: Array<String> (optional - files used as context)
```

**Indexes:**
- `by_repo_analysis_id` - Get all messages for an analysis
- `by_repo_and_user` - Get user's messages in specific analysis

**Usage:**
- User asks question about repo → Create "user" message
- Ollama AI responds → Create "assistant" message
- Scope lets user ask about specific files/directories
- Context files show which files were used for response

---

### Database Relationships & Cardinality

#### **One-to-Many Relationships:**

1. **users → snippets** (One user, many snippets)
```
User (userId="clerk_123")
  → Snippet 1 (userId="clerk_123")
  → Snippet 2 (userId="clerk_123")
  → Snippet 3 (userId="clerk_123")
```
Query: `snippets.filter(userId === "clerk_123")`

2. **snippets → snippetComments** (One snippet, many comments)
```
Snippet (id="snippet_abc")
  → Comment 1 (snippetId="snippet_abc")
  → Comment 2 (snippetId="snippet_abc")
```
Query: `snippetComments.filter(snippetId === "snippet_abc")`

3. **repositories → repositoryFiles** (One repo, many files)
```
Repository (id="repo_123")
  → File1: src/App.tsx
  → File2: src/utils/index.ts
  → Directory1: src/components
```

#### **Many-to-Many Relationships:**

1. **users ↔ snippets** via **stars** (User can star many snippets, Snippet can be starred by many users)
```
User (userId="user_1")        Snippet (id="snippet_1")
  ↓ stars                        ↓ stars
  → Star(user_1, snippet_1)    → Star(user_1, snippet_1)
  ↓                             ↓
User (userId="user_2") ----→ Same Snippet (id="snippet_1")
  → Star(user_2, snippet_1)
```

This allows:
- User to see all their starred snippets: `stars.filter(userId="user_1").map(s => s.snippetId)`
- Snippet to show total stars: `stars.filter(snippetId="snippet_1").count()`
- Check if specific user starred: `stars.first(userId="user_1" AND snippetId="snippet_1")`

---

### Understanding Indexes

#### **What Are Indexes?**
Indexes are **database optimization structures** that speed up queries by creating a sorted lookup table.

Without index:
```
Query: "Find snippet by snippetId"
→ Database scans ALL 10,000 snippets one by one
→ Time: **O(n) → Slow!**
```

With index:
```
Query: "Find snippet by snippetId"
→ Use index like a dictionary
→ Time: **O(log n) → Fast!**
```

#### **Indexes in CompileX**

1. **Single-field indexes** (most common)
```
.index("by_user_id", ["userId"])
→ Optimizes: WHERE userId = "xyz"
→ Used for: Query user's own snippets, executions, analyses
```

2. **Composite indexes** (multiple fields)
```
.index("by_user_id_and_snippet_id", ["userId", "snippetId"])
→ Optimizes: WHERE userId = "x" AND snippetId = "y"
→ Used for: Check if THIS user starred THIS snippet
```

3. **Why each index matters:**

| Index | Table | Purpose | Query Example |
|-------|-------|---------|----------------|
| `by_user_id` | users | Fast user lookup | Find user by Clerk ID |
| `by_user_id` | snippets | Fetch user's snippets | Get all snippets I created |
| `by_user_id` | codeExecutions | User's execution history | Show execution logs |
| `by_snippet_id` | snippetComments | Get comments on snippet | Load snippet detail page |
| `by_snippet_id` | stars | Count snippet's stars | Show star count |
| `by_user_id_and_snippet_id` | stars | **CRITICAL** - Check if starred | Determine if star button is filled |
| `by_repository_id` | repositoryFiles | List files in repo | Show file tree |
| `by_repository_id_and_path` | repositoryFiles | Get specific file | Fetch file by path |
| `by_user_id_and_repo` | repoAnalyses | Check duplicate analysis | Don't re-analyze same repo |

#### **Performance Impact:**
- **Fast Query:** `getSnippets?userId=123` (has index) → ⚡ 10ms
- **Slow Query:** `getSnippet?language=python` (no index) → 🐢 500ms

---

## 3. Authentication System (Clerk)

### How Clerk Authentication Works

**Simple Explanation:**
Clerk is a **third-party authentication service** that handles user signup/login. It:
1. Provides signup/login UI components
2. Issues JWT tokens to authenticated users
3. Lets backend verify users via JWT

### JWT & Identity Explained

**JWT (JSON Web Token):**
A token that says "This is user X, signed by Clerk"

Structure:
```
eyJhbGc.base64_data.signature
Header  Payload    Signature (proves Clerk issued it)

Decoded:
{
  "subject": "user_123xyz",    // unique user ID
  "email": "user@test.com",
  "name": "John Doe",
  "iat": 1234567890            // issued at timestamp
}
```

**Identity in Convex:**
```typescript
const identity = await ctx.auth.getUserIdentity();
// Returns:
{
  subject: "user_123xyz",      // Clerk user ID
  email: "user@test.com",
  name: "John Doe"
}
```

### Authentication Flow in CompileX

```
User visits website
  ↓
Frontend has Clerk provider wrapping entire app
  ↓
User clicks "Sign In" button
  ↓
Clerk shows login modal (hosted UI)
  ↓
User enters email/password or uses OAuth (Google, GitHub)
  ↓
Clerk verifies → Issues JWT token
  ↓
Token stored in browser (httpOnly cookie or localStorage)
  ↓
When user makes API call to Convex:
  ├─ Frontend automatically includes JWT token
  ├─ Convex verifies token with Clerk
  ├─ If valid → `ctx.auth.getUserIdentity()` returns user data
  └─ If invalid → Returns null (user unauthorized)
```

### Authentication Usage in CompileX

#### **Snippet Creation (AUTH_REQUIRED Example)**
```typescript
export const createSnippet = mutation({
  args: { title, language, code },
  handler: async (ctx, args) => {
    // 🔒 Step 1: Get authenticated user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
      // ❌ User not logged in → Reject
    }

    // ✅ Step 2: User is authenticated, use their ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    // 👇 AUTO-CREATE USER IF FIRST TIME
    if (!user) {
      const userId = await ctx.db.insert("users", {
        userId: identity.subject,    // From Clerk JWT
        name: identity.name ?? "Anonymous",
        email: identity.email ?? "",
      });
      user = await ctx.db.get(userId);
    }

    // ✅ Step 3: Create snippet with authenticated user's ID
    return await ctx.db.insert("snippets", {
      userId: identity.subject,      // Ownership verification
      userName: user!.name,
      title: args.title,
      language: args.language,
      code: args.code,
    });
  },
});
```

**Key Points:**
- `identity.subject` = Unique Clerk user ID
- This ID links user to all their snippets, executions, etc.
- If user not authenticated → `identity === null` → Throw error

#### **Ownership Validation (deleteSnippet Example)**
```typescript
export const deleteSnippet = mutation({
  args: { snippetId: v.id("snippets") },
  handler: async (ctx, args) => {
    // Step 1: Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Step 2: Get snippet
    const snippet = await ctx.db.get(args.snippetId);
    if (!snippet) {
      throw new ConvexError("SNIPPET_NOT_FOUND");
    }

    // Step 3: CHECK OWNERSHIP
    if (snippet.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
      // ❌ User trying to delete someone else's snippet
    }

    // ✅ Step 4: User owns it → Delete allowed
    await ctx.db.delete(args.snippetId);
  },
});
```

**Security Logic:**
- Snippet created by `user_123` has `userId = "user_123"`
- When `user_456` tries to delete it:
  - `identity.subject = "user_456"`
  - Snippet.userId = "user_123"
  - Mismatch → `NOT_AUTHORIZED` error
  - Delete rejected ✅

### Frontend Authentication Check

```typescript
// In React component
import { useAuth, useUser } from "@clerk/nextjs";

function ShareSnippetDialog() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Auth is loading...</div>;
  }

  if (!isSignedIn) {
    // Show login prompt
    return <AuthRequiredDialog />;
  }

  // ✅ User is authenticated → Show share dialog
  return <ShareDialog />;
}
```

### Why Authentication is Critical for CompileX

| Security Aspect | Without Auth | With Auth |
|-----------------|-------------|----------|
| **Ownership Control** | Anyone can delete anyone's snippet | Only owner can delete ✅ |
| **Data Privacy** | User sees all users' execution history | User sees only their own ✅ |
| **Spam Protection** | Someone could spam code submissions | Only authenticated = less spam ✅ |
| **User Stats** | Can't track who made what | Accurate per-user stats ✅ |

---

## 4. Snippet System (Backend Logic)

### Complete Snippet System Flow

#### **Feature 1: Create Snippet**

```
FRONTEND:
User enters title, code, language
  ↓
Clicks "Share Snippet"
  ↓
Checks if user authenticated (useAuth hook)
  ↓
If not → Show AuthRequiredDialog
If yes → Call createSnippet mutation

BACKEND - createSnippet Mutation:
┌─────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION CHECK                             │
│    identity = ctx.auth.getUserIdentity()           │
│    if (!identity) throw AUTH_REQUIRED              │
└─────────────────────────────────────────────────────┘
            ↓ User authenticated (identity.subject = "user_123")
┌─────────────────────────────────────────────────────┐
│ 2. USER LOOKUP / AUTO-CREATE                        │
│    query users WHERE userId = identity.subject      │
│    if (no user found) → INSERT user record          │
│    Auto-creates with:                               │
│    - userId: from Clerk JWT                         │
│    - name: from Clerk profile                       │
│    - email: from Clerk profile                      │
└─────────────────────────────────────────────────────┘
            ↓ User exists (or just created)
┌─────────────────────────────────────────────────────┐
│ 3. INSERT SNIPPET INTO DATABASE                     │
│    INSERT into snippets:                            │
│    - userId: identity.subject (ownership)           │
│    - userName: user.name (cached for display)       │
│    - title, language, code: from args               │
│    - _creationTime: auto (timestamp)                │
└─────────────────────────────────────────────────────┘
            ↓ Snippet created (has _id)
FRONTEND:
Receives snippet._id
  ↓
Shows success toast
  ↓
Redirects to /snippets/[id]
  ↓
User can now share link
```

**Code Flow:**
```typescript
// User creates snippet with title="Hello App", language="javascript"
// Backend executes:

const identity = await ctx.auth.getUserIdentity();
// identity = {
//   subject: "user_clerkid_123",
//   email: "user@example.com",
//   name: "John Doe"
// }

let user = await ctx.db.query("users")
  .withIndex("by_user_id")
  .filter((q) => q.eq(q.field("userId"), "user_clerkid_123"))
  .first();
// First time? user = null
// Auto-create user with userId="user_clerkid_123"

const snippetId = await ctx.db.insert("snippets", {
  userId: "user_clerkid_123",        // Links to creator
  userName: "John Doe",               // Cached name
  title: "Hello App",
  language: "javascript",
  code: "console.log('Hello');",
});

// Result: Snippet created with ownership verified ✅
```

#### **Feature 2: Star / Unstar Snippet**

**The Challenge:**
- Multiple users can star same snippet
- Same user should only appear once in stars

**Solution: Many-to-Many Table**
```
User A ──→ ┌─────────────────┐ ←── Snippet 1
User B ──→ │ stars table     │ ←── Snippet 2
User C ──→ │ (userId, snip   │
User A ──→ │  petId pairs)   │
           └─────────────────┘
```

```
FRONTEND:
User clicks star icon
  ↓
If user not authenticated → Show AuthRequiredDialog
If authenticated → Call starSnippet mutation

BACKEND - starSnippet Mutation:
┌─────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION CHECK                             │
│    if (!identity) throw AUTH_REQUIRED              │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ 2. CHECK IF ALREADY STARRED                         │
│    existing = query stars WHERE:                    │
│    - userId = identity.subject                      │
│    - snippetId = args.snippetId                     │
│    (Using composite index for speed)                │
└─────────────────────────────────────────────────────┘
            ↓ Check result
    ┌──────────────┴──────────────┐
    ↓ if exists                    ↓ if not exists
┌─────────────────────┐    ┌──────────────────────┐
│ TOGGLE OFF (Remove) │    │ TOGGLE ON (Add)      │
│ DELETE this star    │    │ INSERT this star     │
│ record              │    │ record               │
└─────────────────────┘    └──────────────────────┘

FRONTEND:
Receives success
  ↓
Update UI: star icon filled/empty
  ↓
Optimistic update (star count ±1)
```

**Star Toggle Example:**
```typescript
// User clicks star on snippet "snippet_456"
// identify = "user_123"

const existing = await ctx.db
  .query("stars")
  .withIndex("by_user_id_and_snippet_id")
  .filter((q) =>
    q.eq("userId", "user_123")
      .eq("snippetId", "snippet_456")
  )
  .first();

// First click: existing = null
if (!existing) {
  // INSERT new star
  await ctx.db.insert("stars", {
    userId: "user_123",
    snippetId: "snippet_456",
  });
}

// Second click: existing = { _id: "star_123", userId, snippetId }
if (existing) {
  // DELETE the star
  await ctx.db.delete(existing._id);
}

// Result: Clean toggle ✅
```

#### **Feature 3: Delete Snippet**

```
FRONTEND:
User clicks delete on their snippet
  ↓
Shows confirmation dialog

BACKEND - deleteSnippet Mutation:
┌──────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION & OWNERSHIP CHECK                 │
│    identity = ctx.auth.getUserIdentity()            │
│    if (!identity) throw AUTH_REQUIRED               │
│                                                      │
│    snippet = get(snippetId)                         │
│    if (!snippet) throw SNIPPET_NOT_FOUND            │
│                                                      │
│    if (snippet.userId !== identity.subject)         │
│      throw NOT_AUTHORIZED   ✅ Ownership Check!     │
└──────────────────────────────────────────────────────┘
            ↓ Owner verified
┌──────────────────────────────────────────────────────┐
│ 2. CASCADE DELETE - RELATED DATA                     │
│                                                      │
│    A. Delete all comments on this snippet           │
│       comments = query WHERE snippetId=target       │
│       for each: delete(comment._id)                 │
│                                                      │
│    B. Delete all stars on this snippet              │
│       stars = query WHERE snippetId=target          │
│       for each: delete(star._id)                    │
└──────────────────────────────────────────────────────┘
            ↓ Dependencies cleaned
┌──────────────────────────────────────────────────────┐
│ 3. DELETE SNIPPET                                    │
│    delete(snippetId)                                │
│                                                      │
│    ✅ No orphaned data in DB                         │
└──────────────────────────────────────────────────────┘

FRONTEND:
Receives success
  ↓
Removes snippet from list
  ↓
Shows success toast
```

**Why Cascade Delete?**
```
Bad (without cascade):
  Delete Snippet → Snippet gone ❌
  Comments still in DB (orphaned)
  Stars still in DB (orphaned)
  = Data integrity broken

Good (with cascade):
  Delete Snippet → Delete related comments → Delete related stars
  = Clean database ✅
```

### Key Concepts

#### **1. Many-to-Many Relationship**

**Problem:**
- One user → many snippets ✅ (easy, just add userId to snippet)
- One snippet → many stars ✅ (easy, just add array)
- **BUT**: Same snippet starred by many users?
  - Can't add userId to snippet (which user?)
  - Can't add array of userIds (violates normalization)

**Solution: Join Table (stars)**
```
Instead of:
Snippet {
  userId, title, code,
  starrers: ["user_1", "user_2", "user_3"]  ❌ Bad
}

Use:
Snippet { userId, title, code }
Stars {
  (user_1, snippet_1),
  (user_2, snippet_1),
  (user_3, snippet_1)
} ✅ Good
```

**Benefits:**
- No duplicate users in stars
- Fast query "did user X star snippet Y?"
- Easy to add/remove stars
- Independent scalability

#### **2. Ownership Validation**

**Pattern:**
```typescript
// Before any modification:
const identity = await ctx.auth.getUserIdentity();
const resource = await ctx.db.get(resourceId);

if (resource.userId !== identity.subject) {
  throw new ConvexError("NOT_AUTHORIZED");
}
```

**Protects Against:**
- User deleting someone else's snippet
- User deleting someone else's comment
- Unauthorized modifications

#### **3. Data Integrity / Cascade Operations**

**When deleting snippet, MUST delete:**
- Comments referencing it (by snippetId)
- Stars referencing it (by snippetId)

**If skipped:**
- Comments become orphaned (reference non-existent snippet)
- Query for stars on deleted snippet returns data for non-existent snippet
- DB becomes inconsistent

```typescript
// The right way:
for (const comment of comments) {
  await ctx.db.delete(comment._id);
}
for (const star of stars) {
  await ctx.db.delete(star._id);
}
await ctx.db.delete(snippet._id);
// ✅ All deleted atomically
```

---

## 5. Code Execution System

### Complete Code Execution Flow

#### **High-Level Architecture**

```
┌──────────────────────────────────────────────────────┐
│ FRONTEND (React Component)                           │
│                                                      │
│ User writes code in Monaco Editor                    │
│ Clicks "Run" button                                  │
└────────────────────┬─────────────────────────────────┘
                     │ Calls executeCode action
                     ↓
┌──────────────────────────────────────────────────────┐
│ CONVEX ACTION (Node.js Backend)                      │
│                                                      │
│ executeCode(language, code)                          │
│ - Maps language to OneCompiler ID                    │
│ - Calls OneCompiler API                              │
│ - Returns { success, output, error }                 │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP POST
                     ↓
┌──────────────────────────────────────────────────────┐
│ ONECOMPILER SERVICE (External Sandbox)               │
│                                                      │
│ Receives: { language, files: [{ content }] }         │
│ Executes code in isolated sandbox                    │
│ Returns: { status, stdout, stderr }                  │
└────────────────────┬─────────────────────────────────┘
                     │ Response
                     ↓
┌──────────────────────────────────────────────────────┐
│ CONVEX ACTION (continues)                            │
│                                                      │
│ Parses response:                                     │
│ - Normal output → output field                       │
│ - Error message → error field                        │
│                                                      │
│ Returns to frontend                                  │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│ FRONTEND (Zustand Store Updated)                     │
│                                                      │
│ { success, output, error, executionTime }            │
│ Updates UI: show output or error in OutputPanel      │
│ Optional: Save to codeExecutions mutation            │
└──────────────────────────────────────────────────────┘
```

#### **Step-by-Step User Experience**

```
STEP 1: User writes code
┌─────────────────────────────┐
│ console.log('Hello, World') │
└─────────────────────────────┘
  ↓ Stored in localStorage
  ↓ (Editor Component saves on change)

STEP 2: User clicks "Run"
  ↓
  Zustand store → setRunning(true)
  ↓
  OutputPanel shows loading skeleton

STEP 3: Frontend calls backend
  ↓
  const result = await executeCode({
    language: "javascript",
    code: "console.log('Hello, World')"
  })

STEP 4: Backend (Convex Action)
  ↓
  Receives language & code
  ↓
  Maps "javascript" → "javascript" (OneCompiler ID)
  ↓
  Creates:
    {
      language: "javascript",
      files: [{
        name: "main.js",
        content: "console.log('Hello, World')"
      }]
    }
  ↓
  Calls: POST https://api.onecompiler.com/v1/run

STEP 5: OneCompiler executes
  ↓
  Runs code in isolated environment (sandbox)
  ↓
  Captures stdout: "Hello, World"
  ↓
  Returns:
    {
      status: "success",
      stdout: "Hello, World\n",
      stderr: ""
    }

STEP 6: Backend processes response
  ↓
  Formats to:
    {
      success: true,
      output: "Hello, World",
      error: null
    }
  ↓
  Returns to frontend

STEP 7: Frontend updates UI
  ↓
  Store: setOutput("Hello, World"), setError(null)
  ↓
  OutputPanel renders:
    ✅ Execution Successful
    Hello, World

STEP 8: Optional - Save execution
  ↓
  Call saveExecution mutation:
    {
      language: "javascript",
      code: "console.log('Hello, World')",
      output: "Hello, World",
      error: null
    }
  ↓
  Stored in codeExecutions table
  ↓
  User can view history on profile
```

### Backend: executeCode Action Deep Dive

```typescript
"use node";  // ← Run in Node.js environment (not browser)

import { action } from "./_generated/server";
import { v } from "convex/values";

// Language mapping: CompileX ID → OneCompiler ID
const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  go: "go",
  rust: "rust",
  cpp: "cpp",
  csharp: "csharp",
};

// File extensions for creating proper filenames
const FILE_EXTENSIONS: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  // ... etc
};

export const executeCode = action({
  args: {
    language: v.string(),
    code: v.string(),
  },
  handler: async (_, args) => {
    const { language, code } = args;

    // 🔑 KEY INSIGHT: Actions run on Node.js server
    // So we can make external API calls securely

    // Step 1: Get API key from environment
    const apiKey = process.env.ONECOMPILER_API_KEY;
    if (!apiKey) {
      throw new Error("ONECOMPILER_API_KEY not configured");
    }

    // Step 2: Validate language support
    const oneCompilerLanguage = LANGUAGE_MAP[language];
    if (!oneCompilerLanguage) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Step 3: Get file extension
    const fileExtension = FILE_EXTENSIONS[language];
    const fileName = `main.${fileExtension}`;

    // Step 4: Call OneCompiler API
    try {
      const response = await fetch("https://api.onecompiler.com/v1/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          language: oneCompilerLanguage,
          files: [{
            name: fileName,
            content: code,
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OneCompiler API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      // Step 5: Parse response
      const result = await response.json();

      // Step 6: Normalize response format
      return {
        success: result.status === "success" || result.statusCode === 200,
        output: result.stdout || result.output || "",
        error: result.stderr || result.error || null,
        executionTime: result.executionTime || 0,
      };

    } catch (error) {
      // Step 7: Error handling
      console.error("Code execution error:", error);
      return {
        success: false,
        output: "",
        error: error instanceof Error 
          ? error.message 
          : "Unknown error occurred",
        executionTime: 0,
      };
    }
  },
});
```

### Frontend: Code Execution Flow

```typescript
// In useCodeEditorStore.ts (Zustand store)

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
  return {
    // ... state fields
    output: "",
    error: null,
    isRunning: false,

    // Main function called on "Run"
    runCode: async (executeCodeAction: any) => {
      const { language, getCode } = get();
      const code = getCode();

      // Step 1: Validation
      if (!code) {
        set({ error: "Please enter some code" });
        return;
      }

      // Step 2: Set running state (shows skeleton in UI)
      set({ isRunning: true, error: null, output: "" });

      try {
        // Step 3: Call backend action
        const result = await executeCodeAction({ language, code });
        // ↑ This calls Convex action (compiled to HTTP call)

        // Step 4: Process response
        const output = result.output?.trim()
          ? result.output.trim()
          : result.error?.trim()
          ? result.error.trim()
          : "";

        if (!output) {
          set({
            error: "No output returned.",
            executionResult: { code, output: "", error: "No output..." },
          });
          return;
        }

        // Step 5: Check for stderr (error state)
        if (result.error?.trim() && !result.output?.trim()) {
          set({
            error: result.error.trim(),
            output: "",
            executionResult: { code, output: "", error: result.error.trim() },
          });
          return;
        }

        // Step 6: Success (has stdout)
        set({
          output,
          error: null,
          executionResult: { code, output, error: null },
        });

      } catch (error) {
        // Step 7: Network or other errors
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Error running code";
        set({
          error: errorMessage,
          executionResult: { code, output: "", error: errorMessage },
        });
      } finally {
        // Always done loading
        set({ isRunning: false });
      }
    },
  };
});
```

### Why Each Technology Choice

#### **Why OneCompiler (External Service)?**

❌ **Don't execute user code directly on our server:**
- User submits `rm -rf /` → Could delete our server files
- User submits infinite loop → Freezes our server
- Security risk!

✅ **Use OneCompiler (Isolated Sandbox):**
- Each execution runs in container (isolated)
- Resource limits applied (CPU, memory, timeout)
- No access to our server files
- If malicious code crashes, only that container dies

#### **Why Convex Action (Not Query/Mutation)?**

| Type | External API? | Async? | Long-running? |
|------|---------------|--------|---------------|
| Query | ❌ No | ✅ Sync | ❌ Should be fast |
| Mutation | ❌ No | ❌ Sync | ❌ Should be fast |
| **Action** | ✅ Yes | ✅ Async | ✅ Can wait |

Code execution:
- Takes 2-5 seconds (long)
- Calls external API (OneCompiler)
- Could fail → needs error handling
- **→ Must be Action** ✅

### Error Handling in Code Execution

```
Success Scenarios:
┌─────────────────────────────────────────┐
│ 1. Normal output                        │
│    stdout: "Hello World"                │
│    stderr: ""                           │
│    → Return { success: true, output }   │
│                                         │
│ 2. Expected error (syntax, runtime)     │
│    stdout: ""                           │
│    stderr: "SyntaxError: ..."           │
│    → Return { success: false, error }   │
│                                         │
│ 3. No output (program ran, no print)    │
│    stdout: ""                           │
│    stderr: ""                           │
│    → Return { error: "No output..." }   │
└─────────────────────────────────────────┘

API Error Scenarios:
┌─────────────────────────────────────────┐
│ 1. OneCompiler API down (502 error)     │
│    → Catch in try/catch                 │
│    → Return error message               │
│                                         │
│ 2. Invalid language                     │
│    → Throw Error before API call        │
│                                         │
│ 3. Missing API key                      │
│    → Throw Error (config issue)         │
└─────────────────────────────────────────┘
```

---

## 6. Repository Analyzer & Chat System

### Repository Analysis Flow

```
FRONTEND:
User enters GitHub URL: https://github.com/torvalds/linux

Backend Actions (Server Functions):
1. parseGitHubUrl() - Extract owner/repo
2. fetchRepositoryMetadata() - Get repo info from GitHub
3. Analyze repository structure, commits, tech stack
4. Save analysis to database
5. User can chat with AI about the repo

Database Flow:
repositories table ← Basic repo info
repoAnalyses table ← Detailed analysis (AI-generated)
repositoryFiles table ← File tree
cachedFileContents table ← File content cache
repoChatHistory table ← Conversation history
```

### Step-by-Step: Analyzing a Repository

```
STEP 1: USER SUBMITS REPO URL
Frontend: input = "https://github.com/torvalds/linux"

STEP 2: PARSE URL (Frontend Server Action)
parseGitHubUrl("https://github.com/torvalds/linux")
  ↓
Split path: ["torvalds", "linux"]
  ↓
Return { owner: "torvalds", repo: "linux" }

STEP 3: FETCH REPO METADATA (Frontend Server Action)
fetchRepositoryMetadata("torvalds", "linux")
  ↓
POST https://api.github.com/repos/torvalds/linux
  ↓
Parse response:
{
  name: "linux",
  description: "Linux kernel source tree",
  stargazers_count: 150000,
  language: "C",
  default_branch: "master",
  private: false
}
  ↓
Return GitHubRepo object

STEP 4: FETCH COMMITS (Frontend Server Action)
GET https://api.github.com/repos/torvalds/linux/commits
  ↓
Extract:
- Total commit count
- Recent commits (message, author, date)
- Calculate average commits/week
  ↓
Return commits metadata

STEP 5: FETCH FILE STRUCTURE (Frontend Server Action)
GET https://api.github.com/repos/torvalds/linux/contents
  ↓
Recursively traverse file tree
  ↓
Build: { Files: [...], Directories: [...] }

STEP 6: GENERATE AI ANALYSIS (Backend Action)
Ollama generates analysis:
- Tech stack: ["C", "Assembly"]
- Strengths: [...]
- Weaknesses: [...]
- Use cases: [...]

STEP 7: SAVE TO DATABASE (Mutation)
Call saveRepoAnalysis:
  ↓
Check if user already analyzed this repo:
  uniqueKey = (userId, repoUrl)
  ↓
If exists: UPDATE repoAnalyses
If not: INSERT new repoAnalyses
  ↓
Store:
{
  userId: (authenticated user)
  repoUrl: "https://..."
  owner, repoName: extracted
  metadata: { ...github data }
  commits: { total, recent, average }
  fileStructure: { files, dirs }
  analysis: { summary, techStack, etc }
  readme: (if available)
  analyzedAt: current timestamp
}

FRONTEND:
Receives repoAnalysisId
  ↓
Displays analysis report
  ↓
User can now chat about repo
```

### Repository Chat System

```
USER: "What is this project?"
  ↓
Frontend sends:
{
  repoAnalysisId: "analysis_123",
  repositoryId: "repo_456",
  userMessage: "What is this project?",
  scopeType: "repo",
  scopePath: null
}
  ↓
BACKEND ACTION: generateRepoChatResponse

Step 1: AUTHENTICATION
  identity = ctx.auth.getUserIdentity()
  if (!identity) throw AUTH_REQUIRED

Step 2: AUTHORIZATION
  Verify user owns this analysis
  if (analysis.userId !== identity.subject) throw NOT_AUTHORIZED

Step 3: BUILD CONTEXT
  Get repository files list
  Get chat history (for context)
  If scopeType="file": Load specific file content (from cache)
  If scopeType="repo": Load all files structure
  If scopeType="dir": Load directory files

Step 4: CALL OLLAMA LLM
  Build prompt:
  "You are a code analyzer.
   Repository: [repo name]
   Analysis: [previous analysis]
   Files: [file list]
   
   User asks: [userMessage]"
  
  Send to Ollama local model
  Get response back

Step 5: SAVE MESSAGE
  Create 2 records in repoChatHistory:
  1. User message:
     {
       repoAnalysisId, userId,
       role: "user",
       message: userMessage,
       timestamp: now()
     }
  2. Assistant message:
     {
       repoAnalysisId, userId,
       role: "assistant",
       message: aiResponse,
       timestamp: now()
     }

Step 6: RETURN TO FRONTEND
  Return aiResponse
  Frontend appends to chat UI
  Preserves conversation context
```

### Caching Strategy for Files

**Problem:** Files can be large, GitHub API has rate limits

**Solution:**
```
User requests file content
  ↓
Check cachedFileContents table:
  WHERE repositoryId = ? AND path = ?
  ↓
  Cache HIT? 
    ↓ YES → Return cached content (instant)
    ↓ NO → Fetch from GitHub → Cache → Return
  ↓
Later, same user asks for same file
  ↓
  Returns from cache (no API call)
```

**Cache Key:** `(repositoryId, path)`
- Each file has unique path in repo
- If file modified on GitHub, SHA changes
- Next fetch of modified file is still cached (acceptable tradeoff)

---

## 7. Error Handling & Security

### Backend Error Handling Pattern

**CompileX uses structured error responses:**

```typescript
// ❌ Bad (throwing raw errors)
throw new Error("User not found");

// ✅ Good (Convex style)
throw new ConvexError("AUTH_REQUIRED");
throw new ConvexError("NOT_AUTHORIZED");
throw new ConvexError("SNIPPET_NOT_FOUND");
```

### Common Backend Errors

#### **1. AUTH_REQUIRED**
**When:** User not authenticated (identity is null)
**Cause:** User not logged in, JWT expired
**Response:** Frontend shows login dialog
**Example:**
```typescript
if (!identity) {
  throw new ConvexError("AUTH_REQUIRED");
}
```

#### **2. NOT_AUTHORIZED**
**When:** Authenticated but not allowed to access resource
**Cause:** 
- User trying to delete someone else's snippet
- User trying to access private repo they don't own
**Response:** Frontend shows "Access Denied" error
**Example:**
```typescript
if (snippet.userId !== identity.subject) {
  throw new ConvexError("NOT_AUTHORIZED");
}
```

#### **3. SNIPPET_NOT_FOUND**
**When:** Requested snippet doesn't exist
**Cause:**
- Snippet ID is invalid
- Snippet was deleted
- URL points to non-existent snippet
**Response:** Frontend shows "404 Not Found"
**Example:**
```typescript
const snippet = await ctx.db.get(args.snippetId);
if (!snippet) {
  throw new ConvexError("SNIPPET_NOT_FOUND");
}
```

### Frontend Error Handling Display

```typescript
// In OutputPanel component
if (isRunning) {
  // Show loading skeleton
  return <RunningCodeSkeleton />;
}

if (error) {
  // Show error with icon
  return (
    <div className="text-red-400">
      <AlertTriangle />
      <pre>{error}</pre>
    </div>
  );
}

if (output) {
  // Show success with output
  return (
    <div className="text-emerald-400">
      <CheckCircle />
      <pre>{output}</pre>
    </div>
  );
}

// Default: no output yet
return <div>Run your code to see output...</div>;
```

### Security Practices

#### **1. Ownership Validation**

**Always verify user owns resource before deletion:**

```typescript
// ✅ Correct
const snippet = await ctx.db.get(args.snippetId);
if (snippet.userId !== identity.subject) {
  throw new ConvexError("NOT_AUTHORIZED");
}
await ctx.db.delete(args.snippetId);

// ❌ Wrong: No ownership check
await ctx.db.delete(args.snippetId);  // Anyone can delete!
```

#### **2. Authentication Before Mutation**

**All mutations that modify user data MUST check auth:**

```typescript
// ✅ Correct: Check auth first
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new ConvexError("AUTH_REQUIRED");
}
// Then create/modify/delete

// ❌ Wrong: No auth check
await ctx.db.insert("snippets", { /* ... */ });  // Public insert!
```

#### **3. Code Execution in Sandbox**

**Never execute user code on our server:**

```typescript
// ✅ Correct: Use OneCompiler (sandboxed)
const result = await fetch("https://api.onecompiler.com/v1/run", {
  // Execute in isolated environment
});

// ❌ Wrong: eval() on our server
eval(userCode);  // 🚨 DANGEROUS!
```

#### **4. API Key Security**

**Store sensitive keys in environment variables, not code:**

```typescript
// ✅ Correct
const apiKey = process.env.ONECOMPILER_API_KEY;  // From .env

// ❌ Wrong
const apiKey = "sk_live_12345...";  // Hardcoded in code!
```

#### **5. Data Isolation**

**Each user only sees their own data:**

```typescript
// ✅ Correct: Filter by userId
const userSnippets = await ctx.db
  .query("snippets")
  .withIndex("by_user_id")
  .filter((q) => q.eq(q.field("userId"), identity.subject))  // Current user only
  .collect();

// ❌ Wrong: Return all snippets
const allSnippets = await ctx.db.query("snippets").collect();  // Public!
```

### Error Response Format

**Convex automatically formats errors:**

Frontend receives:
```json
{
  "type": "ConvexError",
  "message": "AUTH_REQUIRED"
}
```

Frontend handles:
```typescript
try {
  await deleteSnippet(snippetId);
} catch (error) {
  if (error.message === "AUTH_REQUIRED") {
    showLoginDialog();
  } else if (error.message === "NOT_AUTHORIZED") {
    showAccessDeniedDialog();
  } else {
    showGenericError(error.message);
  }
}
```

### Why This Error Pattern Matters

| Aspect | Without Proper Errors | With Convex Errors |
|--------|---------------------|-------------------|
| **User Experience** | Crashes silently | Clear error messages |
| **Debugging** | Hard to trace | Specific error codes |
| **Security** | Leaks implementation details | Shows only necessary info |
| **Frontend Logic** | Can't react to different errors | Can handle errors specifically |

---

## 8. Backend Data Flow (Complete Flows)

### Flow 1: Complete Code Execution Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ START: User has code in editor                                  │
└─────────────────────────────────────────────────────────────────┘

FRONTEND - EditorPanel Component:
  ↓ User clicks "Run" button
  ↓ Calls RunButton component onClick handler
  ↓
  ┌─────────────────────────────────────────┐
  │ store.runCode(executeCodeAction)        │
  │ where executeCodeAction is Convex call  │
  └─────────────────────────────────────────┘
      ↓ Gets current language & code from editor
      ↓ Sets store.isRunning = true (show skeleton)
      ↓ Clears previous output/error

FRONTEND - Zustand Store:
  ↓ runCode function executes
  ↓ Prepares:
  │   {
  │     language: "javascript",
  │     code: "console.log('Hello World')"
  │   }
  ↓ Calls action: await executeCodeAction({...})
      ↓
      ↓ This is HTTP call to backend
      ↓ Browser includes auth token automatically

BACKEND - Convex Action (executeCode):
  ↓ Node.js server receives request
  ↓ handler function starts:
  │   1. Get ONECOMPILER_API_KEY from env
  │   2. Map language: "javascript" → "javascript"
  │   3. Get file extension: ".js"
  │   4. Build request body:
  │      {
  │        language: "javascript",
  │        files: [{
  │          name: "main.js",
  │          content: "console.log('Hello World')"
  │        }]
  │      }
  ↓ POST to OneCompiler API:
  │   curl -X POST https://api.onecompiler.com/v1/run \
  │   -H "X-API-Key: xxx" \
  │   -H "Content-Type: application/json" \
  │   -d '{...}'

ONECOMPILER SERVICE (Isolated Sandbox):
  ↓ Receives request
  ↓ Spins up Docker container with Node.js
  ↓ Creates file "main.js"
  ↓ Executes: node main.js
  ↓ Captures stdout: "Hello World\n"
  ↓ Captures stderr: "" (no error)
  ↓ Records execution time: 45ms
  ↓ Returns:
  │   {
  │     status: "success",
  │     stdout: "Hello World\n",
  │     stderr: "",
  │     executionTime: 45
  │   }

BACKEND - Continues after API response:
  ↓ Process response:
  │   success = true
  │   output = "Hello World"
  │   error = null
  ↓ Return to frontend:
  │   {
  │     success: true,
  │     output: "Hello World",
  │     error: null,
  │     executionTime: 45
  │   }

FRONTEND - Zustand Store (receives response):
  ↓ In runCode's try block:
  │   result = {
  │     success: true,
  │     output: "Hello World",
  │     error: null
  │   }
  ↓ Logic:
  │   output = result.output.trim() = "Hello World" ✓
  │   has output ✓
  │   no error ✓
  │   → SUCCESS STATE
  ↓ Update store:
  │   {
  │     output: "Hello World",
  │     error: null,
  │     isRunning: false,
  │     executionResult: {
  │       code: "...",
  │       output: "Hello World",
  │       error: null
  │     }
  │   }

FRONTEND - OutputPanel Component:
  ↓ Store subscription notified
  ↓ Re-renders:
  │   <div className="text-emerald-400">
  │     <CheckCircle /> Execution Successful
  │   </div>
  │   <pre>Hello World</pre>

FRONTEND - Optional: Save Execution (User clicks save):
  ↓ Call saveExecution mutation:
  │   {
  │     language: "javascript",
  │     code: "console.log('Hello World')",
  │     output: "Hello World",
  │     error: null
  │   }

BACKEND - saveExecution Mutation:
  ↓ Authenticate user
  │   identity = ctx.auth.getUserIdentity()
  ↓ Insert into codeExecutions:
  │   {
  │     userId: identity.subject,
  │     language: "javascript",
  │     code: "...",
  │     output: "Hello World",
  │     error: null
  │   }
  ↓ Return success

FRONTEND - Toast Notification:
  ↓ Show: "Execution saved to history"

┌─────────────────────────────────────────────────────────────────┐
│ END: Code executed, result shown, optionally saved              │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Complete Snippet Creation & Sharing

```
┌─────────────────────────────────────────────────────────────────┐
│ START: User wants to save & share code as snippet               │
└─────────────────────────────────────────────────────────────────┘

FRONTEND - EditorPanel Component:
  ↓ User clicks "Share" button
  ↓
  ┌──────────────────────────────────────────────┐
  │ Check: Is user authenticated?                │
  │ const { isLoaded, isSignedIn } = useAuth()   │
  └──────────────────────────────────────────────┘
      ↓
      If !isSignedIn:
        ↓ Show AuthRequiredDialog
        ↓ User clicks "Sign in"
        ↓ Clerk modal opened
        ↓ User authenticates
        ↓ Token set in browser
        ↓ AuthRequiredDialog closes
        ↓ Continue below
      
      If isSignedIn:
        ↓ Continue below

FRONTEND - ShareSnippetDialog opens:
  ↓ User enters:
  │   Title: "Hello World App"
  │   Description: (optional)
  ↓ Gets current code from store:
  │   {
  │     title: "Hello World App",
  │     code: "console.log('Hello World')",
  │     language: "javascript"
  │   }
  ↓ Clicks "Create Snippet"
  ↓ Calls mutation: createSnippet({...})

BACKEND - createSnippet Mutation:
  ↓ handler function:
  │
  │ Step 1: AUTHENTICATE
  │   identity = ctx.auth.getUserIdentity()
  │   // identity = {
  │   //   subject: "user_clerkid_abc123",
  │   //   name: "John Doe",
  │   //   email: "john@example.com"
  │   // }
  │   if (!identity) throw AUTH_REQUIRED ✓ Authenticated
  │
  │ Step 2: GET OR CREATE USER
  │   user = query users WHERE userId = identity.subject
  │
  │   First time? → user = null
  │     → INSERT into users:
  │        {
  │          userId: "user_clerkid_abc123",
  │          name: "John Doe",
  │          email: "john@example.com"
  │        }
  │     → User record created in DB
  │
  │   Repeat visit? → user exists
  │     → Skip insert, use existing user
  │
  │ Step 3: CREATE SNIPPET
  │   INSERT into snippets:
  │   {
  │     userId: "user_clerkid_abc123",     ← OWNERSHIP
  │     userName: "John Doe",              ← Cached
  │     title: "Hello World App",
  │     code: "console.log('Hello World')",
  │     language: "javascript",
  │     _creationTime: <auto>              ← Current timestamp
  │   }
  │   ← Returns snippetId: "snippet_xyz789"

BACKEND - Response:
  ↓ Returns: { success: true, snippetId: "snippet_xyz789" }

FRONTEND - ShareSnippetDialog:
  ↓ Receives snippetId
  ↓ Shows success: "Snippet created!"
  ↓ Generates share link: /snippets/snippet_xyz789
  ↓ Shows copy-to-clipboard button
  ↓ Closes dialog

FRONTEND - Optional: User shares link:
  ↓ Copies link
  ↓ Sends to friend
  ↓ Friend opens /snippets/snippet_xyz789

FRONTEND - SnippetPage Component:
  ↓ Fetches snippet by ID
  │   Call: getSnippetById(snippetId)
  ↓
  ├─ BACKEND Query: getSnippetById
  │   ↓ Get snippet record:
  │   {
  │     _id: "snippet_xyz789",
  │     userId: "user_clerkid_abc123",
  │     userName: "John Doe",
  │     title: "Hello World App",
  │     code: "console.log('Hello World')",
  │     language: "javascript",
  │     _creationTime: 1704067200000
  │   }
  │   ↓ Return to frontend
  │
  ├─ BACKEND Query: getComments
  │   ↓ Query snippetComments WHERE snippetId = "snippet_xyz789"
  │   ↓ Return all comments
  │
  └─ BACKEND Query: Check if I starred
      ↓ If friend authenticated:
        │ Check stars WHERE:
        │   userId = friend_identity.subject
        │   snippetId = "snippet_xyz789"
        │ If exists → Star is "filled"
        │ If not → Star is "empty"

FRONTEND - Display Snippet:
  ↓ Show:
  │   Title: "Hello World App"
  │   By: John Doe
  │   Code: (highlighted)
  │   Comments: [...]
  │   Star count
  │   Share buttons

USER INTERACTION - Friend stars snippet:
  ↓ Clicks star icon
  ↓ Checks if authenticated (useAuth)
  ↓ If yes → Call starSnippet mutation

BACKEND - starSnippet Mutation:
  ↓ Authenticate friend:
  │   identity.subject = "friend_clerkid_def456"
  │
  │ Check existing star:
  │   existing = query stars WHERE:
  │     userId = "friend_clerkid_def456"
  │     snippetId = "snippet_xyz789"
  │   ← Result: null (no star yet)
  │
  │ Add star:
  │   INSERT into stars:
  │   {
  │     userId: "friend_clerkid_def456",
  │     snippetId: "snippet_xyz789"
  │   }

BACKEND - Query Updates (auto via subscription):
  ↓ SnippetPage queries star count automatically
  ↓ Count increases by 1
  ↓ UI updates (real-time)

┌─────────────────────────────────────────────────────────────────┐
│ END: Snippet created, shared, discovered, and starred          │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: Star/Unstar Toggle

```
┌──────────────────────────────────────────────────┐
│ SCENARIO: User clicks star on snippet view page  │
└──────────────────────────────────────────────────┘

FRONTEND - SnippetCard Component:
  ↓ User clicks star icon
  ↓ Icon shows loading state
  ↓ Calls: starSnippet({ snippetId: "snippet_123" })

BACKEND - starSnippet Mutation:

First Click (before any stars):
  ↓ Authenticate:
  │   identity = ctx.auth.getUserIdentity()
  │   identity.subject = "user_abc"
  ↓
  ↓ Check if already starred:
  │   existing = query stars WHERE:
  │     userId = "user_abc" AND
  │     snippetId = "snippet_123"
  │   using index: by_user_id_and_snippet_id
  │   ← Result: null (no existing star)
  ↓
  ↓ Insert new star:
  │   INSERT into stars:
  │   {
  │     userId: "user_abc",
  │     snippetId: "snippet_123"
  │   }
  │   ← Star record created

Second Click (now star exists):
  ↓ Authenticate:
  │   identity.subject = "user_abc"
  ↓
  ↓ Check if already starred:
  │   existing = query stars WHERE:
  │     userId = "user_abc" AND
  │     snippetId = "snippet_123"
  │   ← Result: { _id: "star_xyz", userId, snippetId }
  ↓
  ↓ Delete existing star:
  │   DELETE star WHERE _id = "star_xyz"
  │   ← Star record deleted

COMPOSITE INDEX BENEFIT:
  ↓ Index: by_user_id_and_snippet_id
  ↓ Makes this query FAST:
  │   "Find: (this_user, this_snippet)"
  │   Without index: Scan ALL stars (slow)
  │   With index: Hash lookup (instant)

FRONTEND - Subscribe to changes:
  ↓ Star count query re-runs automatically
  ↓ New count: 5 → 6 (or 6 → 5)
  ↓ UI updates:
  │   Star icon: empty → filled (or filled → empty)
  │   Count: updates
  ↓ Icon loading state removed

USER EXPERIENCE:
  ↓ Click star
  │   ↓ Icon fills / unfills
  │   ↓ Count updates
  │   ↓ All instant (no loading)
  └─ Real-time feedback

└──────────────────────────────────────────────────┘
```

---

## 9. QA / Testing Strategy

### Testing Approach for Backend

#### **1. Functional Testing**

**Test: createSnippet - Happy Path**
```typescript
Test: "User creates snippet successfully"
  
Setup:
  - User authenticated (mock Clerk identity)
  - Database empty

Execute:
  - Call createSnippet({
      title: "Test Snippet",
      language: "javascript",
      code: "console.log('test')"
    })

Verify:
  - ✅ Snippet inserted with correct data
  - ✅ userId set to authenticated user
  - ✅ userName populated correctly
  - ✅ Returns snippetId
  - ✅ User record exists (auto-created)
```

**Test: createSnippet - Authentication Required**
```typescript
Test: "Unauthenticated user cannot create snippet"

Setup:
  - User not authenticated (identity = null)

Execute:
  - Call createSnippet({...})

Verify:
  - ❌ Should throw ConvexError("AUTH_REQUIRED")
  - ✅ No snippet inserted
  - ✅ No user record created
```

#### **2. API Validation Testing**

**Test: Invalid Language**
```typescript
Test: "Code execution with unsupported language"

Setup:
  - Language: "cobol" (not supported)

Execute:
  - Call executeCode({ language: "cobol", code: "..." })

Verify:
  - ❌ Should throw error
  - ✅ Message: "Unsupported language: cobol"
  - ✅ No API call to OneCompiler
```

**Test: Code Execution Error Handling**
```typescript
Test: "Syntax error in code execution"

Setup:
  - Code: "console.log('unclosed string"
  - Language: "javascript"

Execute:
  - Call executeCode({...})
  - OneCompiler returns stderr

Verify:
  - ✅ success: false
  - ✅ error contains: "SyntaxError"
  - ✅ output: ""
  - ✅ Frontend shows error message
```

#### **3. Authentication & Authorization Testing**

**Test: Ownership Validation - Delete Snippet**
```typescript
Test: "User cannot delete another user's snippet"

Setup:
  - Snippet created by user_123
  - Current user: user_456 (authenticated)

Execute:
  - Call deleteSnippet(snippetId)

Verify:
  - ❌ Should throw ConvexError("NOT_AUTHORIZED")
  - ✅ Snippet not deleted
```

**Test: Ownership Validation - Star Snippet**
```typescript
Test: "User can star any snippet (no ownership check needed)"

Setup:
  - Snippet created by user_123
  - Current user: user_456

Execute:
  - Call starSnippet(snippetId)

Verify:
  - ✅ Star inserted successfully
  - ✅ users.stars shows (user_456, snippetId)
```

#### **4. Edge Case Testing**

**Test: Cascade Delete - Comments**
```typescript
Test: "Deleting snippet deletes all comments"

Setup:
  - Snippet with 3 comments

Execute:
  - Call deleteSnippet(snippetId)

Verify:
  - ✅ Snippet deleted
  - ✅ All 3 comments deleted
  - ✅ Comment query returns empty array
```

**Test: Star Toggle - Idempotency**
```typescript
Test: "Multiple star toggles work correctly"

Setup:
  - Snippet initially unstarred

Execute:
  - Star (insert) ✓
  - Star again (delete) ✓
  - Star again (insert) ✓
  - Star again (delete) ✓

Verify:
  - After odd clicks: starred ✓
  - After even clicks: unstarred ✓
  - Each toggle succeeds
  - No duplicates in stars table
```

**Test: Empty Code Execution**
```typescript
Test: "Execution with empty code"

Setup:
  - Code: ""
  - Language: "javascript"

Execute:
  - Frontend calls store.runCode()

Verify:
  - ✅ Frontend validation catches empty code
  - ✅ Error: "Please enter some code"
  - ❌ No backend call made
```

#### **5. Data Integrity Testing**

**Test: Many-to-Many Relationships**
```typescript
Test: "Star relationship maintains integrity"

Setup:
  - 5 users
  - 3 snippets
  - Users star various snippets

Execute:
  - User_1 stars Snippet_A, B, C
  - User_2 stars Snippet_A, B
  - User_3 stars Snippet_A

Query:
  - Count stars on Snippet_A: should be 3
  - Count stars on Snippet_B: should be 2
  - Count stars by User_1: should be 3

Verify:
  - ✅ All counts correct
  - ✅ No orphaned records
```

#### **6. Real-Time Subscription Testing**

**Test: Query Auto-Update**
```typescript
Test: "Queries update in real-time when data changes"

Setup:
  - Frontend subscribed to getSnippets()
  - Initial count: 2

Execute:
  - Backend: Insert new snippet
  
Verify:
  - ✅ Frontend receives update automatically
  - ✅ Snippet count: 2 → 3
  - ✅ UI re-renders (new snippet appears)
```

### Test Scenarios by Feature

#### **Snippet Management**
| Scenario | Expected | Test Type |
|----------|----------|-----------|
| Create snippet (authenticated) | ✅ Insert success | Functional |
| Create snippet (unauthenticated) | ❌ AUTH_REQUIRED | Auth |
| Delete own snippet | ✅ Delete success | Functional |
| Delete other's snippet | ❌ NOT_AUTHORIZED | Auth |
| Empty title | ❌ Reject | Validation |
| Very long code | ✅ Accept | Edge case |

#### **Code Execution**
| Scenario | Expected | Test Type |
|----------|----------|-----------|
| Valid JavaScript | ✅ stdout returned | Functional |
| Syntax error | ❌ stderr returned | Error handling |
| Timeout (infinite loop) | ❌ Timeout error | Error handling |
| API key missing | ❌ Error | Config |
| OneCompiler API down | ❌ Network error | Error handling |
| No output (no print) | ❌ "No output" error | Edge case |

#### **Stars System**
| Scenario | Expected | Test Type |
|----------|----------|-----------|
| Star snippet (first time) | ✅ Insert star | Functional |
| Star same snippet again | ✅ Delete star (toggle) | Functional |
| Multiple users star same | ✅ All records exist | Data integrity |
| Delete snippet with stars | ✅ All stars deleted | Cascade |
| Check star count | ✅ Accurate count | Query |

### Running Backend Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- codeExecution.test.ts

# Run with coverage
npm run test -- --coverage

# Watch mode (re-run on changes)
npm run test -- --watch
```

### Testing Best Practices Applied

1. **Test Authentication Thoroughly**
   - Every mutation should test auth success and failure
   
2. **Verify Ownership Checks**
   - Delete/modify operations test authorization
   
3. **Test Error Scenarios**
   - Not just happy path
   - Missing resources, invalid inputs
   
4. **Validate Data Integrity**
   - Foreign keys, cascade operations
   - No orphaned records
   
5. **Test Edge Cases**
   - Empty inputs, very large inputs
   - Concurrent operations
   
6. **Mock External APIs**
   - OneCompiler responses (success, errors, timeouts)
   - GitHub API responses

---

## Conclusion

CompileX backend is built on **Convex** with three core systems:

1. **Snippet System**: CRUD operations with authentication, many-to-many stars, cascade deletes

2. **Code Execution**: Secure sandboxed execution via OneCompiler API, proper error handling

3. **Repository Analysis**: GitHub integration, file caching, AI-powered chat

**Key Principles:**
- ✅ Always authenticate before mutations
- ✅ Validate ownership for sensitive operations
- ✅ Use indexes for efficient queries
- ✅ Handle errors with specific ConvexError types
- ✅ Cascade delete related data
- ✅ Cache external API responses
- ✅ Use separate tables for many-to-many relationships

**For Your Viva:**
- Explain **Why Convex** (managed backend, real-time, TypeScript)
- Understand **Query vs Mutation vs Action** (data read, data write, external API)
- Know **Database relationships** (one-to-many via foreign key, many-to-many via join table)
- Detail **Full flows** (code execution, snippet creation, star toggle)
- Discuss **Security** (auth checks, ownership validation, sandboxing)
- Explain **Error handling** (specific error types, not raw exceptions)

Good luck with your viva! 🚀

