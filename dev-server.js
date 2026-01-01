const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;
const useHttps = process.env.HTTPS === 'true';

// 创建 Next.js 应用
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let server;

if (useHttps) {
  // HTTPS 服务器配置
  const https = require('https');

  const httpsOptions = {
    key: fs.readFileSync(
      path.join(__dirname, 'certificates', 'localhost-key.pem')
    ),
    cert: fs.readFileSync(
      path.join(__dirname, 'certificates', 'localhost.pem')
    ),
  };

  server = https.createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  app.prepare().then(() => {
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(
        `\n🔒 HTTPS 开发服务器已启动！\n` +
        `   本地访问: https://localhost:${port}\n` +
        `   局域网访问: https://${getLocalIP()}:${port}\n` +
        `   (请在局域网设备上信任此自签名证书)\n`
      );
    });
  });
} else {
  // HTTP 服务器配置（默认）
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  app.prepare().then(() => {
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(
        `\n🚀 HTTP 开发服务器已启动！\n` +
        `   本地访问: http://localhost:${port}\n` +
        `   局域网访问: http://${getLocalIP()}:${port}\n`
      );
    });
  });
}

// 获取本机局域网IP地址
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();

  // 优先级列表：按网卡类型排序
  const priorityPrefixes = [
    'wlp', 'wlan', 'wlx',  // 无线网卡（最常用）
    'enp', 'eth', 'ens',   // 有线网卡
  ];

  // 跳过的网卡类型
  const skipPrefixes = [
    'br-', 'docker', 'veth', 'virbr', 'lo'  // Docker、虚拟机网桥等
  ];

  // 1. 优先尝试按优先级查找
  for (const prefix of priorityPrefixes) {
    for (const name of Object.keys(interfaces)) {
      if (name.startsWith(prefix)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
    }
  }

  // 2. 如果没找到，查找所有非跳过的网卡
  for (const name of Object.keys(interfaces)) {
    // 跳过虚拟网卡和Docker网卡
    if (skipPrefixes.some(prefix => name.startsWith(prefix))) {
      continue;
    }

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  // 3. 兜底：返回第一个非内部IP
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}
