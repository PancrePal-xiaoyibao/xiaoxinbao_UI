# Xiaoxinbao (小馨宝)

前端和后端现在是彻底分离的两套进程：

- 前端：Next.js，只负责页面、交互、录音采集和调用后端。
- 后端：Go，独立提供 `/api/chat`、`/api/stt`、`/api/stt/ws`、`/api/tts`。

密钥只允许存在于 Go 后端环境变量中。前端只持有后端地址，不再包含任何第三方服务代理逻辑。

## 目录结构

- `src/`：前端 UI
- `backend/`：Go 原生后端
- `.env.example`：前端环境变量模板
- `backend/.env.example`：后端环境变量模板

## 前后端分离约束

- Next.js `src/app/api` 已移除，前端仓库不再提供业务 API。
- 豆包/阿里云/chat 的密钥只给 Go 后端。
- 前端通过 `NEXT_PUBLIC_API_BASE_URL` 和 `NEXT_PUBLIC_WS_BASE_URL` 访问后端。
- 流式语音识别走 Go 后端的 WebSocket，再由 Go 后端代理到豆包。

## 启动方式

1. 安装前端依赖

```bash
npm install
```

2. 配置前端环境变量

根目录创建 `.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
# 可选；不填时默认从 NEXT_PUBLIC_API_BASE_URL 推导
NEXT_PUBLIC_WS_BASE_URL=
```

3. 配置后端环境变量

参考 [backend/.env.example](/Users/liueic/Documents/project/xiaoxinbao_UI/backend/.env.example)，把变量导入 Go 进程环境。

最小配置通常至少包括：

```env
BACKEND_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000
CHAT_API_URL=...
CHAT_API_KEY=...
STT_PROVIDER=doubao
TTS_PROVIDER=doubao
DOUBAO_STT_APP_ID=...
DOUBAO_STT_ACCESS_KEY=...
DOUBAO_TTS_APP_ID=...
DOUBAO_TTS_ACCESS_KEY=...
DOUBAO_TTS_SPEAKER=...
```

4. 启动后端

```bash
npm run dev:backend
```

5. 启动前端

```bash
npm run dev
```

如需 HTTPS 前端开发环境：

```bash
npm run certs
npm run dev:https
```

## 构建

前端构建：

```bash
npm run build
```

后端构建：

```bash
npm run build:backend
```

前端生产启动：

```bash
npm start
```

后端生产启动：

```bash
go run ./backend/cmd/server
```

## 校验

前端：

```bash
npm run lint
npx tsc --noEmit
```

后端：

```bash
npm run test:backend
cd backend && go build ./cmd/server
```
