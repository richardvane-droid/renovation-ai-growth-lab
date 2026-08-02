"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PRODUCTION_SNAPSHOT_AT,
  brainGroups,
  conversationStageCounts,
  fetchPublicKnowledgeEntries,
  knowledgeDocumentCounts,
  productionStats,
  realConflicts,
  type BrainGroupKey,
  type PublicKnowledgeEntry,
} from "./enterprise-brain-data";

type BrainScreenProps = {
  goTo: (id: string, context?: Record<string, string>) => void;
  notify: (message: string) => void;
};

type Tone = "neutral" | "positive" | "warning" | "danger" | "info";

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Button({ children, disabled, kind = "default", onClick }: {
  children: ReactNode;
  disabled?: boolean;
  kind?: "default" | "primary" | "danger" | "ghost";
  onClick?: () => void;
}) {
  return <button className={`ui-button ui-button-${kind}`} disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function Card({ action, caption, children, className = "", title }: {
  action?: ReactNode;
  caption?: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return <section className={`card ${className}`.trim()}>{(title || caption || action) && <div className="card-head"><div>{title && <h3>{title}</h3>}{caption && <p>{caption}</p>}</div>{action}</div>}{children}</section>;
}

function Progress({ value }: { value: number }) {
  return <div className="progress-track" aria-label={`进度 ${value}%`}><i style={{ width: `${value}%` }} /></div>;
}

function BrainMetric({ value, label, soft = false }: { value: string; label: string; soft?: boolean }) {
  return <div className={`brain-metric ${soft ? "soft" : ""}`}><b>{value}</b><span>{label}</span></div>;
}

function SourceStamp({ live, count }: { live?: boolean; count?: number }) {
  return <div className="brain-live-stamp"><i className={live ? "online" : "snapshot"} /><span>{live ? `生产库实时连接${count ? ` · ${count} 条` : ""}` : `生产快照 · ${PRODUCTION_SNAPSHOT_AT}`}</span></div>;
}

function usePublicKnowledge() {
  const [entries, setEntries] = useState<PublicKnowledgeEntry[]>([]);
  const [state, setState] = useState<"loading" | "live" | "fallback">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetchPublicKnowledgeEntries(controller.signal)
      .then((rows) => { setEntries(rows); setState("live"); })
      .catch(() => setState("fallback"));
    return () => controller.abort();
  }, []);
  return { entries, state };
}

export function resetBrainWorkflowDemo() {
  // 本原型只读展示生产数据；刷新页面会清除临时筛选和选择状态。
}

function BrainInboxScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const sources = [
    ["品牌档案", "brand_profile", "3 条记录 · 1 条可用", "定位、品类、价格、卖点与 FAQ"],
    ["企业知识文档", "knowledge_documents", "67 份 · 人工来源", "产品 23 · 价格 20 · 流程 14 · FAQ 5 · 脚本 5"],
    ["行业知识条目", "kb_entries", "362 条 · 可实时读取", "装修流程、工艺、预算、验收与避坑"],
    ["行业检索片段", "kb_chunks", "2,987 段", "用于语义检索，不在公开原型展开全文"],
    ["历史销售对话", "conversation_examples", "206 段 · 已隔离", "只服务对话训练，不作为企业事实直接发布"],
    ["决策规则", "decision_rules", "36 条 · 已隔离", "待后续绑定到经过确认的正式知识"],
  ];
  return <div className="brain-page brain-inbox-page">
    <section className="brain-task-head"><div><h2>资料收集箱｜已接入 AKKE 生产库</h2><p>继续上传任意企业文档；后台自动抽取、归类、比对冲突，并保留原始证据。</p></div><div className="button-row"><SourceStamp/><Button kind="primary" onClick={() => notify("原型：上传入口已打开；正式版将文件写入私有资料区")}>上传文件 / 文件夹</Button></div></section>
    <button className="brain-dropzone" onClick={() => notify("原型：可拖入 PDF、Word、Excel、PPT、图片或文件夹") } type="button"><b>↑</b><strong>把新的企业资料拖到这里</strong><span>原文件进入私有存储；公开页面只展示经过选择和脱敏的结构化结果</span></button>
    <div className="brain-metric-grid compact"><BrainMetric value="67 份" label="企业文档"/><BrainMetric value="362 条" label="行业知识"/><BrainMetric value="2,987 段" label="检索切片"/><BrainMetric value="3 项" label="真实冲突" soft/></div>
    <Card title="当前生产数据源" caption="这里展示已实际读取到的表和数据规模；点击企业知识文档查看真实处理结果">
      <div className="brain-file-list">{sources.map((source, index) => <button key={source[1]} onClick={() => index === 1 ? goTo("brain-processing") : notify(`已选择数据源：${source[0]}`)} type="button"><span className="brain-file-icon">{index < 2 ? "DOC" : index < 4 ? "KB" : "AI"}</span><span><b>{source[0]}</b><small>{source[1]}</small></span><Pill tone={index < 4 ? "positive" : "neutral"}>{source[2]}</Pill><em>{source[3]}</em><i>›</i></button>)}</div>
    </Card>
    <section className="brain-source-tip"><b>隐私与知识边界</b><span>私人对话原文、完整门店地址、数据库密钥不会进入公开原型或 GitHub。</span><small>非行业经验的聊天节奏和销售技巧继续留在“企微自动接待”，不进入企业大脑。</small></section>
  </div>;
}

