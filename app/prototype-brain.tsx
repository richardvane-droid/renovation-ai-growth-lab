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
import {
  liveEntryEvidence,
  resolveModuleEvidence,
  type EvidenceReference,
} from "./enterprise-provenance";

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

function EvidencePanel({ evidence, notify }: { evidence: readonly EvidenceReference[]; notify: (message: string) => void }) {
  const completeCount = evidence.filter(item => item.status === "complete").length;
  return <Card
    title="原始资料依据"
    caption="只把用户最初上传的文件及其页码、章节、段落或单元格当作来源；数据库位置不再展示给业务用户。"
    action={<Pill tone={completeCount === evidence.length ? "positive" : "warning"}>{completeCount}/{evidence.length} 出处完整</Pill>}
  >
    <div className="brain-origin-evidence-list">{evidence.map((item, index) => <article className={`status-${item.status}`} key={item.id}>
      <div className="brain-origin-index">{index + 1}</div>
      <div className="brain-origin-main">
        <div className="brain-origin-title"><span><small>原始文件</small><b>{item.originalFilename || "原始文件名待补录"}</b></span><Pill tone={item.status === "complete" ? "positive" : "warning"}>{item.status === "complete" ? "出处完整" : item.status === "missing_locator" ? "待补段落定位" : "待补录原件"}</Pill></div>
        <div className="brain-origin-locator"><b>位置</b><span>{item.locator}</span></div>
        <blockquote>{item.excerpt}</blockquote>
        <div className="brain-origin-foot"><span>当前抽取条目：{item.extractedTitle}{item.versionLabel ? ` · ${item.versionLabel}` : ""}</span><Button onClick={() => notify(item.originalFileUrl ? "原型：正式版将在权限校验后打开原件并定位到对应段落" : "该条目需要重新关联用户上传的原文件，并回填页码或段落位置")}>{item.originalFileUrl ? "查看原文" : "补录原始出处"}</Button></div>
        <p>{item.note}</p>
      </div>
    </article>)}</div>
  </Card>;
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
    <Card title="系统处理层（仅管理员）" caption="这些表只用于系统实现，不能作为业务用户看到的知识来源；点击企业知识文档查看出处改造要求">
      <div className="brain-file-list">{sources.map((source, index) => <button key={source[1]} onClick={() => index === 1 ? goTo("brain-processing") : notify(`已选择数据源：${source[0]}`)} type="button"><span className="brain-file-icon">{index < 2 ? "DOC" : index < 4 ? "KB" : "AI"}</span><span><b>{source[0]}</b><small>{source[1]}</small></span><Pill tone={index < 4 ? "positive" : "neutral"}>{source[2]}</Pill><em>{source[3]}</em><i>›</i></button>)}</div>
    </Card>
    <section className="brain-source-tip"><b>隐私与知识边界</b><span>私人对话原文、完整门店地址、数据库密钥不会进入公开原型或 GitHub。</span><small>非行业经验的聊天节奏和销售技巧继续留在“企微自动接待”，不进入企业大脑。</small></section>
  </div>;
}

