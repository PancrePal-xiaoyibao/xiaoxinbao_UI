import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath, parse } from 'node:url';
import next from 'next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '3000', 10) || 3000;
const useHttps = process.env.HTTPS === 'true';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function getLocalIP() {
  const interfaces = networkInterfaces();

  const priorityPrefixes = [
    'wlp',
    'wlan',
    'wlx',
    'enp',
    'eth',
    'ens',
  ];

  const skipPrefixes = ['br-', 'docker', 'veth', 'virbr', 'lo'];

  for (const prefix of priorityPrefixes) {
    for (const [name, entries] of Object.entries(interfaces)) {
      if (!name.startsWith(prefix) || !entries) {
        continue;
      }

      for (const iface of entries) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries || skipPrefixes.some((prefix) => name.startsWith(prefix))) {
      continue;
    }

    for (const iface of entries) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  for (const entries of Object.values(interfaces)) {
    if (!entries) {
      continue;
    }

    for (const iface of entries) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}

async function main() {
  await app.prepare();

  const server = useHttps
    ? createHttpsServer(
        {
          key: readFileSync(
            path.join(__dirname, 'certificates', 'localhost-key.pem')
          ),
          cert: readFileSync(
            path.join(__dirname, 'certificates', 'localhost.pem')
          ),
        },
        async (req, res) => {
          try {
            const parsedUrl = parse(req.url ?? '/', true);
            await handle(req, res, parsedUrl);
          } catch (error) {
            console.error('Error occurred handling', req.url, error);
            res.statusCode = 500;
            res.end('internal server error');
          }
        }
      )
    : createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url ?? '/', true);
          await handle(req, res, parsedUrl);
        } catch (error) {
          console.error('Error occurred handling', req.url, error);
          res.statusCode = 500;
          res.end('internal server error');
        }
      });

  server.listen(port, hostname, (error) => {
    if (error) {
      throw error;
    }

    if (useHttps) {
      console.log(
        `\n🔒 HTTPS 开发服务器已启动！\n` +
          `   本地访问: https://localhost:${port}\n` +
          `   局域网访问: https://${getLocalIP()}:${port}\n` +
          '   (请在局域网设备上信任此自签名证书)\n'
      );
      return;
    }

    console.log(
      `\n🚀 HTTP 开发服务器已启动！\n` +
        `   本地访问: http://localhost:${port}\n` +
        `   局域网访问: http://${getLocalIP()}:${port}\n`
    );
  });
}

void main();
