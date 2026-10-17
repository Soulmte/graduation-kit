# 引用与参考文献规范

本文件是 `thesis-writer` 的强制规则。写正文前先读，写完必须跑校验：

```bash
node .agents/skills/thesis-writer/reference/check-refs.mjs docs/thesis
```

校验不过，不算写完。

---

## 1. 硬性规则

| 规则 | 说明 |
|---|---|
| 近五年 | 文献年份 ≥ 当前年份 − 5（2026 年写作即 ≥ 2021） |
| 英文必选 | 至少 1 篇英文文献；中文文献可选 |
| 英文须翻译 | 英文文献必须给出中文译名（`titleZh`） |
| 引用必须有出处 | 每条文献记录原文摘录 `quote` 与链接 `url`／`doi`，不允许凭印象写 |
| 正文必须有标注 | 引用处写 `[n]`，与文献编号一一对应 |
| 每条文献只引一次 | 同一编号在正文中只出现一次 |
| 一句话只能一个引用 | 禁止 `[1][2]`、`[1,2]`、`[1-3]` |
| 编号顺序 | 默认 `asc`：正文首次出现的顺序为 1, 2, …, N（按出现顺序升序） |
| 不编造 | 打不开、对不上原文的文献直接删掉，宁缺毋滥 |

> **编号方向说明**：本 skill 默认 `asc`（从小到大，按正文出现顺序），这也是多数学位论文模板的要求。
> 如果学校模板要求**从大到小**，把 `refs-source.json` 里的 `numbering` 改成 `"desc"`，
> 校验器会按新方向检查。

---

## 2. 证据文件

所有文献先落到 `docs/thesis/refs-source.json`，再据此生成正文引用与参考文献章节。
**不要先写参考文献列表再倒推正文。**

```json
{
  "numbering": "asc",
  "recentYears": 5,
  "references": [
    {
      "n": 2,
      "lang": "en",
      "authors": "Smith J, Lee K",
      "title": "A Survey of Web Application Architecture",
      "titleZh": "Web 应用架构综述",
      "venue": "Journal of Systems and Software",
      "year": 2023,
      "doi": "10.1016/j.jss.2023.111111",
      "url": "https://doi.org/10.1016/j.jss.2023.111111",
      "quote": "Microservice architectures improve independent deployability at the cost of operational complexity."
    },
    {
      "n": 1,
      "lang": "zh",
      "authors": "张三, 李四",
      "title": "基于 Spring Boot 的高校管理系统设计与实现",
      "venue": "计算机应用与软件",
      "year": 2022,
      "url": "https://example.org/paper/123",
      "quote": "系统采用前后端分离架构，后端基于 Spring Boot 提供 RESTful 接口。"
    }
  ]
}
```

字段要求：

| 字段 | 必填 | 说明 |
|---|---|---|
| `n` | 是 | 1..N 连续整数，与正文 `[n]` 对应 |
| `lang` | 是 | `en` 或 `zh` |
| `authors` | 是 | 原文作者，英文用 `Surname Initials` |
| `title` | 是 | 原文标题 |
| `titleZh` | `en` 必填 | 英文标题的中文译名 |
| `venue` | 是 | 期刊／会议／出版社 |
| `year` | 是 | 四位年份 |
| `url` / `doi` | 至少一个 | 可访问的来源 |
| `quote` | 是 | 原文中真实存在的句子，用来证明引用不是编的 |

---

## 3. 检索方法

1. 先确认论文主题与关键词（中英文各一组）。
2. 用可访问的学术来源检索：Google Scholar、CNKI、万方、IEEE Xplore、Springer、arXiv。
3. **只收能打开全文或至少能读到摘要与引文段落的文献。**
4. 把关键句原样抄进 `quote`，不要改写后再放进 `quote`；正文可以转述，但 `quote` 必须是原文。
5. 英文文献同时记录中文译名。
6. 先定文献，再写正文。正文里每个论点对应一条 `quote`。

**禁止**：编造作者、期刊、年份、DOI；把综述里的话当成原文；引用打不开的链接。

---

## 4. 正文写法

- 标注放在句末标点之前：`……提高了部署效率[12]。`
- 一句话只引一条：`……提高了部署效率[12]。另一项研究关注成本[11]。`
- 同一文献只在第一次使用时标注，后文不再重复标 `[12]`。
- 转述要忠实：`quote` 说的是"独立部署性提升"，就不要写成"性能提升 30%"。
- 不要写"XXX 等[12]提出"这种把作者名和编号堆在一起的句式；用"已有研究指出……[12]"。

---

## 5. 参考文献章节

文件：`docs/thesis/08-参考文献.md`

格式（中文文献）：

```
[1] 张三, 李四. 基于 Spring Boot 的高校管理系统设计与实现[J]. 计算机应用与软件, 2022.
```

格式（英文文献，附译名）：

```
[2] Smith J, Lee K. A Survey of Web Application Architecture[J]. Journal of Systems and Software, 2023.
（中文译名：Web 应用架构综述）
```

- 编号顺序与 `refs-source.json` 的 `n` 一致
- 英文条目的译名单独一行，用全角括号包住
- 不写参考文献之外的内容（不写"以上文献仅供参考"之类）

---

## 6. 校验器检查什么

`check-refs.mjs` 会检查：

- `refs-source.json` 能否解析，字段是否齐全
- `n` 是否从 1 到 N 连续且唯一
- 年份是否在近五年内
- 是否至少有一篇 `lang: "en"`，且每篇英文都有 `titleZh`
- 每条文献是否有 `quote` 与 `url`／`doi`
- 正文 `[n]` 是否与文献集合完全一致（不多不少）
- 同一编号是否被引用多次
- 一句话是否出现多个引用
- 首次引用顺序是否符合 `numbering`（`desc` 或 `asc`）
- `08-参考文献.md` 是否包含每个编号的条目

任何一项失败都会列出文件与行号，修完重跑。
