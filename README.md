# Xiaoxinbao (小馨宝)

A mental support AI agent for cancer patients.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Generate SSL certificates (for HTTPS development, optional):
    ```bash
    npm run certs
    ```

3.  Run the development server:

    **HTTP mode (default):**
    ```bash
    npm run dev
    ```
    Supports both local and LAN access at `http://localhost:3000`

    **HTTPS mode (for testing microphone etc.):**
    ```bash
    npm run dev:https
    ```
    Supports both local and LAN access at `https://localhost:3000`

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

    📱 **LAN Access**: Other devices on the same network can access via the shown LAN IP address.

    For detailed network setup guide, see [QUICK_START.md](QUICK_START.md) or [docs/NETWORK_SETUP.md](docs/NETWORK_SETUP.md).

## Configuration

To connect the application to your backend, create a `.env.local` file in the root directory and fill in the following information:

```env
# Chat upstream
CHAT_API_URL=https://admin.xiaoyibao.com.cn/api/v1/chat/completions
CHAT_API_KEY=your_secret_key_here

# TTS provider: alibaba / doubao
TTS_PROVIDER=alibaba

# Alibaba TTS
ALIBABA_API_KEY=your_alibaba_api_key_here
ALIBABA_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Doubao TTS
DOUBAO_TTS_APP_ID=your_doubao_app_id_here
DOUBAO_TTS_ACCESS_KEY=your_doubao_access_token_here
DOUBAO_TTS_RESOURCE_ID=seed-tts-2.0
DOUBAO_TTS_SPEAKER=zh_female_cancan_mars_bigtts
```

Refer to `.env.example` for the templates.

Security notes:

* TTS 密钥只能放在服务端环境变量中，不要使用 `NEXT_PUBLIC_*` 前缀。
* 前端始终只调用站内 `/api/tts`，由 Next.js 服务端代理到上游语音服务。
* 如切换到豆包 TTS，建议继续保留网关层限流，避免公开接口被刷额度。


## Features

*   **Secure API Proxy**: Hides the upstream API key.
*   **Local Privacy**: Chat history stored in your browser (LocalStorage).
*   **Healing UI**: Designed with Framer Motion and Tailwind CSS.

# 小馨宝项目 - 快速启动指南

## 🚀 快速开始

### 1. 首次使用 - 生成 SSL 证书

```bash
npm run certs
```

### 2. 启动开发服务器

**HTTP 模式（推荐日常开发）：**
```bash
npm run dev
```

**HTTPS 模式（测试麦克风等需要安全上下文的功能）：**
```bash
npm run dev:https
```

### 3. 访问应用

服务器启动后会显示访问地址：

**HTTP 模式：**
```
🚀 HTTP 开发服务器已启动！
   本地访问: http://localhost:3000
   局域网访问: http://172.19.0.1:3000
```

**HTTPS 模式：**
```
🔒 HTTPS 开发服务器已启动！
   本地访问: https://localhost:3000
   局域网访问: https://172.19.0.1:3000
   (请在局域网设备上信任此自签名证书)
```

## 📱 局域网访问

在同一 WiFi 下的手机、平板等设备可直接访问显示的局域网地址。

**注意：**
- 首次访问 HTTPS 时会显示安全警告，点击"高级"→"继续访问"即可
- 确保设备在同一网络下
- 检查防火墙是否允许端口 3000

## 🔧 其他命令

```bash
# 生产环境构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 重新生成 SSL 证书
npm run certs
```

## 📖 详细文档

完整的网络配置说明请查看：[docs/NETWORK_SETUP.md](docs/NETWORK_SETUP.md)

---

**有问题？** 查看项目 README 或提交 Issue。ฅ'ω'ฅ
