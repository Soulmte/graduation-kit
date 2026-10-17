# 第三方组件归属

本包 vendored 以下第三方作品，各自许可证随文件一同分发。

| 组件 | 位置 | 许可 | 作者 |
|---|---|---|---|
| impeccable | `src/skills/impeccable/` | Apache-2.0 | Paul Bakaus |
| ui-ux-pro-max | `src/vendor/ui-ux-pro-max/` | MIT | Next Level Builder |
| taste-skill | `src/vendor/taste-skill/` | MIT | Leonxlnx |

## 修改说明

按 Apache-2.0 第 4(b) 条，注明对本包内第三方文件的修改：

- `src/skills/impeccable/SKILL.md`：在 YAML frontmatter 中补充
  `version`、`priority`、`triggers` 字段，并在正文前增加适用范围与版本门禁说明。
  上游的指令、方法论与其余 59 个文件未改动。
- `ui-ux-pro-max`、`taste-skill`：原样引入，未修改。

其余 skill（`graduation-project`、`thesis-writer`、`feature-forge`、
`database-designer`、`api-designer`、`code-reviewer`）为本包原创，MIT 许可，版权归 浅梦听晚 所有。
