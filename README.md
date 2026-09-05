# DocAgent

DocAgent is an AI agent that takes a research-style question, reasons about what it actually needs, and decides — using real LLM function calling, not hardcoded routing — whether to run a calculator, search the web, or answer directly from its own knowledge. It shows its reasoning trail live as it works, rather than returning a single black-box answer.

This project was built intentionally **narrow and deep**: one agent, one loop, done properly — with a real async task queue, real retry/backoff logic, and real error handling throughout — rather than many shallow features bolted together.

## What makes this "genuinely agentic," not just AI-flavored

A common failure mode in agent projects is hardcoding tool selection — e.g. "if the question contains numbers, use the calculator." That isn't agentic; the model's involvement becomes decorative.

In DocAgent, the code never decides which tool to use. On every single turn, the model is given the full set of available tools and genuinely decides — via Gemini's native function calling — whether to call a tool, which one, with what arguments, or whether to skip tools entirely and answer directly. The code's only job is to mechanically execute whatever the model requests and report the result back. This is verifiable directly in the code: `src/agent/loop.js` contains no logic that inspects the user's question to pick a tool.

## Core features

- **ReAct-pattern reasoning loop** — Thought → Action → Observation, repeated until the model has enough information or a hard step cap is reached
- **Real function calling** against Gemini's Interactions API, with two tools:
  - **Calculator** — arithmetic, percentages, exponents, and square roots, evaluated with `mathjs` (deliberately *not* `eval()` — arbitrary code execution from model-supplied text is a real risk `mathjs` avoids by construction)
  - **Web search** — via the Tavily API, for facts that postdate the model's training or change over time
- **Asynchronous task queue** (Redis + BullMQ) — the API responds instantly with a task ID instead of holding an HTTP connection open while the agent works; a separate worker process consumes the queue and runs the agent loop
- **Retry logic with exponential backoff**, shared across every external API call (Gemini and Tavily), built from a real rate-limit failure encountered during development, not written speculatively
- **Live reasoning-trail visibility** — the frontend polls for task status and displays each tool call as it completes, not just the final answer
- **Defensive error handling throughout** — unknown tool requests, tool execution failures, malformed API responses, and worker-level crashes are all caught and reported with enough detail to actually debug them, rather than crashing silently

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Redis, BullMQ
- **Frontend:** React (Vite), Tailwind CSS
- **AI:** Google Gemini (Interactions API, function calling)
- **Search:** Tavily API
- **Math evaluation:** mathjs

## Architecture

```
Browser
   │  POST /api/agent/ask
   ▼
Express route ── creates a Task document (status: "running")
   │              enqueues a job (question + taskId)
   │              responds immediately with { taskId }
   ▼
Redis queue (BullMQ)
   │
   ▼
Worker process ── runs the agent loop (loop.js), completely
   │               unaware that a queue, Express, or a database exist
   │               saves progress to MongoDB after every step
   ▼
MongoDB (Task documents) ◄── Browser polls GET /api/agent/status/:taskId
                              every 500ms until the task is no longer "running"
```

The agent loop (`src/agent/loop.js`) is deliberately ignorant of everything around it — it doesn't know a queue exists, doesn't know about Express, doesn't know about MongoDB. It receives a question, a task ID, and an optional callback to report progress, and returns a result. This is what allowed the queue and the reasoning-trail feature to be added later without ever modifying the loop's core logic.

## Project structure

```
Backend/
├── src/
│   ├── agent/
│   │   ├── loop.js            # the ReAct loop itself
│   │   ├── fetchWithRetry.js  # shared retry/backoff logic for all external API calls
│   │   ├── toolRegistry.js    # tool name → function map
│   │   ├── toolDeclarations.js
│   │   └── tools/
│   │       ├── calculator.js
│   │       └── webSearch.js
│   ├── routes/
│   │   └── agent.routes.js    # POST /ask, GET /status/:taskId
│   ├── models/
│   │   └── Task.js
│   ├── config/
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── gemini.js
│   ├── queue.js
│   ├── worker.js
│   ├── server.js
│   └── start.js               # combined entry point for deployment (see note below)
Frontend/
└── src/
    └── App.jsx
```

## Running locally

You'll need: Node.js, a local Redis instance (`docker run -p 6379:6379 redis` is the simplest option), a MongoDB connection (local or Atlas), and API keys for Gemini and Tavily.

**Backend:**
```
cd Backend
npm install
```
Create a `.env` file with:
```
GEMINI_API_KEY=your_key
TAVILY_API_KEY=your_key
MONGO_URI=your_mongodb_connection_string
PORT=5000
```
(No `REDIS_URL` needed locally — it falls back to `127.0.0.1:6379` automatically.)

Run the API and worker as two separate processes:
```
node src/server.js
node src/worker.js
```

**Frontend:**
```
cd Frontend
npm install
npm run dev
```

## Deployment notes — honest tradeoffs

This project is deployed entirely on free tiers (Render, Vercel, MongoDB Atlas, Upstash Redis). One deliberate compromise was made to keep it fully free, and it's worth stating plainly rather than glossing over:

**The API server and the worker are combined into a single process in production** (`src/start.js` imports and runs both `server.js` and `worker.js` together), rather than deployed as two independent services. Locally, they still run as genuinely separate processes. In production, this was a cost decision — Render's background worker pricing was ambiguous at the time of deployment, and combining both into one free web service avoided that cost entirely, with a real side benefit: it also means the worker "wakes up" whenever the API receives a request, sidestepping the free tier's inactivity spin-down for a queue consumer that would otherwise have no way to be woken.

A genuine production deployment would keep these as separate, independently scalable services, as they are in local development.

## Known limitations

- **Polling, not push-based streaming.** The reasoning trail updates via polling every 500ms rather than a push mechanism (SSE/WebSockets). This was a deliberate scope decision — implementing real-time push would require solving cross-process notification between the worker and API server for a benefit that's marginal at this project's scale. Noted here as a legitimate next step, not an oversight.
- **Tool argument extraction assumes a single argument.** The frontend displays a tool's input via `Object.values(arguments)[0]`, which works for both current tools (each take exactly one argument) but would silently show only the first argument if a future tool took more than one.
- **A permanent Gemini API failure fails the whole task**, rather than allowing the agent to retry with a different approach. Only transient failures (rate limits, 5xx errors) are retried.
- **The retry cap is fixed at 3 attempts** with exponential backoff, applied uniformly to both Gemini and Tavily — not independently tuned per API.

## What was intentionally left out of scope

Agent frameworks (LangChain, LangGraph), multi-agent coordination, long-term memory across separate conversations, and RAG were all deliberately not used — the goal was to hand-build the core mechanics once, directly, rather than rely on an abstraction that would obscure how function calling and the reasoning loop actually work underneath.
