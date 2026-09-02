#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo
echo " =========================================="
echo "   Graduation Kit  -  Skills 安装"
echo " =========================================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo " [错误] 未检测到 Node.js"
  echo
  echo " 请先安装 Node.js 18 或更高版本：https://nodejs.org/"
  echo
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo " [错误] Node.js 版本过低（当前 $(node -v)），需要 18 或更高。"
  echo
  exit 1
fi

echo " Node.js $(node -v)"
echo

FORCE="--force"
read -r -p "已存在的 skill 是否覆盖更新? [Y/n] " ANSWER
case "${ANSWER:-}" in
  n | N) FORCE="" ;;
esac
echo

if [ -f "$HERE/bin/cli.js" ]; then
  echo " 使用本地包安装..."
  echo
  node "$HERE/bin/cli.js" install -g $FORCE --with-upstream
else
  echo " 从 npm 安装..."
  echo
  npx -y graduation-kit@latest install -g $FORCE --with-upstream
fi

STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo
  echo " [失败] 安装未完成，请看上面的错误信息。"
  echo
  echo " 常见排查："
  echo "   1. 检查网络是否通畅"
  echo "   2. 换国内镜像后重试："
  echo "        npm config set registry https://registry.npmmirror.com"
  echo "   3. 跑一次环境诊断："
  echo "        npx graduation-kit diagnose"
  echo
  exit $STATUS
fi

echo
echo " =========================================="
echo "   安装完成"
echo " =========================================="
echo
echo " 安装位置：$HOME/.agents/skills/"
echo
echo " 新开一个 agent 会话即可加载这些 skills（不需要重启编辑器）。"
echo