function BrainProcessingScreen({ goTo }: Pick<BrainScreenProps, "goTo">) {
  const stages = ["解析原文", "识别结构", "抽取事实", "匹配模块", "交叉比对", "生成冲突题", "写入快照"];
  return <div className="brain-page">
    <section className="brain-task-head"><div><h2>真实文档处理记录｜订单服务全流程（10步）</h2><p>来源：knowledge_documents · category=flow · 人工资料 · 已完成抽取</p></div><Pill tone="positive">生产记录 · 已完成</Pill></section>
    <Card title="文档处理链路" caption="这不是虚构文件；下方内容来自当前生产库"><div className="brain-processing-progress"><Progress value={100}/><b>7 / 7 个阶段完成</b></div><div className="brain-pipeline">{stages.map(stage => <div className="done" key={stage}><i>✓</i><span>{stage}</span></div>)}</div></Card>
    <div className="brain-two-column">
      <Card title="抽取出的模块覆盖" caption="同一份文档可以填充多个企业模块"><div className="brain-fact-list">{[["订单服务全流程","10 个履约节点","E01"],["量尺与设计标准","5 天首版 / 2 次修改","E02"],["合同与付款节点","2000 + 80% + 20%","E03"],["生产配送安装","30 天 + 3–7 天","E04"],["验收与售后","72H 验收 / 1 年质保","E05"]].map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone="positive">{row[2]}</Pill></div>)}</div></Card>
      <Card title="真实原文证据摘要" caption="公开页只放必要摘要，正式产品可回到原文位置"><div className="brain-evidence-list"><div><b>交定与建单</b><span>2000 元进入总部账户，销售在 ERP 创建订单</span></div><div><b>量尺与设计</b><span>现场条件满足后量尺；24H 约沟通，5 天内首版</span></div><div><b>签约与生产</b><span>合同款 80% 后拆单生产，预计 30 天</span></div><div><b>配送与验收</b><span>入库后支付尾款；安装、补单、验收均有节点</span></div></div></Card>
    </div>
    <section className="brain-inline-action"><div><b>交叉比对后发现 3 个承诺冲突</b><span>退定、加急周期和售后 SLA 不会自动写成对外承诺。</span></div><Button kind="primary" onClick={() => goTo("brain-decisions")}>查看真实冲突</Button></section>
  </div>;
}

