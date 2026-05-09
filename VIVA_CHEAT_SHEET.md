# CompileX - Quick Reference Viva Cheat Sheet

## 1-MIN ELEVATOR PITCH

"CompileX is a cloud-based code IDE with 13+ language support, GitHub repo analysis, and AI chat. Built with Next.js + Convex + Clerk + Gemini AI. It lets users write code, execute it instantly via OneCompiler, share snippets, analyze GitHub repos with AI, and chat about codebases."

---

## KEY TERMS & DEFINITIONS

| Term | Definition | Example |
|------|-----------|---------|
| **Query** | Read database, real-time subscriptions | `getSnippets()` returns all snippets |
| **Mutation** | Write database, transactional | `createSnippet()` saves new snippet |
| **Action** | External async API calls | `executeCode()` calls OneCompiler |
| **Context** | Auth info (userId, identity) | `ctx.auth.getUserIdentity()` |
| **Index** | Database query optimization | `.withIndex("by_user_id")` |
| **Schema** | Database table definitions | `defineTable()` in Convex |
| **Zustand** | Client-side state management | `useCodeEditorStore` stores editor state |
| **Clerk** | Authentication service | Provides `useAuth()` hook |
| **Convex** | Serverless backend (DB + functions) | Replace traditional server |
| **Next.js Router** | File-based routing | `editor/page.tsx` → `/editor` |

---

## SYSTEM ARCHITECTURE (1-Page View)

```
Frontend (Next.js)
│
├─ Pages: editor, snippets, repo-analyzer, repo detail
├─ Components: EditorPanel, OutputPanel, SnippetCard
├─ Store: Zustand (language, theme, code, output)
│
↓ HTTP Calls
│
Backend (Convex)
│
├─ Queries: getSnippets, getRepoAnalysis, listFiles
├─ Mutations: createSnippet, starSnippet, deleteSnippet
├─ Actions: executeCode, generateRepoChatResponse
│
↓ Database
│
NoSQL (Convex Built-in)
│
├─ users, snippets, stars, comments
├─ repoAnalyses, repoChatHistory
├─ repositories, repositoryFiles, cachedFileContents
│
↓ External APIs
│
├─ Clerk (auth)
├─ GitHub API (repo data)
├─ Gemini/Ollama (AI analysis)
└─ OneCompiler (code execution)
```

---

## DATA MODELS (Tables)

### Users
```
_id, userId (Clerk ID), email, name
```

### Snippets
```
_id, userId, userName, title, language, code, _creationTime
Index: by_user_id
```

### Stars (Many-to-Many)
```
userId → snippetId
Index: by_user_id_and_snippet_id (enables toggle)
```

### RepoAnalyses
```
userId, repoUrl, metadata {owner, name, stars, language},
commits {totalCommits, averagePerWeek, recentCommits[]},
fileStructure {Files[], Directories[]},
analysis {techStack[], strengths[], weaknesses[], etc},
readme, analyzedAt
Index: by_user_id_and_repo
```

### RepoChatHistory
```
repoAnalysisId, userId, role (user/assistant),
message, timestamp, scopeType (repo/dir/file), scopePath
Index: by_repo_analysis_id, by_repo_and_user
```

---

## KEY FLOWS (3-Sentence Each)

### Code Execution
User types code → Clicks Run → Editor sends code to Convex action → Action calls OneCompiler API → Convex returns stdout/stderr → Zustand store updates → Output panel renders.

### Snippet Creation
User shares code → Opens dialog → Fills title/language → Clicks share → Convex mutation called → Checks auth (Clerk) → Auto-creates user if new → Inserts into snippets table → Frontend shows success.

### Repo Analysis
User enters GitHub URL → Server action parses URL → Fetches metadata from GitHub API → Gets recent commits → Gets file tree → Sends all to Gemini AI → AI generates analysis → Saved to repoAnalyses table → User sees beautiful analysis display.

