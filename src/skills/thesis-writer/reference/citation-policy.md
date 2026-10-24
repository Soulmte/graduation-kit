# 引用与参考文献规范

本文件是 `thesis-writer` 的强制规则。写正文前先读，写完必须跑两步校验，缺一步都不算完成：

```bash
# 第一步：文献真实性（联网，由 literature-review 负责）
node .agents/skills/literature-review/reference/verify-refs.mjs docs/thesis

# 第二步：引用格式与配额（离线）
node .agents/skills/thesis-writer/reference/check-refs.mjs docs/thesis
```

---

## 0. 前置：文献必须来自真实检索

`thesis-writer` **不负责找文献**。`docs/thesis/refs-source.json` 只能由 `literature-review`
检索并核验后产出，不允许本 skill 自己"补"一条，也不允许根据标题猜 DOI。

- 文件不存在 → 先调 `literature-review`，别先动笔
- `verify-refs.mjs` 有 `FAIL` → 先修或删，再写正文
- 只有 `url` 没有 `doi` 的条目 → 标记`待人工`，需逐条打开核对标题与年份
- 检索结果凑不够配额 → 如实告诉用户缺多少、给检索关键词，**不许编造补齐**

---

## 1. 硬性规则

| 规则 | 说明 |
|---|---|
| 篇数下限 | **≥ 22 条**（`minReferences`） |
| 英文下限 | **≥ 6 条**（`minEnglish`），每条必须有中文译名 `titleZh` |
| 中文下限 | **≥ 15 条**（`minChinese`） |
| 主题覆盖 | 每条标 `scope`：`domain`（研究主题/业务领域）或 `tech`（技术实现），两类**各 ≥ 5 条** |
| 近五年 | 文献年份 ≥ 当前年份 − 5（2026 年写作即 ≥ 2021） |
| 引用必须有出处 | 每条文献记录原文摘录 `quote` 与链接 `url`／`doi`，不允许凭印象写 |
| 引用必须对得上观点 | `[n]` 所在的句子，其陈述必须能被该条的 `quote` 支撑；禁止给"随着信息技术的发展"这类空话挂引用 |
| 正文必须有标注 | 引用处写 `[n]`，与文献编号一一对应 |
| 一句话只能一个引用 | 禁止 `[1][2]`、`[1,2]`、`[1-3]` |
| 一条文献只能引一次 | 同一编号在正文中只出现一次，不允许一条文献撑多句话 |
| 编号严格递增 | 正文首次出现顺序必须是 `[1] → [2] → … → [N]`，即 `numbering: "asc"`，不允许跳号、倒序 |
| 不编造 | 打不开、对不上原文的文献直接删掉，宁缺毋滥 |

> **编号方向说明**：默认且要求 `asc`（从小到大，按正文出现顺序），这也是多数学位论文模板的要求。
> 只有学校模板**明确要求从大到小**时，才把 `numbering` 改成 `"desc"`，并同步告诉用户。
> 改之前先问一句，不要自己替用户决定。

> **配额可覆盖**：学校另有要求时，在 `refs-source.json` 里写 `minReferences` / `minEnglish` /
> `minChinese` / `minPerScope` 覆盖默认值；不写就是 22 / 6 / 15 / 5。

---

## 2. 证据文件

所有文献先落到 `docs/thesis/refs-source.json`，再据此生成正文引用与参考文献章节。
**不要先写参考文献列表再倒推正文。**

```json
{
  "numbering": "asc",
  "recentYears": 5,
  "minReferences": 22,
  "minEnglish": 6,
  "minChinese": 15,
  "minPerScope": 5,
  "references": [
    {
      "n": 1,
      "lang": "zh",
      "scope": "domain",
      "authors": "张三, 李四",
      "title": "基于 Spring Boot 的高校管理系统设计与实现",
      "venue": "计算机应用与软件",
      "year": 2022,
      "url": "https://example.org/paper/123",
      "quote": "系统采用前后端分离架构，后端基于 Spring Boot 提供 RESTful 接口。"
    },
    {
      "n": 2,
      "lang": "en",
      "scope": "tech",
      "authors": "Smith J, Lee K",
      "title": "A Survey of Web Application Architecture",
      "titleZh": "Web 应用架构综述",
      "venue": "Journal of Systems and Software",
      "year": 2023,
      "doi": "10.1016/j.jss.2023.111111",
      "url": "https://doi.org/10.1016/j.jss.2023.111111",
      "quote": "Microservice architectures improve independent deployability at the cost of operational complexity."
    }
  ]
}
```

字段要求：