function BrainProcessingScreen({ goTo }: Pick<BrainScreenProps, "goTo">) {
  const stages = ["解析原文", "识别结构", "抽取事实", "匹配模块", "交叉比对", "生成冲突题", "写入快照"];
  return <div className="brain-page">
    <section className="brain-task-head"><div><h2>文档处理记录｜订单服务全流程（10步）</h2><p>当前保存的是抽取后的内容；原始文件名、文件版本和段落定位尚未回填。</p></div><Pill tone="warning">出处不完整</Pill></section>
    <Card title="文档处理链路" caption="以后在解析原文时同步保存页码、章节、段落、单元格或时间码，不再事后猜出处"><div className="brain-processing-progress"><Progress value={86}/><b>6 / 7 个阶段完成 · 缺原始出处</b></div><div className="brain-pipeline">{stages.map((stage, index) => <div className={index < 6 ? "done" : "active"} key={stage}><i>{index < 6 ? "✓" : "!"}</i><span>{stage}</span></div>)}</div></Card>
    <div className="brain-two-column">
      <Card title="抽取出的模块覆盖" caption="同一份文档可以填充多个企业模块"><div className="brain-fact-list">{[["订单服务全流程","10 个履约节点","E01"],["量尺与设计标准","5 天首版 / 2 次修改","E02"],["合同与付款节点","2000 + 80% + 20%","E03"],["生产配送安装","30 天 + 3–7 天","E04"],["验收与售后","72H 验收 / 1 年质保","E05"]].map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone="positive">{row[2]}</Pill></div>)}</div></Card>
      <Card title="出处保存要求" caption="每条事实写入时必须同时绑定原始内容块"><div className="brain-evidence-list"><div><b>原始文件</b><span>文件名、存储地址、哈希、上传时间和版本关系</span></div><div><b>人类可读定位</b><span>PDF 页码、Word 标题路径与段落、Excel 工作表与单元格</span></div><div><b>原文摘录</b><span>与事实直接相关的最短原文，不用数据库记录代替</span></div><div><b>证据关系</b><span>标明支持、冲突或取代哪条事实</span></div></div></Card>
    </div>
    <section className="brain-inline-action"><div><b>原始出处也是发布门禁</b><span>没有原件或没有段落定位的事实保持草稿；不能显示绿色“可追溯”。</span></div><Button kind="primary" onClick={() => goTo("brain-decisions")}>查看真实冲突</Button></section>
  </div>;
}

function BrainOverviewScreen({ goTo }: Pick<BrainScreenProps, "goTo">) {
  const { entries, state } = usePublicKnowledge();
  const groupKeys = Object.keys(brainGroups) as BrainGroupKey[];
  const moduleCount = groupKeys.reduce((sum, key) => sum + brainGroups[key].modules.length, 0);
  return <div className="brain-page brain-overview-page">
    <section className="brain-task-head"><div><h2>AKKE 企业知识全景｜有大有小</h2><p>基于生产库真实数据构建；正式事实还必须绑定用户原始文件和段落，数据库记录本身不算来源。</p></div><div className="button-row"><SourceStamp live={state === "live"} count={entries.length || undefined}/><Button onClick={() => goTo("brain-inbox")}>查看数据源</Button><Button kind="primary" onClick={() => goTo("brain-decisions")}>处理 3 项冲突</Button></div></section>
    <div className="brain-metric-grid"><BrainMetric value={`${productionStats.knowledgeDocuments} 份`} label="企业文档"/><BrainMetric value={`${productionStats.knowledgeEntries} 条`} label="行业知识"/><BrainMetric value={`${productionStats.knowledgeChunks.toLocaleString()} 段`} label="检索切片"/><BrainMetric value={`${moduleCount} 个`} label="展示模块"/><BrainMetric value="3 项" label="待确认承诺" soft/></div>
    <div className="brain-filter-row"><div><Pill tone="positive">结构化事实已填充</Pill><Pill>行业库 362 条</Pill><Pill tone="warning">原始出处待回填</Pill><Pill tone="warning">冲突 3</Pill><Pill tone="info">对话资料已隔离</Pill></div><span>AKKE 生产快照｜{PRODUCTION_SNAPSHOT_AT}</span></div>
    <div className="brain-category-grid">{groupKeys.map(key => { const group = brainGroups[key]; return <section className="brain-category" key={key}><div className="brain-category-head"><h3>{group.title}</h3><Pill tone={key === "unique" ? "positive" : "neutral"}>{group.modules.length} 个模块</Pill></div><p>{group.caption}</p><div className="brain-module-lines">{group.modules.map(module => <div key={module.code}><span><b>{module.code}</b>｜{module.title}</span><em>{module.meta}</em></div>)}</div><Button kind="primary" onClick={() => goTo(group.destination)}>查看{key === "core" ? "企业核心" : key === "industry" ? "行业通用" : "企业独有"}</Button></section>; })}</div>
    <section className="brain-expansion-strip"><div><h3>D｜知识来源与隔离规则</h3><p>每份文档可覆盖多个模块；无法归类的主题才生成新模块候选。</p></div><div><b>67 份企业文档的真实分类</b><div className="brain-expansion-lines">{knowledgeDocumentCounts.map(([label,count])=><span key={label}><strong>{count}</strong> {label}</span>)}</div><small>销售脚本只允许抽取产品、价格、流程等可验证事实，聊天技巧留在对话模块。</small></div><div><small>206 段历史对话<br/>36 条决策规则<br/>均未在公开页展开原文</small><Button onClick={() => goTo("brain-expansion")}>查看自动扩展规则</Button></div></section>
  </div>;
}