### AI Chat About Repo
User asks "What's this?" → Message + repo context sent to action → Action fetches repo analysis → If file-scoped: fetch file content → Build prompt → Call Gemini/Ollama → Response saved to database → UI renders in chat.

---

## CODE PATTERNS

### Safe Mutation Pattern
```typescript
export const myMutation = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    // 1. Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("AUTH_REQUIRED");
    
    // 2. Validate
    if (!args.data) throw new ConvexError("INVALID_INPUT");
    
    // 3. Auth check on data
    const item = await ctx.db.get(args.id);
    if (item.userId !== identity.subject) 
      throw new ConvexError("NOT_AUTHORIZED");
    
    // 4. Execute operation
    return await ctx.db.insert(...);
  }
});
```

### Safe Action Pattern
```typescript
export const myAction = action({
  args: { ... },
  handler: async (ctx, args) => {
    try {
      // Call external API
      const response = await fetch("...");
      if (!response.ok) throw new Error("API Error");
      
      // Parse response
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});
```

### Zustand Store Pattern
```typescript
export const useEditorStore = create((set, get) => ({
  // State
  code: "",
  output: "",
  isRunning: false,
  
  // Setters
  setCode: (code) => set({ code }),
  
  // Complex actions
  runCode: async (codeAction) => {
    set({ isRunning: true });
    const result = await codeAction({ code: get().code });
    set({ isRunning: false, output: result.output });
  }
}));
```

### Real-Time Query in React
```typescript
// frontend component
const snippets = useQuery(api.snippets.getSnippets);

// Returns:
// - undefined (loading)
// - [] (empty array)
// - [snippet1, snippet2] (data)
// - Auto-updates if database changes ✨
```

---

## FUNCTION QUICK REFERENCE

| Function | Type | Purpose | When Called |
|----------|------|---------|------------|
| `getSnippets` | Query | List all snippets | `/snippets` page loads |
| `createSnippet` | Mutation | Save snippet | User clicks share |
| `starSnippet` | Mutation | Toggle star | User clicks star |
| `deleteSnippet` | Mutation | Remove + cascade | User deletes snippet |
| `executeCode` | Action | Run code on OneCompiler | User clicks run |
| `saveRepoAnalysis` | Mutation | Cache repo analysis | After AI generates |
| `getUserRepoAnalyses` | Query | List user's analyses | `/repo-analyzer` loads |
| `generateRepoChatResponse` | Action | AI chat response | User sends chat message |
| `upsertRepository` | Mutation | Save git repo metadata | During analysis |
| `replaceRepositoryFiles` | Mutation | Update file tree | During analysis |

---

## AUTHENTICATION FLOW

```
User clicks "Sign In"
  ↓
Clerk modal/redirect
  ↓
User logs in (email, Google, GitHub)
  ↓
Clerk issues JWT token (stored in secure cookie)
  ↓
User redirected back to app
  ↓
useAuth() returns:
  ├─ isSignedIn: true
  ├─ userId: "user_12345"
  ├─ isLoaded: true
  
Backend checks:
  └─ ctx.auth.getUserIdentity() returns {subject, email, name}
      └─ Can filter by: userId !== subject → NOT AUTHORIZED
```

---

## ERROR HANDLING

### Error Types
- `AUTH_REQUIRED` - User not logged in
- `NOT_AUTHORIZED` - User accessing someone else's data
- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND` - Data doesn't exist
- `PRIVATE_REPO` - GitHub private repo
- `AI_SERVICE_ERROR` - Gemini/Ollama failure
- `API_TIMEOUT` - External API slow

### Safe Response Pattern
```typescript
// NEVER this:
throw new Error("API key invalid");  // ❌ Exposes secrets

// YES this:
throw new ConvexError("AI_SERVICE_ERROR");  // ✅ Generic error code

