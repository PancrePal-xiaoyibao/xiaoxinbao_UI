# Xiaoxinbao (小馨宝) - Project Context

## Project Overview
**Xiaoxinbao (小馨宝)** is a mental support AI agent designed for cancer patients. The application aims to provide a secure, anonymous, and emotionally healing environment.

**Key Goals:**
*   **Security:** API keys are hidden behind a server-side proxy.
*   **Anonymity:** No login required; identity is based on a generated UUID stored locally. Chat history is persisted in LocalStorage.
*   **UX:** A "healing" UI/UX with warm colors (Cream/Teal) and gentle animations.

## Tech Stack
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion
*   **Icons:** Lucide React
*   **State Management:** React Hooks / Zustand (Persistence via LocalStorage)
*   **Markdown Rendering:** react-markdown

## Architecture & Configuration

### 1. API Proxy (Crucial)
*   **Target:** `https://admin.xiaoyibao.com.cn/api/v1/chat/completions`
*   **Method:** POST
*   **Implementation:** All client-side requests must go through a Next.js API Route (`/src/app/api/chat/route.ts`) to hide the Bearer Token.
*   **Streaming:** The API response must be streamed back to the client.

### 2. Authentication & State
*   **User ID:** Random UUID generated on first load.
*   **Terms of Service:** A "Gatekeeper" modal requires user agreement before accessing the chat.
*   **Persistence:** `hasAgreed`, `userId`, and `messages` are stored in `localStorage`.

### 3. UI/UX Design Guidelines
*   **Theme:** Cream (`bg-stone-50`) background with Calm Green (`teal-600`) accents.
*   **Typography:** Large, readable fonts.
*   **Components:**
    *   `WelcomeModal`: Handles ToS agreement.
    *   `ChatInterface`: Main chat view with auto-scrolling and markdown support.

## Building and Running
*(Pending Project Initialization)*

**Standard Next.js Commands (Anticipated):**
```bash
npm install
npm run dev
npm run build
npm run start
```

## Development Status
*   **Current Phase:** Initialization & Scaffolding.
*   **Immediate Tasks:**
    1.  Initialize Next.js project.
    2.  Set up the API Proxy route.
    3.  Implement the State Store (`useChatStore`).
    4.  Build `WelcomeModal` and `ChatInterface` components.