function LiveIndustryList({ entries, notify, selectedCategory, state }: { entries: PublicKnowledgeEntry[]; notify: (message: string) => void; selectedCategory?: string; state: "loading" | "live" | "fallback" }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const filtered = useMemo(() => entries.filter(entry => {
    const categoryOk = !selectedCategory || entry.category === selectedCategory;
    const haystack = `${entry.title} ${entry.summary ?? ""} ${entry.source ?? ""}`.toLowerCase();
    return categoryOk && haystack.includes(query.trim().toLowerCase());
  }).slice(0, 12), [entries, query, selectedCategory]);
  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0];
  const selectedEvidence = selected ? liveEntryEvidence(selected) : null;
  if (state === "loading") return <Card title="正在连接生产知识库"><p className="brain-card-copy">正在读取 kb_entries 的公开知识索引……</p></Card>;
  if (state === "fallback") return <Card title="生产库暂时无法连接" action={<Pill tone="warning">使用快照</Pill>}><p className="brain-card-copy">模块结构仍来自 {PRODUCTION_SNAPSHOT_AT} 的真实快照；刷新后会重新尝试连接。</p></Card>;
  return <Card title="真实知识条目" caption={`分类：${selectedCategory ?? "全部"} · 当前显示 ${filtered.length} 条`} action={<Pill tone="positive">实时</Pill>}>
    <div className="brain-kb-toolbar"><input aria-label="搜索生产知识" onChange={event => setQuery(event.target.value)} placeholder="搜索标题、摘要或来源" value={query}/><span>生产库共 {entries.length} 条</span></div>
    <div className="brain-kb-layout"><div className="brain-kb-list">{filtered.length ? filtered.map(item => <button className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span><b>{item.title}</b><small>{item.category ?? "未分类"}</small></span><i>›</i></button>) : <p>该筛选下暂无条目。</p>}</div><div className="brain-kb-detail">{selected && selectedEvidence ? <><Pill tone="positive">生产知识</Pill><h3>{selected.title}</h3><p>{selected.summary || "该条目暂无独立摘要。"}</p><section className="brain-kb-origin"><div><small>原始文件</small><b>{selectedEvidence.originalFilename || "原始文件名待补录"}</b></div><div><small>原文位置</small><span>{selectedEvidence.locator}</span></div><Pill tone="warning">{selectedEvidence.status === "missing_locator" ? "待补段落定位" : "待补录原件"}</Pill><Button onClick={() => notify(selectedEvidence.originalFileUrl ? "原文件已经关联；还需要回填页码、章节或段落后才能完整追溯" : "该知识条目还没有关联用户上传的原始文件")}>{selectedEvidence.originalFileUrl ? "检查出处" : "补录出处"}</Button></section><dl><div><dt>分类</dt><dd>{selected.category ?? "未分类"}</dd></div><div><dt>更新时间</dt><dd>{selected.updated_at ? new Date(selected.updated_at).toLocaleDateString("zh-CN") : "未记录"}</dd></div></dl></> : <p>选择左侧条目查看详情。</p>}</div></div>
  </Card>;
}

