# Xiaoxinbao (小馨宝)

A mental support AI agent for cancer patients.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Configuration

To connect the application to your backend, create a `.env.local` file in the root directory and fill in the following information:

```env
# Upstream API URL
NEXT_PUBLIC_API_URL=https://admin.xiaoyibao.com.cn/api/v1/chat/completions

# Your API Bearer Token
CHAT_API_KEY=your_secret_key_here
```

Refer to `.env.example` for the templates.


## Features

*   **Secure API Proxy**: Hides the upstream API key.
*   **Local Privacy**: Chat history stored in your browser (LocalStorage).
*   **Healing UI**: Designed with Framer Motion and Tailwind CSS.