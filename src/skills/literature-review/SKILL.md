---
name: literature-review
description: 仅用于本科毕业论文与毕设项目的文献检索与核验，非论文/非毕设项目不要加载。当用户说要找文献、查文献、检索文献、文献综述、补引用、参考文献太少、怀疑参考文献是编的，或需要核实某条文献的作者/期刊/年份/DOI 是否真实存在时使用。强制真实检索：每条文献都必须能在 Crossref、OpenAlex、Semantic Scholar、PubMed、arXiv、CNKI 等真实来源查到，禁止生成看似合理的假文献；产出 docs/thesis/refs-source.json（原文摘录 + 链接 + 英文译名），再用 reference/verify-refs.mjs 在线复核，供 thesis-writer 直接引用。English keywords — find literature, search papers, literature review, verify references, citation check, doi lookup.
version: 1.6.0
priority: 85
triggers: triggers.yaml
---

# literature-review

给 `thesis-writer` 供货的文献检索 skill。只做一件事：**把真实存在、能打开、能核对的文献整理成 `refs-source.json`**。

> **适用范围**：仅本科毕业论文 / 毕设项目。其他项目不要使用。
> **版本门禁**：读 `.agents/skills/.graduation-kit.json`，`version` 必须等于本文件 frontmatter 的 `version`；缺失或不一致时停止使用，先让用户执行 `npx graduation-kit update`。
> **触发**：找文献 / 查文献 / 检索文献 / 文献综述 / 补引用 / 文献太少 / 核验文献真假。
> **不触发**：写章节正文、画论文配图、转 Word —— 那是 `thesis-writer` 的活。
> **关键词与冲突裁决见** `../triggers.yaml`。

---

## ⚠️ 铁律（违反即全部作废，重做）

1. **没有检索结果就没有文献**。每一条文献都必须来自本次真实检索的返回内容（接口响应、数据库记录、页面正文），不能凭记忆写、不能"看起来应该有一篇"。
2. **配额硬性，不得凑数**。全篇 ≥ 22 条；英文 ≥ 6 条；中文 ≥ 15 条；`scope` 为 `domain`（主题/业务）与 `tech`（技术）的各 ≥ 5 条。凑不够就报缺口，不允许拿不相关的文献填数。
3. **每条都要能核验**。至少提供 `doi` 或可访问的 `url`；`verify-refs.mjs` 跑不过的条目直接从清单里删掉，不许留在正文里。
4. **`quote` 必须是原文句子**。从摘要或正文里原样复制，不改写、不翻译、不拼接。
5. **一条只为一句服务**。每条文献只支撑一个论点、在正文里只出现一次；同一句话不要同时挂两条。
6. **元数据不许改**。作者顺序、标题、期刊名、年份、卷期页码照抄检索结果；中文译名单独写进 `titleZh`，不要替换原标题。
7. **查不到就如实说**。检索为空、全文要付费、链接失效时，明确告诉用户缺什么，并给出下一轮检索关键词，而不是补一条能凑数的。
8. **不算文献的东西**：博客、CSDN/知乎文章、百科、厂商营销页、AI 生成内容、同一篇文献的预印本与正式版重复计数。

---

## 工作流

### Step 1：定检索词

先跟用户确认论文题目、章节主题、技术栈，然后给出中英各一组关键词：

- 英文：主题词 + 方法词 + 场景词（如 `microservice` + `graduation project` + `Spring Boot`）
- 中文：同义词都要覆盖（如「高校 / 校园 / 学校」，「管理系统 / 信息管理系统」）

**不要**拿整个论文标题当检索词，召回率极低。

### Step 2：真实检索

优先用能直接返回结构化元数据的接口（见下节），一次检索 10–20 条，再按相关度筛到 5–10 条。
中文文献如果学校没开 CNKI 校外访问，就让用户自己检索并贴回题录，你负责核验与整理，**不要凭空补**。

### Step 3：逐条核验

对每条候选文献过一遍核验清单（见下节）。不通过的直接丢弃，不留"待确认"。

### Step 4：落证据文件

写进 `docs/thesis/refs-source.json`，字段与 `thesis-writer/reference/citation-policy.md` 完全一致。
**`n` 必须按正文首次引用的顺序排成 1..N**：正文第 1 个 `[1]`、第 2 个 `[2]`……不允许跳号或倒序。
**先定文献再写正文**，不许先编参考文献表再倒推。

### Step 5：在线复核

```bash
node .agents/skills/literature-review/reference/verify-refs.mjs docs/thesis
```

有 `FAIL` 就回去改，全绿才交给 `thesis-writer`。

### Step 6：交给 thesis-writer

文献全绿后直接告知“文献已就绪（N 条，verify-refs 全绿），可以开始写第 X 章”，
**然后交回调用方继续往下走**，不要再问用户“要不要继续”。

本 skill 不负责写正文。被 `thesis-writer` 自动调用时，只回一句“已就绪 / 缺口如下”就返回，
不要自己展开写章节。

`thesis-writer` 写完正文会跑 `thesis-writer/reference/check-refs.mjs` 做格式校验。两个脚本分工不同：

| 脚本 | 查什么 |
|---|---|
| `literature-review/reference/verify-refs.mjs` | 文献**是否真实存在**（联网查 DOI / 链接 / 标题 / 年份） |
| `thesis-writer/reference/check-refs.mjs` | 引用**格式是否合规**（编号、篇数、译名、正文 `[n]` 对应） |

---

## 配额与覆盖（硬性）