| 字段 | 必填 | 说明 |
|---|---|---|
| `n` | 是 | 1..N 连续整数，与正文 `[n]` 对应 |
| `lang` | 是 | `en` 或 `zh` |
| `scope` | 是 | `domain`（主题/业务）或 `tech`（技术实现），两类各 ≥ 5 条 |
| `authors` | 是 | 原文作者，英文用 `Surname Initials` |
| `title` | 是 | 原文标题 |
| `titleZh` | `en` 必填 | 英文标题的中文译名 |
| `venue` | 是 | 期刊／会议／出版社 |
| `year` | 是 | 四位年份 |
| `url` / `doi` | 至少一个 | 可访问的来源 |
| `quote` | 是 | 原文中真实存在的句子，用来证明引用不是编的 |

---

## 3. 检索方法

检索由 `literature-review` 完成，源列表与检索命令见该 skill 的 `SKILL.md`。本节只约束"什么算合格文献"：

1. 先确认论文主题与关键词（中英文各一组）。
2. 文献必须能在真实学术来源（Crossref / OpenAlex / Semantic Scholar / PubMed / arXiv / CNKI 等）检索到。
3. **只收能打开全文或至少能读到摘要与引文段落的文献。**
4. 把关键句原样抄进 `quote`，不要改写后再放进 `quote`；正文可以转述，但 `quote` 必须是原文。
5. 英文文献同时记录中文译名。
6. 先定文献，再写正文。正文里每个论点对应一条 `quote`。

**禁止**：编造作者、期刊、年份、DOI；把综述里的话当成原文；引用打不开的链接；用 AI 生成的"看起来很像"的文献凑数；为了凑配额硬塞与论点无关的文献。

---

## 4. 正文写法

- 标注放在句末标点之前：`……提高了部署效率[12]。`
- 一句话只引一条：`……提高了部署效率[12]。另一项研究关注成本[11]。`
- 同一文献只在第一次使用时标注，后文不再重复标 `[12]`，也不要把 `[12]` 拆成两句话各挂一次。
- 编号必须在正文里自然递增：第 1 条引用是 `[1]`，第 2 条是 `[2]`，依次到 `[N]`；
  写第 5 章时突然冒出一个 `[3]` 就说明顺序错了，回头调整正文或编号。
- **引用要撑住论点**：`quote` 讲的是"独立部署性提升"，句子就不能写成"性能提升 30%"。
  如果一个句子本身只是常识或过渡句，不要给它挂引用。
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

## 6. 检索不到怎么办

配额是硬性的，但**真实性优先**：宁可如实报缺，也不能编。

检索结果不够时：

1. 明确告诉用户缺什么，例如"还需要 4 条技术类中文文献，目前只找到 11 条"。
2. 给出下一轮可用的检索词（中英各一组）与建议库（CNKI 高级检索 / 万方 / IEEE / arXiv）。
3. 把缺口写进 `docs/thesis/refs-gaps.md`，格式：

```markdown
# 文献缺口

- 需要：≥ 22 条；当前：18 条（中文 13 / 英文 5；主题 10 / 技术 8）
- 缺口：中文 2 条、英文 1 条、技术类 1 条
- 建议关键词（中文）：高校管理系统、前后端分离、权限控制、RBAC、数据可视化
- 建议关键词（英文）：campus information system, role-based access control, REST API design, dashboard
- 建议库：CNKI 高级检索、万方、IEEE Xplore、Semantic Scholar
```

4. 告诉用户补齐后把题录贴回来，由 `literature-review` 继续核验入库。

---

## 7. 校验器检查什么

`check-refs.mjs` 会检查：

- `refs-source.json` 能否解析，字段是否齐全（含 `scope`）
- `n` 是否从 1 到 N 连续且唯一
- 总条数 ≥ 22、英文 ≥ 6、中文 ≥ 15、`domain` 与 `tech` 各 ≥ 5（可用 policy 字段覆盖）
- 年份是否在近五年内
- 每篇英文是否有 `titleZh`
- 每条文献是否有 `quote` 与 `url`／`doi`
- 正文 `[n]` 是否与文献集合完全一致（不多不少）
- 同一编号是否被引用多次（一条文献撑多句话）
- 一句话是否出现多个引用
- 首次引用顺序是否为 `1 → 2 → … → N`
- `08-参考文献.md` 是否包含每个编号的条目

任何一项失败都会列出文件与行号，修完重跑。

`verify-refs.mjs` 另外做联网核验：

- 有 `doi` → 查 Crossref，比对标题相似度与出版年，查不到即失败
- 只有 `url` → 检查链接是否可达，标题与年份标为待人工核对
- 都没有 → 直接失败
