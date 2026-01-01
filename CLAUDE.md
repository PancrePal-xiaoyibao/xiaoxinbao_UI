# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述 (Project Overview)

**小馨宝 (Xiaoxinbao)** 是一个专为癌症患者设计的心理支持 AI 代理应用。项目采用 Next.js 16 + React 19 + TypeScript 构建，注重隐私保护和治愈系 UI 体验。

**核心特性：**
- 🔒 **安全 API 代理**：所有 API 密钥在服务端隐藏，客户端通过 Next.js API Routes 访问
- 🔐 **匿名化设计**：无需登录，基于本地生成的 UUID 进行身份识别
- 💾 **本地存储**：聊天历史、用户 ID、服务条款同意状态均存储在 LocalStorage 中
- 🎨 **治愈系 UI**：使用 Framer Motion + Tailwind CSS 打造温暖治愈的视觉体验

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **UI 库**: React 19.2.3, Framer Motion 12.23.26
- **样式**: Tailwind CSS v4
- **状态管理**: Zustand 5.0.9 (持久化到 LocalStorage)
- **图标**: Lucide React
- **Markdown 渲染**: react-markdown
- **开发语言**: TypeScript 5

## 常用开发命令 (Development Commands)

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3000)
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 环境配置 (Environment Configuration)

项目需要配置 `.env.local` 文件（参考 `.env.example`）：

```bash
# 1. 小馨宝聊天 API（核心对话功能）
NEXT_PUBLIC_API_URL=https://admin.xiaoyibao.com.cn/api/v1/chat/completions
CHAT_API_KEY=your_chat_api_key_here

# 2. 阿里云 DashScope（语音功能）
ALIBABA_API_KEY=your_alibaba_api_key_here
ALIBABA_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
ALIBABA_STT_MODEL=paraformer-v1      # 语音转文字模型
ALIBABA_TTS_MODEL=qwen3-tts-flash    # 文字转语音模型
ALIBABA_TTS_VOICE=loongbella         # TTS 音色
```

**⚠️ 重要：** 永远不要在代码中硬编码 API 密钥或提交 `.env.local` 到 Git 仓库！

## 架构设计 (Architecture)

### 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局（字体配置）
│   ├── page.tsx           # 主页面（ChatInterface 入口）
│   ├── globals.css        # 全局样式（Tailwind）
│   └── api/               # API Routes（服务端代理）
│       ├── chat/route.ts  # 聊天 API 代理（流式响应）
│       ├── stt/route.ts   # 语音转文字代理（阿里云）
│       └── tts/route.ts   # 文字转语音代理（阿里云）
├── components/            # React 组件
│   ├── ChatInterface.tsx  # 主聊天界面（消息列表、输入、语音交互）
│   ├── Sidebar.tsx        # 侧边栏（会话管理）
│   └── WelcomeModal.tsx   # 欢迎弹窗（服务条款同意）
├── store/                 # 状态管理
│   └── useChatStore.ts    # Zustand Store（会话、消息、用户状态）
└── lib/                   # 工具函数
    └── utils.ts          # 通用工具（cn 样式合并、UUID 生成）
```

### 核心架构原则

#### 1. API 代理模式（安全架构）

**所有外部 API 调用必须通过 Next.js API Routes 代理，禁止客户端直接调用！**

**聊天 API 代理流程：**
1. 客户端 → `/api/chat` (Next.js Route)
2. Route → 添加 `Authorization: Bearer ${CHAT_API_KEY}` 头
3. Route → 转发到 `https://admin.xiaoyibao.com.cn/api/v1/chat/completions`
4. 流式响应透传给客户端（Server-Sent Events）

**语音 API 代理流程：**
- **STT（语音转文字）**: `/api/stt` 接收 FormData → 阿里云 DashScope → 返回文字
- **TTS（文字转语音）**: `/api/tts` 接收 JSON `{text}` → 阿里云 DashScope → 返回音频流

参考实现：
- Chat Proxy: `src/app/api/chat/route.ts:5-39`
- STT Proxy: `src/app/api/stt/route.ts:8-46`
- TTS Proxy: `src/app/api/tts/route.ts:9-55`

#### 2. 状态管理模式（Zustand + Persistence）

使用 Zustand 管理全局状态，通过中间件持久化到 LocalStorage：