| 项 | 下限 | 怎么判 |
|---|---|---|
| 总条数 | 22 | `references.length` |
| 英文 | 6 | `lang: "en"`，且每条有 `titleZh` |
| 中文 | 15 | `lang: "zh"` |
| 主题类 | 5 | `scope: "domain"`——研究背景、业务领域、同类系统 |
| 技术类 | 5 | `scope: "tech"`——框架、架构、数据库、算法、安全 |

覆盖要求不是凑数字：

- 每条都要能对应论文里一个具体论点，写清楚它支撑哪一句（`quote` 就是那句的证据）
- 主题类不能全是同一年的综述，技术类不能只有框架官方文档
- 中文文献撑国内研究现状，英文文献撑技术前沿，两边都要有

配额不够时 → 见下方「检索不到怎么办」，**不要往下写正文**。

---

## 检索源

| 源 | 适合 | 用法 |
|---|---|---|
| Crossref | 有 DOI 的期刊/会议论文，元数据最权威 | `https://api.crossref.org/works?query.bibliographic=<关键词>&rows=10` |
| OpenAlex | 覆盖面广、免费、带被引次数 | `https://api.openalex.org/works?search=<关键词>&per-page=10` |
| Semantic Scholar | 带摘要与引用关系，适合找综述 | `https://api.semanticscholar.org/graph/v1/paper/search?query=<关键词>&fields=title,abstract,year,venue,authors,externalIds` |
| arXiv | 预印本（计算机方向新成果） | `https://export.arxiv.org/api/query?search_query=all:<关键词>` |
| PubMed / Europe PMC | 医工交叉、健康类系统 | `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=<关键词>&format=json` |
| CNKI / 万方 / 维普 | 中文核心期刊、学位论文 | 需网页检索（多数要机构账号）；让用户把题录页贴回来 |
| 期刊/会议官网 | 补全卷期页码 | DOI 解析到出版社页面后取 |

调用注意：

- 一个源查不到不代表不存在，换一个源再确认一次再下结论。
- 请求加 200–500ms 间隔，别把公开接口打挂。
- 抓不到摘要时，`quote` 用标题 + 你能确认的句子，**不要**自己写一句"看起来像原文"的话。

---

## 核验清单

| 项 | 判定标准 |
|---|---|
| 存在性 | DOI 解析成功，或 URL 返回 200 且页面标题与文献标题一致 |
| 标题 | 与检索结果逐字一致（大小写、副标题、连字符都不改） |
| 作者 | 至少核对第一作者与人数；英文按 `Surname Initials` 记录 |
| 年份 | 与出版年一致；预印本用首次发布年，并在 `venue` 注明 `arXiv preprint` |
| 期刊/会议 | 全称，不写缩写；会议要写会议全称与年份 |
| 卷期页码 | 有就写，没有就留空，不猜 |
| 相关性 | 摘要里能对上一个你要论证的观点，否则换一篇 |
| 时效 | 近五年（当前年份 − 5 起）；方法类经典文献可以放宽，但要在正文说明理由 |

---

## 输出契约

写 `docs/thesis/refs-source.json`：

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

字段含义、编号方向、参考文献章节的排版，全部以
`thesis-writer/reference/citation-policy.md` 为准，不要自创字段。

---

## 检索不到怎么办

配额是硬的，真实性优先：**宁可报缺，不能编。**

1. 换关键词再检一轮（同义词、英文简称、技术名 + 系统名组合），并把用过的检索词记下来。
2. 还是不够，就写 `docs/thesis/refs-gaps.md` 并告诉用户：

```markdown
# 文献缺口

- 需要：≥ 22 条；当前：18 条（中文 13 / 英文 5；主题 10 / 技术 8）
- 缺口：中文 2 条、英文 1 条、技术类 1 条
- 建议关键词（中文）：高校管理系统、前后端分离、RBAC、数据可视化、权限控制
- 建议关键词（英文）：campus information system, role-based access control, REST API design
- 建议库：CNKI 高级检索、万方、IEEE Xplore、Semantic Scholar、arXiv
```

3. 让用户自己去学校图书馆/CNKI 补检，把题录页贴回来；你只负责核验与入库，不要代填。
4. 用户坚持先写正文时，明确告知：这章暂时不过校验，`check-refs.mjs` 会报配额不足。

---

## 常见失败案例

| 现象 | 真相 | 处理 |
|---|---|---|
| DOI 形如 `10.1109/ACCESS.2023.1234567` 但打不开 | 编号是拼出来的 | 删掉，重新检索 |
| 年份比检索结果晚一年 | 把 online first 当成了见刊年 | 以正式出版年为准 |
| 把一篇综述里的转述当原文 `quote` | 二次引用 | 找到原始文献，或换句子 |
| 同一篇文献出现两次（预印本 + 正式版） | 重复计数 | 只留正式版 |
| 中文文献只有标题没有链接 | 无法核验 | 让用户提供检索页 URL 或期刊官网链接 |
| 为了凑"至少 1 篇英文"硬塞一篇不相关的 | 论证断裂 | 换关键词重检，宁缺毋滥 |
| 在"随着信息技术的发展"这类套话后挂一个引用 | 引用没有撑出具体观点，答辩一问就露 | 只给有具体主张的句子挂引用 |
| 一条文献支撑了三个段落 | 一条只引一次，等于三处没有依据 | 拆成三条不同文献，或删掉多余引用 |

---

## 文件索引

| 文件 | 用途 |
|---|---|
| `reference/verify-refs.mjs` | 联网核验 `refs-source.json`：DOI 解析、标题/年份比对、链接可达性 |
| `../thesis-writer/reference/citation-policy.md` | 字段定义、编号规则、参考文献章节格式 |
| `../thesis-writer/reference/check-refs.mjs` | 引用格式校验（写完正文后跑） |
| `../thesis-writer/SKILL.md` | 正文写作与引用标注规则 |
