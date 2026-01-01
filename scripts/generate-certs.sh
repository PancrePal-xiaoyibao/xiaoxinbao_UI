#!/bin/bash

# 生成自签名SSL证书用于本地HTTPS开发
# 使用方法: ./scripts/generate-certs.sh

CERT_DIR="./certificates"
CERT_FILE="$CERT_DIR/localhost.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

echo "🔐 正在生成本地开发用自签名SSL证书..."

# 创建证书目录
mkdir -p "$CERT_DIR"

# 检查OpenSSL是否安装
if ! command -v openssl &> /dev/null; then
    echo "❌ 错误: 未找到 OpenSSL，请先安装："
    echo "   Ubuntu/Debian: sudo apt-get install openssl"
    echo "   macOS: 已预装"
    echo "   Windows: https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi

# 生成自签名证书（有效期1年）
# 使用配置文件方式生成（兼容老版本OpenSSL）
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -config <(
    echo '[req]'
    echo 'distinguished_name = req_distinguished_name'
    echo 'x509_extensions = v3_req'
    echo 'prompt = no'
    echo ''
    echo '[req_distinguished_name]'
    echo 'CN = localhost'
    echo ''
    echo '[v3_req]'
    echo 'subjectAltName = DNS:localhost,DNS:*.localhost,IP:127.0.0.1'
  )

if [ $? -eq 0 ]; then
    echo "✅ 证书生成成功！"
    echo "   证书文件: $CERT_FILE"
    echo "   密钥文件: $KEY_FILE"
    echo ""
    echo "📝 使用方法："
    echo "   HTTP: npm run dev"
    echo "   HTTPS: npm run dev:https"
    echo ""
    echo "⚠️  重要提示："
    echo "   1. 此证书仅供本地开发使用"
    echo "   2. 浏览器会显示安全警告，这是正常的"
    echo "   3. 在HTTPS模式下访问时，点击'高级'→'继续访问'"
    echo "   4. 局域网设备首次访问时需要信任此证书"
else
    echo "❌ 证书生成失败！"
    exit 1
fi
