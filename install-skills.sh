#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  毕设自研 Skills 一键安装脚本
#  用途：把 src/skills/ 下的 7 个核心 skill 复制到
#       用户全局 skills 目录 (~/.agents/skills)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   毕设自研 Agent Skills 安装工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查 src/skills/ 目录
if [ ! -d "src/skills" ]; then
    echo "[错误] 找不到 src/skills/ 目录"
    echo "请确保在 graduation-kit 项目根目录下运行此脚本"
    echo ""
    exit 1
fi

# 2. 确定目标目录
TARGET_DIR="$HOME/.agents/skills"
echo "[信息] 目标目录: $TARGET_DIR"
echo ""

# 3. 创建目标目录（如果不存在）
if [ ! -d "$TARGET_DIR" ]; then
    echo "[操作] 创建目录 $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

# 4. 列出要安装的 skills
echo "[准备] 将安装以下 7 个 skills:"
echo ""
for skill_dir in src/skills/*/; do
    skill_name=$(basename "$skill_dir")
    echo "  • $skill_name"
done
echo ""

# 5. 询问是否覆盖
OVERWRITE="n"
if [ -d "$TARGET_DIR/graduation-project" ]; then
    echo "[提示] 检测到已安装的 skills，是否覆盖？"
    read -p "覆盖已存在的 skills? (y/N): " OVERWRITE
    echo ""
fi

# 6. 复制 skills
COUNT=0
SKIPPED=0
COPIED=0

for skill_dir in src/skills/*/; do
    skill_name=$(basename "$skill_dir")
    target_path="$TARGET_DIR/$skill_name"
    
    if [ -d "$target_path" ]; then
        if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
            echo "[覆盖] $skill_name"
            rm -rf "$target_path"
            cp -R "$skill_dir" "$target_path"
            ((COPIED++))
        else
            echo "[跳过] $skill_name (已存在)"
            ((SKIPPED++))
        fi
    else
        echo "[安装] $skill_name"
        cp -R "$skill_dir" "$target_path"
        ((COPIED++))
    fi
    
    ((COUNT++))
done

# 7. 汇总结果
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[完成] 安装统计:"
echo "  • 成功安装: $COPIED 个"
echo "  • 跳过已存在: $SKIPPED 个"
echo "  • 总计: $COUNT 个"
echo ""
echo "[路径] $TARGET_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 8. 提示 Zed 使用方法
if [ $COPIED -gt 0 ]; then
    echo "[提示] Skills 已安装，现在可以在 Zed 中使用:"
    echo ""
    echo "  1. 打开 Zed 编辑器"
    echo "  2. 按 Cmd+Shift+P (Mac) 或 Ctrl+Shift+P (Linux) 打开命令面板"
    echo "  3. 输入 \"agent\" 找到 \"Agent: Toggle Panel\""
    echo "  4. 在 Agent 面板输入框输入毕设相关需求时，相关 skill 会自动激活"
    echo ""
    echo "  核心 skills:"
    echo "    • graduation-project  - 毕设全流程编排"
    echo "    • feature-forge       - 需求定义与功能边界"
    echo "    • database-designer   - 数据库设计"
    echo "    • api-designer        - 接口设计"
    echo "    • code-reviewer       - 代码审查"
    echo "    • thesis-writer       - 论文写作"
    echo "    • impeccable          - 前端 UI 优化"
    echo ""
fi

echo "按 Enter 键退出..."
read