function BrainOverviewScreen({ goTo }: Pick<BrainScreenProps, "goTo">) {
  const { entries, state } = usePublicKnowledge();
  const groupKeys = Object.keys(brainGroups) as BrainGroupKey[];
  const moduleCount = groupKeys.reduce((sum, key) => sum + brainGroups[key].modules.length, 0);
  return <div className="brain-page brain-overview-page">
    <section className="brain-task-head"><div><h2>AKKE 企业知识全景｜有大有小</h2><p>基于生产库真实数据构建：企业事实与行业知识分层；206 段销售对话保持隔离，不混入企业大脑。</p></div><div className="button-row"><SourceStamp live={state === "live"} count={entries.length || undefined}/><Button onClick={() => goTo("brain-inbox")}>查看数据源</Button><Button kind="primary" onClick={() => goTo("brain-decisions")}>处理 3 项冲突</Button></div></section>
    <div className="brain-metric-grid"><BrainMetric value={`${productionStats.knowledgeDocuments} 份`} label="企业文档"/><BrainMetric value={`${productionStats.knowledgeEntries} 条`} label="行业知识"/><BrainMetric value={`${productionStats.knowledgeChunks.toLocaleString()} 段`} label="检索切片"/><BrainMetric value={`${moduleCount} 个`} label="展示模块"/><BrainMetric value="3 项" label="待确认承诺" soft/></div>
    <div className="brain-filter-row"><div><Pill tone="positive">生产事实已填充</Pill><Pill>行业库 362 条</Pill><Pill tone="warning">冲突 3</Pill><Pill tone="info">对话资料已隔离</Pill></div><span>AKKE 生产快照｜{PRODUCTION_SNAPSHOT_AT}</span></div>
    <div className="brain-category-grid">{groupKeys.map(key => { const group = brainGroups[key]; return <section className="brain-category" key={key}><div className="brain-category-head"><h3>{group.title}</h3><Pill tone={key === "unique" ? "positive" : "neutral"}>{group.modules.length} 个模块</Pill></div><p>{group.caption}</p><div className="brain-module-lines">{group.modules.map(module => <div key={module.code}><span><b>{module.code}</b>｜{module.title}</span><em>{module.meta}</em></div>)}</div><Button kind="primary" onClick={() => goTo(group.destination)}>查看{key === "core" ? "企业核心" : key === "industry" ? "行业通用" : "企业独有"}</Button></section>; })}</div>
    <section className="brain-expansion-strip"><div><h3>D｜知识来源与隔离规则</h3><p>每份文档可覆盖多个模块；无法归类的主题才生成新模块候选。</p></div><div><b>67 份企业文档的真实分类</b><div className="brain-expansion-lines">{knowledgeDocumentCounts.map(([label,count])=><span key={label}><strong>{count}</strong> {label}</span>)}</div><small>销售脚本只允许抽取产品、价格、流程等可验证事实，聊天技巧留在对话模块。</small></div><div><small>206 段历史对话<br/>36 条决策规则<br/>均未在公开页展开原文</small><Button onClick={() => goTo("brain-expansion")}>查看自动扩展规则</Button></div></section>
  </div>;
}

function LiveIndustryList({ entries, selectedCategory, state }: { entries: PublicKnowledgeEntry[]; selectedCategory?: string; state: "loading" | "live" | "fallback" }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const filtered = useMemo(() => entries.filter(entry => {
    const categoryOk = !selectedCategory || entry.category === selectedCategory;
    const haystack = `${entry.title} ${entry.summary ?? ""} ${entry.source ?? ""}`.toLowerCase();
    return categoryOk && haystack.includes(query.trim().toLowerCase());
  }).slice(0, 12), [entries, query, selectedCategory]);
  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0];
  if (state === "loading") return <Card title="正在连接生产知识库"><p className="brain-card-copy">正在读取 kb_entries 的公开知识索引……</p></Card>;
  if (state === "fallback") return <Card title="生产库暂时无法连接" action={<Pill tone="warning">使用快照</Pill>}><p className="brain-card-copy">模块结构仍来自 {PRODUCTION_SNAPSHOT_AT} 的真实快照；刷新后会重新尝试连接。</p></Card>;
  return <Card title="真实知识条目" caption={`分类：${selectedCategory ?? "全部"} · 当前显示 ${filtered.length} 条`} action={<Pill tone="positive">实时</Pill>}>
    <div className="brain-kb-toolbar"><input aria-label="搜索生产知识" onChange={event => setQuery(event.target.value)} placeholder="搜索标题、摘要或来源" value={query}/><span>生产库共 {entries.length} 条</span></div>
    <div className="brain-kb-layout"><div className="brain-kb-list">{filtered.length ? filtered.map(item => <button className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span><b>{item.title}</b><small>{item.source ?? "未标来源"} · {item.category ?? "未分类"}</small></span><i>›</i></button>) : <p>该筛选下暂无条目。</p>}</div><div className="brain-kb-detail">{selected ? <><Pill tone="positive">生产知识</Pill><h3>{selected.title}</h3><p>{selected.summary || "该条目暂无独立摘要，正式产品可进入原文件或检索片段核对。"}</p><dl><div><dt>分类</dt><dd>{selected.category ?? "未分类"}</dd></div><div><dt>来源</dt><dd>{selected.source ?? "未标来源"}</dd></div><div><dt>更新时间</dt><dd>{selected.updated_at ? new Date(selected.updated_at).toLocaleDateString("zh-CN") : "未记录"}</dd></div></dl></> : <p>选择左侧条目查看详情。</p>}</div></div>
  </Card>;
}