**核心状态结构：**
```typescript
interface ChatState {
  sessions: ChatSession[];      // 所有聊天会话
  activeSessionId: string | null;  // 当前激活会话 ID
  hasAgreed: boolean;           // 服务条款同意状态
  userId: string | null;        // 用户唯一标识（UUID）
  isLoading: boolean;           // AI 响应加载状态

  // 会话操作
  createNewSession: () => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  clearAllSessions: () => void;

  // 消息操作
  addMessage: (role, content) => void;
  appendTokenToLastMessage: (token: string) => void;  // 流式响应追加
  setLoading: (loading: boolean) => void;
}
```

**持久化配置：**
- Storage Key: `xiaoxinbao-storage-v2`
- 持久化字段: `sessions`, `activeSessionId`, `hasAgreed`, `userId`
- 运行时字段（不持久化）: `isLoading`

**自动会话初始化：**
- 首次访问时生成 UUID 并创建默认会话（`initUser()`）
- 会话标题自动从首条用户消息生成（前 15 字符）

参考实现：`src/store/useChatStore.ts:43-224`

#### 3. 多模态交互模式

应用支持三种交互模式：

**文本模式（默认）**:
- 用户输入文本 → 发送到 API → 流式接收 AI 响应 → 逐 Token 渲染

**语音识别模式（Native SpeechRecognition）**:
- 点击麦克风按钮 → 浏览器原生语音识别 → 实时显示文字 → 可选择自动发送
- 实现位置：`ChatInterface.tsx` 的 `recognitionRef` 相关逻辑

**语音播报模式（TTS）**:
- 用户开启"语音模式" → AI 响应文字通过 `/api/tts` 合成音频 → 客户端播放
- 或使用浏览器原生 `speechSynthesis` API（备选方案）

**沉浸式语音 UI**:
- 大界面显示对话状态
- 一键开始/停止录音
- 自动播放 AI 回复

参考实现：`src/components/ChatInterface.tsx:24-50`

### 关键技术细节

#### 流式响应处理（Server-Sent Events）

客户端使用 `fetch` + `ReadableStream` 逐块解析 SSE 响应：

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // 解析 SSE 格式: "data: {...}\n\n"
  // 调用 appendTokenToLastMessage() 逐字渲染
}
```

#### Markdown 渲染安全性

使用 `react-markdown` 渲染 AI 响应，**注意**：
- TTS 语音合成前需要清理 Markdown 符号（`#*`_~\[\]()` 等）
- 参考：`src/app/api/tts/route.ts:22`

#### 自动滚动管理

使用 `useRef` + `useEffect` 确保新消息自动滚动到底部：

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

### UI/UX 设计规范

**配色方案：**
- 背景：`bg-stone-50`（奶油色暖底）
- 主色：`teal-600`（治愈绿）
- 文字：`text-stone-800`（深灰）
- 边框：`border-stone-200`（浅灰）

**动画原则（Framer Motion）：**
- 会话切换：淡入淡出（`AnimatePresence` + `fade-in`）
- 消息加载：脉冲动画（`pulse`）
- 侧边栏：滑入滑出（`slide-in`）
- 语气：柔和、缓动、非侵入式

**组件依赖：**
- 所有图标来自 `lucide-react`
- 样式合并使用 `cn()` 函数（`clsx` + `tailwind-merge`）

### 开发注意事项

1. **TypeScript 严格模式已启用**：确保类型安全，避免 `any` 类型
2. **路径别名配置**：`@/*` 映射到 `./src/*`（已在 `tsconfig.json` 配置）
3. **Edge Runtime**：API Routes 使用 Edge Runtime 以降低延迟（`export const runtime = 'edge'`）
4. **环境变量校验**：API Routes 中需要检查环境变量是否存在，避免运行时错误
5. **LocalStorage 限制**：注意浏览器存储容量限制（通常 5-10MB），大文件不应存入 LocalStorage

### Git 提交规范

参考 `package.json:5-9` 的 scripts：
- 使用 `npm run lint` 确保代码质量
- 提交前检查 `.env.local` 未被跟踪（已在 `.gitignore` 中）
- 遵循 Conventional Commits 规范（建议）

### 调试技巧

1. **查看 Zustand 状态**：在浏览器控制台使用 `useChatStore.getState()`
2. **测试 API 代理**：使用 `curl` 或 Postman 直接测试 `/api/chat`、`/api/tts`、`/api/stt`
3. **检查 LocalStorage**：开发者工具 → Application → Local Storage → `xiaoxinbao-storage-v2`
4. **流式响应调试**：在 Network 面板查看 EventStream 类型的响应

## 项目文档

- 项目 README: `README.md`
- 环境配置示例: `.env.example`
- Gemini AI 项目上下文: `GEMINI.md`（历史参考）