// Frontend handles:
if (error === "AI_SERVICE_ERROR") {
  showDialog("Unable to analyze right now. Please try again.")
}
```

---

## PERFORMANCE OPTIMIZATIONS

| Technique | Example | Benefit |
|-----------|---------|---------|
| **Caching** | Store repo analyses → don't re-analyze | Faster second view |
| **Indexes** | `.index("by_user_id", ["userId"])` | Fast user data lookup |
| **localStorage** | Save editor code locally | Persist between sessions |
| **Real-time queries** | Users see snippets update live | Fresh data without refresh |
| **Lazy loading** | Components load on demand | Faster initial page |
| **Image optimization** | Next.js auto-optimizes | Better performance |

---

## TECH STACK SUMMARY

**Frontend:**
- Next.js 15 (routing)
- React 19 (components)
- Tailwind (styling)
- Monaco Editor (code editor)
- Zustand (state)
- Framer Motion (animations)

**Backend:**
- Convex (serverless DB + functions)
- Clerk (auth)

**External:**
- OneCompiler (code execution)
- GitHub API (repo data)
- Google Gemini (AI)
- Ollama (local AI option)

**Deployment:**
- Vercel (frontend)
- Convex (backend)
- Clerk (auth)

---

## COMMON VIVA QUESTIONS & ANSWERS

**Q: Why Convex instead of traditional Node.js + MongoDB?**
A: Convex is serverless. We write queries/mutations directly without managing servers. Automatic scaling, built-in auth, real-time subscriptions, less DevOps work.

**Q: How do you prevent data leaks?**
A: Every operation checks `ctx.auth.getUserIdentity()`. We filter by userId. Trying to access another user's data throws `NOT_AUTHORIZED`. Frontend also checks `useAuth()` before showing UI.

**Q: Why can't you run untrusted code?**
A: Security risk. Malicious code could access server resources, steal data, or crash server. OneCompiler is an isolated sandbox environment—industry standard practice.

**Q: How does real-time update work?**
A: Convex queries have built-in WebSocket subscriptions. When database changes, all connected clients auto-update UI. No manual polling needed.

**Q: What if Gemini API rate limit exceeded?**
A: We catch error and return `{success: false, error: "AI_SERVICE_ERROR"}`. Frontend shows user-friendly message in dialog. No internal details exposed.

**Q: How do you handle concurrent edits?**
A: Each user has separate localStorage. When saving snippet, Convex mutation is atomic (all-or-nothing). No conflicts.

**Q: Why use Zustand instead of Redux?**
A: Zustand is simpler, less boilerplate. Perfect for our use case (editor state). Redux overkill for this app size.

**Q: How do you scale to millions of users?**
A: Convex auto-scales. Database indexes optimize lookups. Caching reduces API calls. CDN serves static files. No architecture changes needed.

**Q: What about data privacy?**
A: User data is encrypted. Authentication via Clerk (industry-standard). GitHub token kept in backend env (not exposed). Convex database encrypted at rest.

**Q: Why cache repo analyses?**
A: Analyzing repo takes 40+ API calls to GitHub + Gemini. Caching avoids wasting API quota and user waiting time on second view.

---

## TRICKY CONCEPTS TO EXPLAIN

### 1. Why Separate Stars Table?
```
❌ Wrong:
snippets table:
  ├─ id
  ├─ title
  └─ isStarred: false  ← Can't handle multiple users!

✅ Right:
snippets table:
  ├─ id
  └─ title

stars table:
  ├─ userId
  └─ snippetId
  
→ Many users can star same snippet
→ Each user has own star record
→ Toggle with: exists? delete : insert
```

### 2. Why Indexes?
```
Without index:
  SELECT * FROM snippets
    WHERE userId = "user_123"
  → Scans ALL snippets ❌ Slow

With index on userId:
  SELECT * FROM snippets
    WHERE userId = "user_123"
  → Direct lookup ✅ Fast
```

### 3. Action vs Mutation
```
Mutation:
  ├─ Writes to database
  ├─ Atomic (all-or-nothing)
  └─ No external API calls
  
Action:
  ├─ Can call external APIs
  ├─ Async/await works
  └─ Use for OneCompiler, Gemini, GitHub