function BrainModuleScreen({ kind, goTo, notify }: { kind: BrainGroupKey; goTo: BrainScreenProps["goTo"]; notify: BrainScreenProps["notify"] }) {
  const group = brainGroups[kind];
  const [selected, setSelected] = useState(0);
  const { entries, state } = usePublicKnowledge();
  const activeModule = group.modules[selected] ?? group.modules[0];
  const moduleEvidence = resolveModuleEvidence(activeModule);
  return <div className="brain-page brain-module-page">
    <section className="brain-task-head"><div><h2>{group.title}｜{group.modules.length} 个真实模块</h2><p>{group.caption}。选择模块后查看生产内容、适用边界和证据来源。</p></div><div className="button-row">{kind === "industry" && <SourceStamp live={state === "live"} count={entries.length || undefined}/>}<Button onClick={() => goTo("brain-overview")}>返回知识全景</Button></div></section>
    <div className="brain-module-browser"><Card title="模块目录" caption={`${group.modules.length} 个模块 · 点击切换`} className="brain-module-nav-card"><div>{group.modules.map((item,index)=><button className={selected === index ? "active" : ""} key={item.code} onClick={() => setSelected(index)} type="button"><span><b>{item.code}</b><em>{item.title}</em></span><Pill tone={item.state === "warning" ? "warning" : item.state === "info" ? "info" : "positive"}>{item.meta}</Pill></button>)}</div></Card><div className="brain-module-detail"><section className="brain-detail-title"><div><Pill tone={activeModule.state === "warning" ? "warning" : "positive"}>{activeModule.code} · {activeModule.state === "warning" ? "含待确认项" : "生产内容"}</Pill><h2>{activeModule.title}</h2><p>{activeModule.intro}</p></div>{activeModule.state === "warning" && <Button onClick={() => goTo("brain-decisions")}>处理待确认内容</Button>}</section><Card title="结构化内容" caption="由真实生产资料抽取并为公开展示做了脱敏"><div className="brain-structured-facts">{activeModule.facts.map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div></Card>{kind === "industry" && <LiveIndustryList entries={entries} notify={notify} selectedCategory={activeModule.liveCategory} state={state}/>}<EvidencePanel evidence={moduleEvidence} notify={notify}/></div></div>
  </div>;
}

function BrainDecisionsScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  return <div className="brain-page"><section className="brain-task-head"><div><h2>待决策中心｜3 个承诺冲突 + 1 个表达边界</h2><p>全部来自生产资料交叉比对；在负责人选择前，系统不会把冲突内容自动承诺给客户。</p></div><Button onClick={() => notify("服务覆盖表达边界已采用 AI 推荐；3 个承诺冲突仍需人工确认")}>接受低风险边界规则</Button></section><div className="brain-decision-summary"><BrainMetric value="2 项" label="高风险事实" soft/><BrainMetric value="1 项" label="中风险事实"/><BrainMetric value="1 项" label="表达边界"/><BrainMetric value="约 8 分钟" label="预计工作量"/></div><div className="brain-decision-list">{realConflicts.map((item,index)=><article key={item.id}><span className="brain-decision-index">0{index+1}</span><div><small>{item.level}</small><h3>{item.title}</h3><p>{item.issue}</p><b>{item.recommendation}</b></div><Pill tone={index < 2 ? "warning" : index === 2 ? "neutral" : "info"}>{index < 3 ? "必须确认" : "可采用推荐"}</Pill><Button kind={index === 0 ? "primary" : "default"} onClick={() => index === 0 ? goTo("brain-conflict") : notify(`已打开“${item.title}”的真实来源对比`)}>{index === 0 ? "开始选择" : "查看选项"}</Button></article>)}</div></div>;
}

function BrainConflictScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const [choice, setChoice] = useState("safe");
  const options = [
    { id: "profile", title: "选项 A｜采用品牌档案口径", desc: "定金 2000 元；7 天冷静期内可退款，量尺后不支持取消。", meta: "原始文件名与段落待补录｜当前只有派生后的品牌档案" },
    { id: "faq", title: "选项 B｜采用高频问答口径", desc: "不承诺任何退款条件、不主动说“不退”、也不给时限型承诺。", meta: "当前抽取条目：《客户高频问题（价格/退定/时间）》｜原始出处待补录" },
    { id: "safe", title: "AI 推荐｜自动回复不承诺，转人工按合同核对", desc: "保留两份原始口径；机器人只说明定金计入总价，退款问题交给负责人按正式合同判断。", meta: "在正式合同与责任人确认前，风险最低" },
  ];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>选择题 1 / 3｜确定定金退款口径</h2><p>两个抽取结果发生冲突，但原始文件与段落尚未补齐；完成选择也不能绕过出处门禁。</p></div><Pill tone="warning">高风险承诺</Pill></section><section className="brain-question-banner"><div><b>客户追问“交了 2000 元定金能退吗”，系统应该怎么回答？</b><span>影响：企微自动接待、报价、合同说明与沉默客户召回</span></div><Pill tone="warning">3 个候选</Pill></section><div className="brain-conflict-layout"><div className="brain-choice-list">{options.map(option=><label className={choice === option.id ? "selected" : ""} key={option.id}><input checked={choice === option.id} name="refund-choice" onChange={() => setChoice(option.id)} type="radio"/><span><b>{option.title}</b><p>{option.desc}</p><small>{option.meta}</small></span></label>)}<section className="brain-formal-preview"><div><b>选择后的正式知识预览</b><Pill tone="warning">缺原始出处</Pill></div><p>{choice === "profile" ? "定金 2000 元计入总价；7 天冷静期内可退款，量尺后不支持取消。" : choice === "faq" ? "定金计入总价；退款条件不由机器人承诺，请联系订单负责人核对。" : "定金 2000 元计入总价。关于退款，请以当前正式合同和订单状态为准，由订单负责人为您核对；机器人不作时限或退款承诺。"}</p><Button kind="primary" onClick={() => { notify("已保存业务选择；仍需补齐原始文件和段落后才能发布"); goTo("brain-decisions"); }}>保存业务选择</Button></section></div><Card title="原始资料依据"><div className="brain-evidence-list"><div><b>原始文件名待补录</b><span>当前派生档案写有“7 天冷静期”和“量尺后不可取消”</span><Pill tone="warning">无原件</Pill></div><div><b>原始文件名待补录</b><span>抽取条目《客户高频问题（价格/退定/时间）》要求不承诺退款条件与时限</span><Pill tone="warning">无段落定位</Pill></div><div><b>需要补充的最终证据</b><span>当前正式合同模板：退款章节、条款编号和生效版本</span><Pill tone="warning">发布阻塞</Pill></div></div><div className="brain-ai-reason"><b>AI 为什么推荐临时安全方案</b><p>两份内容互相否定，且都没有完整原始出处。系统只能暂停自动承诺并转人工，不能把数据库记录当作证据。</p></div></Card></div></div>;
}

function BrainExpansionScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  return <div className="brain-page"><section className="brain-task-head"><div><h2>AI 自动扩展模块｜样板房运营规则</h2><p>“样板房参观规则”和“568 样板房专项政策”形成独立业务主题，建议从活动政策中拆成可复用模块。</p></div><Button onClick={() => goTo("brain-overview")}>返回企业大脑全景</Button></section><div className="brain-expansion-status"><BrainMetric value="2 条" label="抽取内容"/><BrainMetric value="0 份" label="原件已关联" soft/><BrainMetric value="1 个" label="新模块候选"/><BrainMetric value="0 项" label="凭空生成"/></div><div className="brain-two-column expansion"><Card title="企业独有 / 样板房运营规则" caption="候选编号 EXT-001 · 由生产资料自动形成"><div className="brain-structured-facts">{[["活动基础价","568 元/投影㎡，原价 868 元/㎡"],["价格来源","总部补贴 300 元/㎡形成样板房专项价"],["名额规则","按套、按小区申请；使用前读取活动库实时名额"],["品质说明","样板房优先配置资深设计师和高评分安装班组"],["守价纪律","全国统一公开价格，不因客户或谈判改变"],["参观规则","现有资料已识别该主题，详细适用条件需在正式页核对"]].map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div><div className="button-row"><Button kind="primary" onClick={() => { notify("已确认候选结构；原始文件和段落未补齐前仍保持草稿"); goTo("brain-release"); }}>确认模块结构</Button><Button onClick={() => notify("已保留候选，不影响当前生产知识")}>暂不发布</Button></div></Card><div className="stack"><Card title="为什么建议拆成新模块"><p className="brain-card-copy">它同时包含名额、守价、参观、团队配置和活动库校验，已超出单一价格事实；拆开后可被企微、视频和召回共同调用。</p></Card><Card title="原始资料依据"><div className="brain-source-list">{["样板房专项政策：568 是怎么来的","样板房参观规则"].map((item,index)=><div key={item}><i>{index+1}</i><span><b>原始文件名待补录</b><small>当前抽取条目：{item} · 页码与段落待补录</small></span><Pill tone="warning">出处不完整</Pill></div>)}</div></Card><Card title="扩展原则"><p className="brain-card-copy">AI 可以新增目录和字段，但不能补写企业没有提供的承诺、价格、有效期或服务能力；缺原始出处时不得发布。</p></Card></div></div></div>;
}

function BrainReleaseScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const checks = [["原始出处完整性","企业核心资料缺原始文件、版本和段落定位","阻塞"],["隐私检查","对话原文、完整地址和密钥不进入公开页","通过"],["内容边界","聊天节奏和销售技巧未进入企业大脑","通过"],["定金退款","两个抽取结果冲突，等待原始合同和负责人选择","阻塞"],["加急政策","周期和费率存在多个版本，等待确认","阻塞"],["售后 SLA","两套响应时限尚未统一","阻塞"]];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>生产快照发布检查｜{PRODUCTION_SNAPSHOT_AT}</h2><p>除了 3 个承诺冲突，原始出处不完整本身也是阻塞项；数据库表名和抽取标题不能代替原件。</p></div><Button disabled kind="primary">解决 4 项阻塞后发布</Button></section><div className="brain-version-compare"><section><div><b>当前公开原型</b><Pill tone="neutral">结构化事实</Pill></div><p>页面结构和真实业务内容已可评审</p><small>当前版本曾错误地把数据库位置显示为来源</small></section><section className="draft"><div><b>出处模型草稿</b><Pill tone="warning">待回填</Pill></div><p>原始文件 → 内容块 → 知识事实 → 证据关系</p><small>原件或段落缺失时自动阻塞发布</small></section></div><div className="brain-release-metrics"><BrainMetric value="67 份" label="抽取后企业资料"/><BrainMetric value="362 条" label="行业条目"/><BrainMetric value="2,987 段" label="检索切片"/><BrainMetric value="4 项" label="发布阻塞" soft/><BrainMetric value="206 段" label="对话已隔离"/></div><div className="brain-release-grid"><Card title="发布质量检查" action={<Pill tone="warning">4 项待处理</Pill>}><div className="brain-check-list">{checks.map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone={row[2] === "通过" ? "positive" : "warning"}>{row[2]}</Pill></div>)}</div></Card><Card title="新的证据链"><div className="brain-change-list">{[["原始文件","保存文件名、对象地址、哈希、上传时间和版本","必须"],["原始内容块","保存页码、标题路径、段落、单元格或时间码","必须"],["知识事实","品牌、产品、价格、流程等结构化结果","派生"],["证据关系","标明支持、冲突或取代哪条事实","必须"],["历史销售对话","不作为企业大脑的原始业务事实","隔离"],["数据库记录","只用于系统实现，不显示为用户来源","隐藏"]].map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone={row[2] === "必须" ? "warning" : row[2] === "隔离" ? "info" : "neutral"}>{row[2]}</Pill></div>)}</div></Card></div><section className="brain-publish-footer"><div><b>当前正确动作</b><span>先回填原始文件与段落，再完成定金、加急和售后三道业务选择题。</span></div><Button kind="primary" onClick={() => { notify("已返回资料收集箱，准备重新关联原始文件"); goTo("brain-inbox"); }}>去补录原始出处</Button></section><Card title="对话资料隔离统计" caption="只用于企微对话训练，不作为企业大脑模块"><div className="brain-fact-list">{conversationStageCounts.map(([stage,count,score])=><div key={stage}><span><b>{stage}</b><small>平均质量分 {score}</small></span><Pill>{count} 段</Pill></div>)}</div></Card></div>;
}

export function BrainScreenContent({ id, goTo, notify }: BrainScreenProps & { id: string }) {
  switch (id) {
    case "brain-inbox": return <BrainInboxScreen goTo={goTo} notify={notify} />;
    case "brain-processing": return <BrainProcessingScreen goTo={goTo} />;
    case "brain-overview": return <BrainOverviewScreen goTo={goTo} />;
    case "brain-core": return <BrainModuleScreen kind="core" goTo={goTo} notify={notify} />;
    case "brain-industry": return <BrainModuleScreen kind="industry" goTo={goTo} notify={notify} />;
    case "brain-unique": return <BrainModuleScreen kind="unique" goTo={goTo} notify={notify} />;
    case "brain-decisions": return <BrainDecisionsScreen goTo={goTo} notify={notify} />;
    case "brain-conflict": return <BrainConflictScreen goTo={goTo} notify={notify} />;
    case "brain-expansion": return <BrainExpansionScreen goTo={goTo} notify={notify} />;
    case "brain-release": return <BrainReleaseScreen goTo={goTo} notify={notify} />;
    default: return <div>企业大脑页面准备中</div>;
  }
}