function BrainModuleScreen({ kind, goTo }: { kind: BrainGroupKey; goTo: BrainScreenProps["goTo"] }) {
  const group = brainGroups[kind];
  const [selected, setSelected] = useState(0);
  const { entries, state } = usePublicKnowledge();
  const activeModule = group.modules[selected] ?? group.modules[0];
  return <div className="brain-page brain-module-page">
    <section className="brain-task-head"><div><h2>{group.title}｜{group.modules.length} 个真实模块</h2><p>{group.caption}。选择模块后查看生产内容、适用边界和证据来源。</p></div><div className="button-row">{kind === "industry" && <SourceStamp live={state === "live"} count={entries.length || undefined}/>}<Button onClick={() => goTo("brain-overview")}>返回知识全景</Button></div></section>
    <div className="brain-module-browser"><Card title="模块目录" caption={`${group.modules.length} 个模块 · 点击切换`} className="brain-module-nav-card"><div>{group.modules.map((item,index)=><button className={selected === index ? "active" : ""} key={item.code} onClick={() => setSelected(index)} type="button"><span><b>{item.code}</b><em>{item.title}</em></span><Pill tone={item.state === "warning" ? "warning" : item.state === "info" ? "info" : "positive"}>{item.meta}</Pill></button>)}</div></Card><div className="brain-module-detail"><section className="brain-detail-title"><div><Pill tone={activeModule.state === "warning" ? "warning" : "positive"}>{activeModule.code} · {activeModule.state === "warning" ? "含待确认项" : "生产内容"}</Pill><h2>{activeModule.title}</h2><p>{activeModule.intro}</p></div>{activeModule.state === "warning" && <Button onClick={() => goTo("brain-decisions")}>处理待确认内容</Button>}</section><Card title="结构化内容" caption="由真实生产资料抽取并为公开展示做了脱敏"><div className="brain-structured-facts">{activeModule.facts.map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div></Card>{kind === "industry" && <LiveIndustryList entries={entries} selectedCategory={activeModule.liveCategory} state={state}/>}<Card title="来源证据与适用范围"><div className="brain-source-list">{activeModule.sources.map((source,index)=><div key={source}><i>{index+1}</i><span><b>{source}</b><small>{index === 0 ? "生产主来源" : "交叉来源"}</small></span><Pill tone="positive">可追溯</Pill></div>)}</div></Card></div></div>
  </div>;
}

function BrainDecisionsScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  return <div className="brain-page"><section className="brain-task-head"><div><h2>待决策中心｜3 个承诺冲突 + 1 个表达边界</h2><p>全部来自生产资料交叉比对；在负责人选择前，系统不会把冲突内容自动承诺给客户。</p></div><Button onClick={() => notify("服务覆盖表达边界已采用 AI 推荐；3 个承诺冲突仍需人工确认")}>接受低风险边界规则</Button></section><div className="brain-decision-summary"><BrainMetric value="2 项" label="高风险事实" soft/><BrainMetric value="1 项" label="中风险事实"/><BrainMetric value="1 项" label="表达边界"/><BrainMetric value="约 8 分钟" label="预计工作量"/></div><div className="brain-decision-list">{realConflicts.map((item,index)=><article key={item.id}><span className="brain-decision-index">0{index+1}</span><div><small>{item.level}</small><h3>{item.title}</h3><p>{item.issue}</p><b>{item.recommendation}</b></div><Pill tone={index < 2 ? "warning" : index === 2 ? "neutral" : "info"}>{index < 3 ? "必须确认" : "可采用推荐"}</Pill><Button kind={index === 0 ? "primary" : "default"} onClick={() => index === 0 ? goTo("brain-conflict") : notify(`已打开“${item.title}”的真实来源对比`)}>{index === 0 ? "开始选择" : "查看选项"}</Button></article>)}</div></div>;
}

function BrainConflictScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const [choice, setChoice] = useState("safe");
  const options = [
    { id: "profile", title: "选项 A｜采用品牌档案口径", desc: "定金 2000 元；7 天冷静期内可退款，量尺后不支持取消。", meta: "来源：brand_profile FAQ｜更新于 2026-04-22" },
    { id: "faq", title: "选项 B｜采用高频问答口径", desc: "不承诺任何退款条件、不主动说“不退”、也不给时限型承诺。", meta: "来源：knowledge_documents｜客户高频问题（价格/退定/时间）" },
    { id: "safe", title: "AI 推荐｜自动回复不承诺，转人工按合同核对", desc: "保留两份原始口径；机器人只说明定金计入总价，退款问题交给负责人按正式合同判断。", meta: "在正式合同与责任人确认前，风险最低" },
  ];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>选择题 1 / 3｜确定定金退款口径</h2><p>两个真实生产来源发生冲突；选择一份，或采用 AI 的临时安全融合方案。</p></div><Pill tone="warning">高风险承诺</Pill></section><section className="brain-question-banner"><div><b>客户追问“交了 2000 元定金能退吗”，系统应该怎么回答？</b><span>影响：企微自动接待、报价、合同说明与沉默客户召回</span></div><Pill tone="warning">3 个候选</Pill></section><div className="brain-conflict-layout"><div className="brain-choice-list">{options.map(option=><label className={choice === option.id ? "selected" : ""} key={option.id}><input checked={choice === option.id} name="refund-choice" onChange={() => setChoice(option.id)} type="radio"/><span><b>{option.title}</b><p>{option.desc}</p><small>{option.meta}</small></span></label>)}<section className="brain-formal-preview"><div><b>选择后的正式知识预览</b><Pill>待负责人确认</Pill></div><p>{choice === "profile" ? "定金 2000 元计入总价；7 天冷静期内可退款，量尺后不支持取消。" : choice === "faq" ? "定金计入总价；退款条件不由机器人承诺，请联系订单负责人核对。" : "定金 2000 元计入总价。关于退款，请以当前正式合同和订单状态为准，由订单负责人为您核对；机器人不作时限或退款承诺。"}</p><Button kind="primary" onClick={() => { notify("已保存定金退款选择，原始冲突来源继续保留"); goTo("brain-decisions"); }}>保存选择并返回</Button></section></div><Card title="来源证据"><div className="brain-evidence-list"><div><b>brand_profile｜付款 FAQ</b><span>写有 7 天冷静期和量尺后不可取消</span></div><div><b>knowledge_documents｜价格/退定/时间</b><span>明确要求不承诺退款条件与时限</span></div><div><b>缺少的最终证据</b><span>当前正式合同模板与退款责任人确认记录</span></div></div><div className="brain-ai-reason"><b>AI 为什么推荐临时安全方案</b><p>两份资料互相否定，且退款属于高风险承诺。融合不能创造新规则，只能在保留冲突的同时转由真人按合同判断。</p></div></Card></div></div>;
}

function BrainExpansionScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  return <div className="brain-page"><section className="brain-task-head"><div><h2>AI 自动扩展模块｜样板房运营规则</h2><p>“样板房参观规则”和“568 样板房专项政策”形成独立业务主题，建议从活动政策中拆成可复用模块。</p></div><Button onClick={() => goTo("brain-overview")}>返回企业大脑全景</Button></section><div className="brain-expansion-status"><BrainMetric value="2 份" label="真实来源资料"/><BrainMetric value="6 项" label="可抽取字段"/><BrainMetric value="1 个" label="新模块候选"/><BrainMetric value="0 项" label="凭空生成"/></div><div className="brain-two-column expansion"><Card title="企业独有 / 样板房运营规则" caption="候选编号 EXT-001 · 由生产资料自动形成"><div className="brain-structured-facts">{[["活动基础价","568 元/投影㎡，原价 868 元/㎡"],["价格来源","总部补贴 300 元/㎡形成样板房专项价"],["名额规则","按套、按小区申请；使用前读取活动库实时名额"],["品质说明","样板房优先配置资深设计师和高评分安装班组"],["守价纪律","全国统一公开价格，不因客户或谈判改变"],["参观规则","现有资料已识别该主题，详细适用条件需在正式页核对"]].map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div><div className="button-row"><Button kind="primary" onClick={() => { notify("已确认候选结构；进入发布检查前仍需补齐参观适用条件"); goTo("brain-release"); }}>确认模块结构</Button><Button onClick={() => notify("已保留候选，不影响当前生产知识")}>暂不发布</Button></div></Card><div className="stack"><Card title="为什么建议拆成新模块"><p className="brain-card-copy">它同时包含名额、守价、参观、团队配置和活动库校验，已超出单一价格事实；拆开后可被企微、视频和召回共同调用。</p></Card><Card title="形成候选的真实资料"><div className="brain-source-list">{["knowledge_documents｜样板房专项政策：568 是怎么来的","knowledge_documents｜样板房参观规则"].map((item,index)=><div key={item}><i>{index+1}</i><span><b>{item}</b><small>{index===0?"主来源":"交叉来源"}</small></span><Pill tone="positive">已读取</Pill></div>)}</div></Card><Card title="扩展原则"><p className="brain-card-copy">AI 可以新增目录和字段，但不能补写企业没有提供的承诺、价格、有效期或服务能力。</p></Card></div></div></div>;
}

function BrainReleaseScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const checks = [["来源可追溯","企业事实均标注真实表和文档标题","通过"],["隐私检查","对话原文、完整地址和密钥不进入公开页","通过"],["内容边界","聊天节奏和销售技巧未进入企业大脑","通过"],["定金退款","两个生产来源冲突，等待负责人选择","阻塞"],["加急政策","周期和费率存在多个版本，等待确认","阻塞"],["售后 SLA","两套响应时限尚未统一","阻塞"]];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>生产快照发布检查｜{PRODUCTION_SNAPSHOT_AT}</h2><p>真实数据已完成脱敏映射；3 个承诺冲突未解决前，不应标记为正式发布版本。</p></div><Button disabled kind="primary">解决 3 项冲突后发布</Button></section><div className="brain-version-compare"><section><div><b>当前 GitHub 原型</b><Pill tone="neutral">旧演示数据</Pill></div><p>页面结构可用｜企业大脑内容为模拟填充</p><small>将被本次真实生产快照替换</small></section><section className="draft"><div><b>真实数据草稿</b><Pill tone="warning">待发布</Pill></div><p>67 份企业文档｜362 条行业知识｜3 项阻塞</p><small>公开版仅包含脱敏事实和行业知识元数据</small></section></div><div className="brain-release-metrics"><BrainMetric value="67 份" label="企业资料"/><BrainMetric value="362 条" label="行业条目"/><BrainMetric value="2,987 段" label="检索切片"/><BrainMetric value="3 项" label="发布阻塞" soft/><BrainMetric value="206 段" label="对话已隔离"/></div><div className="brain-release-grid"><Card title="发布质量检查" action={<Pill tone="warning">3 项待处理</Pill>}><div className="brain-check-list">{checks.map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone={row[2] === "通过" ? "positive" : "warning"}>{row[2]}</Pill></div>)}</div></Card><Card title="生产数据组成"><div className="brain-change-list">{[["品牌档案","3 条记录，1 条包含完整业务档案","1 条可用"],["企业知识文档","产品 23 · 价格 20 · 流程 14 · FAQ 5 · 脚本 5","67 份"],["行业知识","装修流程、预算、工艺、验收与避坑","362 条"],["检索切片","由行业知识拆成的语义检索片段","2,987 段"],["历史销售对话","持续培育 117 · 决策 74 · 破冰 15","隔离"],["决策规则","不直接替代企业负责人确认","36 条"]].map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone={row[2] === "隔离" ? "info" : "neutral"}>{row[2]}</Pill></div>)}</div></Card></div><section className="brain-publish-footer"><div><b>当前正确动作</b><span>先完成定金、加急和售后 3 道选择题，再生成可回滚的正式版本。</span></div><Button kind="primary" onClick={() => { notify("已返回待决策中心"); goTo("brain-decisions"); }}>去处理真实冲突</Button></section><Card title="对话资料隔离统计" caption="只用于企微对话训练，不作为企业大脑模块"><div className="brain-fact-list">{conversationStageCounts.map(([stage,count,score])=><div key={stage}><span><b>{stage}</b><small>平均质量分 {score}</small></span><Pill>{count} 段</Pill></div>)}</div></Card></div>;
}

export function BrainScreenContent({ id, goTo, notify }: BrainScreenProps & { id: string }) {
  switch (id) {
    case "brain-inbox": return <BrainInboxScreen goTo={goTo} notify={notify} />;
    case "brain-processing": return <BrainProcessingScreen goTo={goTo} />;
    case "brain-overview": return <BrainOverviewScreen goTo={goTo} />;
    case "brain-core": return <BrainModuleScreen kind="core" goTo={goTo} />;
    case "brain-industry": return <BrainModuleScreen kind="industry" goTo={goTo} />;
    case "brain-unique": return <BrainModuleScreen kind="unique" goTo={goTo} />;
    case "brain-decisions": return <BrainDecisionsScreen goTo={goTo} notify={notify} />;
    case "brain-conflict": return <BrainConflictScreen goTo={goTo} notify={notify} />;
    case "brain-expansion": return <BrainExpansionScreen goTo={goTo} notify={notify} />;
    case "brain-release": return <BrainReleaseScreen goTo={goTo} notify={notify} />;
    default: return <div>企业大脑页面准备中</div>;
  }
}
