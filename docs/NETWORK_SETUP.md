# 网络访问配置说明

本项目支持 HTTP 和 HTTPS 两种开发模式，同时可以在局域网内访问。

## 📋 目录

- [快速开始](#快速开始)
- [命令说明](#命令说明)
- [局域网访问](#局域网访问)
- [HTTPS 配置](#https-配置)
- [常见问题](#常见问题)

## 快速开始

### 1️⃣ 生成开发用 SSL 证书（首次使用）

```bash
npm run certs
```

这将在 `certificates/` 目录下生成自签名证书文件：
- `localhost.pem` - 证书文件
- `localhost-key.pem` - 私钥文件

⚠️ **注意**：
- 证书仅供本地开发使用，不要在生产环境使用
- 证书有效期 365 天
- 证书已添加到 `.gitignore`，不会被提交到 Git

### 2️⃣ 启动开发服务器

**HTTP 模式（默认）：**
```bash
npm run dev
```

**HTTPS 模式：**
```bash
npm run dev:https
```

**传统 Next.js 模式（不推荐）：**
```bash
npm run dev:legacy
```

## 命令说明

| 命令 | 协议 | 监听地址 | 用途 |
|------|------|----------|------|
| `npm run dev` | HTTP | 0.0.0.0:3000 | **推荐**：日常开发，支持局域网访问 |
| `npm run dev:https` | HTTPS | 0.0.0.0:3000 | 需要HTTPS时使用（如测试麦克风权限） |
| `npm run dev:legacy` | HTTP | 0.0.0.0:3000 | 传统Next.js模式（仅作备用） |
| `npm run build` | - | - | 生产环境构建 |
| `npm run start` | HTTP | 0.0.0.0:3000 | 启动生产服务器（局域网访问） |
| `npm run certs` | - | - | 重新生成SSL证书 |

## 局域网访问

### 获取本机 IP 地址

服务器启动后会自动显示本机局域网 IP 地址：

```
🚀 HTTP 开发服务器已启动！
   本地访问: http://localhost:3000
   局域网访问: http://192.168.1.100:3000
```

### 在局域网设备上访问

1. **确保设备在同一网络**：手机、平板等设备需要连接到同一 WiFi
2. **关闭防火墙或允许端口 3000**：
   - Linux: `sudo ufw allow 3000`
   - macOS: 系统偏好设置 → 安全性与隐私 → 防火墙选项
   - Windows: 控制面板 → Windows Defender 防火墙 → 入站规则

3. **在浏览器中访问**：`http://[你的IP地址]:3000`

### 常见局域网访问问题

**问题 1：无法访问**
- 检查防火墙设置
- 确认设备在同一网络
- 尝试 ping IP 地址：`ping 192.168.1.100`

**问题 2：访问很慢**
- 检查网络信号强度
- 关闭 VPN 或代理
- 尝试使用 5GHz WiFi

## HTTPS 配置

### HTTPS 使用场景

建议在以下情况下使用 HTTPS 模式：

1. **测试需要安全上下文的功能**：
   - 麦克风权限（语音识别）
   - 摄像头权限
   - 地理位置定位
   - Service Workers

2. **模拟生产环境 HTTPS**

3. **测试第三方 API 的 HTTPS 限制**

### 浏览器安全警告

由于使用自签名证书，浏览器会显示安全警告：

**Chrome/Edge**：
1. 点击"高级"
2. 点击"继续访问 localhost"

**Firefox**：
1. 点击"高级"
2. 点击"接受风险并继续"

**Safari**：
1. 点击"详细信息"
2. 点击"访问此网站"

### 局域网设备信任证书

**Android (Chrome)**：
1. 首次访问时会提示"您的连接不是私密连接"
2. 点击"高级" → "继续访问"

**iOS (Safari)**：
1. 首次访问无法打开
2. 需要通过 USB 调试安装证书描述文件
3. 设置 → 通用 → 关于本机 → 证书信任设置 → 启用

**推荐方案**：
- 开发测试：优先使用 `npm run dev` (HTTP)
- 生产测试：使用真实域名和 Let's Encrypt 证书

## 常见问题

### Q: 为什么不直接使用 `next dev`？

**A:** 自定义服务器提供了以下优势：
- ✅ 自动显示局域网 IP 地址
- ✅ 支持 HTTPS 开发模式
- ✅ 更灵活的配置选项
- ✅ 统一的启动体验

### Q: 证书过期怎么办？

**A:** 重新运行 `npm run certs` 生成新证书。

### Q: 如何修改端口号？

**A:** 设置环境变量 `PORT`：

```bash
PORT=8080 npm run dev
```

### Q: HTTPS 模式下 API 请求失败？

**A:** 检查以下几点：
1. 确认 API Routes 使用 Edge Runtime
2. 检查 CORS 配置
3. 查看浏览器控制台错误信息

### Q: 生产环境如何配置 HTTPS？

**A:** 推荐使用以下方案之一：
1. **Vercel/Netlify**：自动配置 HTTPS
2. **Nginx 反向代理**：使用 Let's Encrypt 证书
3. **Cloudflare**：免费 CDN + HTTPS

示例 Nginx 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 端口占用问题

如果端口 3000 被占用，可以使用其他端口：

```bash
# 使用端口 3001
PORT=3001 npm run dev

# 或者查找并停止占用端口的进程
# Linux/macOS:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 网络调试工具

### 检查端口是否开放

```bash
# Linux/macOS
netstat -tuln | grep 3000

# Windows
netstat -ano | findstr :3000
```

### 测试局域网连接

```bash
# Ping 本机
ping 192.168.1.100

# 测试端口 (需要安装 telnet)
telnet 192.168.1.100 3000
```

## 安全建议

1. **开发环境**：
   - 仅在受信任的局域网使用
   - 不要在生产网络使用自签名证书
   - 定期更新依赖包

2. **生产环境**：
   - 始终使用真实域名
   - 配置有效的 SSL 证书（Let's Encrypt）
   - 启用防火墙规则
   - 定期安全审计

## 技术细节

### 自定义服务器实现

位置：`dev-server.js`

核心逻辑：
1. 根据 `HTTPS` 环境变量选择 HTTP/HTTPS
2. 使用 `0.0.0.0` 监听所有网络接口
3. 自动获取本机局域网 IP 地址
4. 集成 Next.js 的请求处理器

### 证书配置

- **算法**：RSA 2048 位
- **哈希**：SHA-256
- **有效期**：365 天
- **SAN**：支持 localhost、*.localhost、127.0.0.1

---

**需要帮助？** 请查看项目 README 或提交 Issue。ฅ'ω'ฅ