```

### 4. Real-Time vs Polling
```
Polling (❌ Old way):
  Fetch data every 5 seconds
  → Wastes network
  → Delayed updates
  
Real-time (✅ New way):
  Convex open WebSocket
  → Client auto-updates on DB change
  → Instant, no waste
```

---

## THINGS TO MENTION IN VIVA

✅ "We use Convex for serverless backend"
✅ "Every operation checks authentication"
✅ "We cache repo analyses to avoid API quota"
✅ "Zustand for simple client-side state"
✅ "Safe error responses pattern for production"
✅ "Cascade delete to maintain data integrity"
✅ "Real-time queries for instant UI updates"
✅ "Indexes optimize database queries"
✅ "MongoDB would require DevOps; Convex handles it"
✅ "Separate stars table for many-to-many relationships"

---

## THINGS TO AVOID IN VIVA

❌ "We throw errors in production" (use safe responses)
❌ "Users can see all other users' data" (check userId)
❌ "We store API keys in frontend" (env vars only)
❌ "Real-time updates require manual polling" (use subscriptions)
❌ "We can directly execute user code on server" (sandbox needed)
❌ "Database has no indexes" (performance impact)
❌ "We delete snippets without deleting comments" (cascade delete)
❌ "Any user can delete any snippet" (auth check)

---

## 2-MINUTE PRESENTATION OUTLINE

1. **What is CompileX?** (20 sec)
   - Online IDE with AI repo analyzer

2. **Main Features** (30 sec)
   - Code editor + execution
   - Snippet sharing (community)
   - GitHub analyzer with AI
   - Chat about code

3. **Architecture** (30 sec)
   - Frontend: Next.js + React
   - Backend: Convex (serverless)
   - External: GitHub + Gemini + OneCompiler

4. **Key Data Flow** (20 sec)
   - User writes code → Clicks run → OneCompiler executes → Shows output

5. **Database Design** (10 sec)
   - Multiple tables with indexes
   - Relationships: users → snippets → stars/comments

6. **Why This Tech?** (10 sec)
   - Convex: No DevOps needed
   - Zustand: Simple state management
   - Gemini: Fast, affordable AI

---

## 5-MINUTE WALKTHROUGH

### Part 1: Overview (1 min)
"CompileX is a cloud IDE. Users can write code in 13 languages, execute instantly, share as snippets, and analyze GitHub repos with AI-powered insights."

### Part 2: Frontend (1 min)
"Frontend uses Next.js for routing. Each page like /editor and /snippets is a Next.js route. React components like EditorPanel, OutputPanel render UI. Zustand stores editor state locally—language, theme, code, output."

### Part 3: Backend (1.5 min)
"Backend is Convex. Three types of functions:
- Queries fetch data (real-time subscriptions)
- Mutations write data (transactional)
- Actions call external APIs

Every operation checks auth via Clerk. User can only access their own data."

### Part 4: Data Flow Example (1 min)
"When user clicks run:
1. Code sent to Convex action
2. Action calls OneCompiler API
3. OneCompiler returns stdout/stderr
4. Convex returns to frontend
5. Zustand updates store
6. UI re-renders output panel"

### Part 5: Conclusion (0.5 min)
"System is scalable because Convex handles scaling. Secure because auth checked everywhere. Performant because real-time queries and caching."

---

**TOTAL: ~5 minutes. Adjust depth based on interviewer's questions.**

---

## FINAL TIPS

1. **Practice the 1-min pitch** until it feels natural
2. **Draw diagrams** during viva—use whiteboard
3. **Know the code** - reference actual files
4. **Explain "why"** not just "what"
5. **Admit unknowns** - "I didn't go deep into DevOps setup, but Convex handles it automatically"
6. **Have code snippets ready** in case asked
7. **Stay calm** - you know this system deeply now
8. **Ask clarifying questions** - "Should I go deeper into authentication?"

---

**You're ready to ace this viva! 🚀**

