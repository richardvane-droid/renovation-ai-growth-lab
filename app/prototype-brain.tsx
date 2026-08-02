"use client";

import { useState, type ReactNode } from "react";

type BrainScreenProps = {
  goTo: (id: string, context?: Record<string, string>) => void;
  notify: (message: string) => void;
};

type Tone = "neutral" | "positive" | "warning" | "danger" | "info";

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Button({
  children,
  disabled,
  kind = "default",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  kind?: "default" | "primary" | "danger" | "ghost";
  onClick?: () => void;
}) {
  return <button className={`ui-button ui-button-${kind}`} disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function Card({
  action,
  caption,
  children,
  className = "",
  title,
}: {
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

export function resetBrainWorkflowDemo() {
  // V5 uses local component state; refreshing the prototype restores the demo.
}

type BrainModule = {
  code: string;
  title: string;
  meta: string;
  state?: string;
};

type BrainGroupKey = "core" | "industry" | "unique";

const brainGroups: Record<BrainGroupKey, {
  title: string;
  caption: string;
  count: number;
  destination: string;
  modules: BrainModule[];
}> = {
  core: {
    title: "A｜企业核心",
    caption: "企业是谁、卖什么、服务谁、哪些内容可以承诺",
    count: 9,
    destination: "brain-core",
    modules: [
      { code: "C01", title: "品牌定位与价值主张", meta: "12 条" },
      { code: "C02", title: "目标客户与业务场景", meta: "18 条" },
      { code: "C03", title: "产品与服务矩阵", meta: "23 条" },
      { code: "C04", title: "套餐与计价规则", meta: "20 条" },
      { code: "C05", title: "板材 / 五金 / 门板配置", meta: "31 条" },
      { code: "C06", title: "服务区域与门店网络", meta: "59 城" },
      { code: "C07", title: "活动政策 / 名额 / 周期", meta: "9 条" },
      { code: "C08", title: "承诺边界与风险红线", meta: "14 条" },
      { code: "C09", title: "官方内容与资质资产", meta: "15 图" },
    ],
  },
  industry: {
    title: "B｜行业通用",
    caption: "全屋定制行业通用工序、术语、方法和验收经验",
    count: 10,
    destination: "brain-industry",
    modules: [
      { code: "I01", title: "装修业态与品类词典", meta: "16 条" },
      { code: "I02", title: "需求采集与房屋信息", meta: "11 条" },
      { code: "I03", title: "初尺 / 上门量房标准", meta: "14 条" },
      { code: "I04", title: "空间规划与方案设计", meta: "18 条" },
      { code: "I05", title: "投影面积与报价方法", meta: "13 条" },
      { code: "I06", title: "合同 / 付款 / 变更原则", meta: "12 条" },
      { code: "I07", title: "复尺 / 拆单 / 下单", meta: "10 条" },
      { code: "I08", title: "生产 / 质检 / 排产", meta: "15 条" },
      { code: "I09", title: "配送 / 安装 / 验收", meta: "17 条" },
      { code: "I10", title: "售后 / 环保 / 甲醛", meta: "9 条" },
    ],
  },
  unique: {
    title: "C｜企业独有",
    caption: "有大有小实际执行的价格、流程、服务能力和例外",
    count: 12,
    destination: "brain-unique",
    modules: [
      { code: "E01", title: "568 套餐口径", meta: "已发布", state: "positive" },
      { code: "E02", title: "498 / 568 活动版本", meta: "待确认", state: "warning" },
      { code: "E03", title: "59 城覆盖 / 远程服务", meta: "待补充" },
      { code: "E04", title: "量房到安装 SOP", meta: "已发布", state: "positive" },
      { code: "E05", title: "岗位角色 / 负责人 / SLA", meta: "已发布", state: "positive" },
      { code: "E06", title: "付款节点 / 开票", meta: "待确认", state: "warning" },
      { code: "E07", title: "合同 / 退改 / 补单", meta: "已发布", state: "positive" },
      { code: "E08", title: "免费上门量房规则", meta: "已发布", state: "positive" },
      { code: "E09", title: "自动报价 / 隐性费用", meta: "已发布", state: "positive" },
      { code: "E10", title: "官方海报 / 配发规则", meta: "15 张" },
      { code: "E11", title: "户型定制清单能力边界", meta: "人工" },
      { code: "E12", title: "地区 / 品牌 / 数字硬校验", meta: "草稿" },
    ],
  },
};

const brainExpansionModules: BrainModule[] = [
  { code: "X01", title: "设计师渠道合作", meta: "已建" },
  { code: "X02", title: "工程项目投标", meta: "候选" },
  { code: "X03", title: "区域临时活动", meta: "自动识别" },
  { code: "X04", title: "新材料 / 新套餐", meta: "自动识别" },
  { code: "X05", title: "门店差异政策", meta: "自动识别" },
  { code: "X06", title: "客诉 / 例外处理", meta: "自动识别" },
];

function BrainMetric({ value, label, soft = false }: { value: string; label: string; soft?: boolean }) {
  return <div className={`brain-metric ${soft ? "soft" : ""}`}><b>{value}</b><span>{label}</span></div>;
}

function BrainInboxScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const files = [
    ["2026 暑期焕新活动政策.pdf", "PDF · 18 页 · 4.2 MB", "已完成", "产品、政策已更新"],
    ["568 套餐报价口径.xlsx", "Excel · 6 个工作表", "抽取中 82%", "已抽取 27 条事实"],
    ["量房到安装 SOP.docx", "Word · 32 页", "正在匹配", "预计覆盖 6 个模块"],
    ["有大有小品牌手册.pdf", "PDF · 24 页", "已完成", "定位、画像已更新"],
    ["设计师渠道合作政策.docx", "Word · 11 页", "发现新模块", "建议新增渠道合作"],
  ];
  return <div className="brain-page brain-inbox-page">
    <section className="brain-task-head"><div><h2>上传企业资料，AI 自动建设企业大脑</h2><p>无需分类；PDF、Word、Excel、PPT 和扫描件都可以直接上传。</p></div><Button kind="primary" onClick={() => notify("演示：已选择 3 份企业资料并加入处理队列")}>上传文件 / 文件夹</Button></section>
    <button className="brain-dropzone" onClick={() => notify("演示：拖放区域已接收文件") } type="button"><b>↑</b><strong>拖拽企业文件到这里，或点击选择文件夹</strong><span>系统会自动识别所属模块、抽取企业事实并保留原文证据</span></button>
    <div className="brain-metric-grid compact"><BrainMetric value="12 份" label="本次上传"/><BrainMetric value="7 个" label="更新模块"/><BrainMetric value="86 条" label="新增知识"/><BrainMetric value="4 项" label="待做选择" soft/></div>
    <Card title="最近上传的企业资料" caption="生产资料示例；点击一项查看处理详情">
      <div className="brain-file-list">{files.map((file, index) => <button key={file[0]} onClick={() => goTo("brain-processing", { fileName: file[0] })} type="button"><span className="brain-file-icon">{index === 1 ? "XLS" : index === 2 || index === 4 ? "DOC" : "PDF"}</span><span><b>{file[0]}</b><small>{file[1]}</small></span><Pill tone={file[2].includes("完成") ? "positive" : file[2].includes("新") ? "warning" : "neutral"}>{file[2]}</Pill><em>{file[3]}</em><i>›</i></button>)}</div>
    </Card>
    <section className="brain-source-tip"><b>系统建议继续补充</b><span>合同与订单模板 · 售后质保政策 · 门店交付检查表</span><small>这些资料目前覆盖不足，会在全景页显示为“缺资料”。</small></section>
  </div>;
}

function BrainProcessingScreen({ goTo }: Pick<BrainScreenProps, "goTo">) {
  const stages = ["解析文件", "识别表格", "抽取事实", "匹配模块", "比较旧知识", "生成选择题", "写入草稿"];
  return <div className="brain-page">
    <section className="brain-task-head"><div><h2>568 套餐报价口径.xlsx</h2><p>上传于 14:32 · 6 个工作表 · 系统自动识别 5 个已有模块</p></div><Pill tone="warning">处理中 68%</Pill></section>
    <Card title="文档处理进度" caption="可以离开本页，处理会在后台继续"><div className="brain-processing-progress"><Progress value={68}/><b>预计还需 1 分 40 秒</b></div><div className="brain-pipeline">{stages.map((stage, index) => <div className={index < 4 ? "done" : index === 4 ? "active" : ""} key={stage}><i>{index < 4 ? "✓" : index + 1}</i><span>{stage}</span></div>)}</div></Card>
    <div className="brain-two-column">
      <Card title="已抽取的模块覆盖" caption="原文件不会直接作为最终答案"><div className="brain-fact-list">{[["套餐与计价规则","12 条事实","C04"],["付款节点 / 开票","5 条事实","E06"],["活动政策 / 周期","4 条事实","C07"],["渠道合作","3 条事实","AI 新模块"]].map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone={row[2].includes("AI")?"warning":"positive"}>{row[2]}</Pill></div>)}</div></Card>
      <Card title="原文件证据" caption="每条事实均能定位到工作表和单元格"><div className="brain-evidence-list"><div><b>当前活动价 568 元/投影㎡</b><span>工作表「套餐报价」C12</span></div><div><b>原价 868 元/投影㎡</b><span>工作表「套餐报价」C9</span></div><div><b>活动有效期至 2026-08-31</b><span>工作表「活动版本」B6</span></div><div><b>付款方式存在旧版本</b><span>工作表「付款节点」D4 · 需要确认</span></div></div></Card>
    </div>
    <section className="brain-inline-action"><div><b>无需人工逐条录入</b><span>无冲突内容会自动写入草稿；价格、付款和活动差异会生成选择题。</span></div><Button kind="primary" onClick={() => goTo("brain-decisions")}>进入待决策中心</Button></section>
  </div>;
}

function BrainOverviewScreen({ goTo }: Pick<BrainScreenProps, "goTo">) {
  return <div className="brain-page brain-overview-page">
    <section className="brain-task-head"><div><h2>AKKE 企业知识全景｜有大有小</h2><p>67 份生产资料自动拆成 37 个模块；只沉淀企业事实、行业知识和履约标准。5 份对话资料仅抽取可验证事实。</p></div><div className="button-row"><Button onClick={() => goTo("brain-inbox")}>继续上传资料</Button><Button kind="primary" onClick={() => goTo("brain-decisions")}>处理 4 项冲突</Button></div></section>
    <div className="brain-metric-grid"><BrainMetric value="67 份" label="来源资料"/><BrainMetric value="37 个" label="知识模块"/><BrainMetric value="289 条" label="发布事实"/><BrainMetric value="4 项" label="待确认冲突" soft/><BrainMetric value="2 个" label="AI 候选模块" soft/></div>
    <div className="brain-filter-row"><div><Pill>全部 37</Pill><Pill tone="positive">已发布 29</Pill><Pill tone="warning">待确认 4</Pill><Pill>缺资料 2</Pill><Pill tone="info">AI 扩展 2</Pill></div><span>AKKE 生产库直查｜2026-07-30</span></div>
    <div className="brain-category-grid">{(Object.keys(brainGroups) as BrainGroupKey[]).map(key => {const group=brainGroups[key];return <section className="brain-category" key={key}><div className="brain-category-head"><h3>{group.title}</h3><Pill tone={key==="unique"?"positive":"neutral"}>{group.count} 个模块</Pill></div><p>{group.caption}</p><div className="brain-module-lines">{group.modules.map(module=><div key={module.code}><span><b>{module.code}</b>｜{module.title}</span><em>{module.meta}</em></div>)}</div><Button kind="primary" onClick={() => goTo(group.destination)}>查看{key==="core"?"企业核心":key==="industry"?"行业通用":"企业独有"}</Button></section>;})}</div>
    <section className="brain-expansion-strip"><div><h3>D｜AI 动态扩展</h3><p>新文档出现独立业务主题时自动扩展目录；无法归类才建草稿，资料不足只保留候选。</p></div><div><b>当前动态目录｜6 个模块</b><div className="brain-expansion-lines">{brainExpansionModules.map(item=><span key={item.code}><strong>{item.code}</strong> {item.title}（{item.meta}）</span>)}</div><small>来源结构：产品 23 · 价格 20 · 流程 14 · 常见问答 5 · 对话资料 5（仅抽取事实）</small></div><div><small>本次由 3 份渠道资料触发<br/>1 个已建 · 1 个候选</small><Button kind="primary" onClick={() => goTo("brain-expansion")}>查看扩展模块</Button></div></section>
  </div>;
}

const brainModuleDetails: Record<BrainGroupKey, {
  heading: string;
  intro: string;
  facts: [string,string][];
  sources: string[];
}> = {
  core: { heading: "568 元/投影㎡套餐", intro: "当前生效的产品与价格事实，适用于 2026 暑期焕新活动。", facts: [["主营品类","衣柜 / 橱柜 / 榻榻米 / 全屋柜体"],["价格口径","568 元/投影㎡；原价 868 元/投影㎡"],["板材配置","兔宝宝 / 莫干山 / 千年舟 ENF 多层板"],["五金门板","悍高五金 · 双面 PET 门板 · PUR 封边"],["服务范围","福建漳州、厦门；设计、安装、售后全包"],["明确不含","油工、乳胶漆和商铺整案"]], sources: ["《暑期焕新活动政策.pdf》P6", "《568 套餐报价口径.xlsx》C12", "《有大有小品牌手册.pdf》P14"] },
  industry: { heading: "复尺与下单｜行业标准", intro: "初版方案确认后，以现场复尺结果作为拆单、报价和生产的唯一尺寸依据。", facts: [["前置条件","水电点位和墙地面完成；方案、颜色、五金已确认"],["必查尺寸","墙体垂直度、阴阳角、梁柱、门套、插座和设备位"],["输出物","复尺图、拆单清单、报价变更单、客户确认记录"],["行业警戒","初尺尺寸不得直接下单；隐蔽工程照片必须留档"],["企业覆盖","有大有小要求 24 小时内完成复尺记录上传"]], sources: ["《全屋定制工序标准.pdf》P22", "《复尺检查表.xlsx》Sheet1", "《门店量房到安装 SOP.docx》4.2"] },
  unique: { heading: "有大有小｜量房到安装 SOP", intro: "企业实际执行的七阶段履约流程，包含负责人、时效、输入输出和异常处理。", facts: [["01 预约确认","销售确认地址、户型、时间和现场联系人"],["02 上门量房","量房师拍照、测量并记录设备与管线"],["03 方案报价","设计师 48 小时内提交初版方案和报价"],["04 合同付款","确认产品、交期、付款节点和变更规则"],["05 复尺下单","复尺数据经客户确认后进入拆单生产"],["06 配送安装","项目经理协调到货、安装和现场保护"],["07 验收售后","按检查表验收并建立售后档案"]], sources: ["《量房到安装 SOP.docx》v8", "《岗位责任表.xlsx》2026-07", "《安装验收检查表.pdf》v5"] },
};

function BrainModuleScreen({ kind, goTo }: { kind: BrainGroupKey; goTo: BrainScreenProps["goTo"] }) {
  const group=brainGroups[kind];
  const detail=brainModuleDetails[kind];
  const [selected,setSelected]=useState(0);
  const selectedModule=group.modules[selected] ?? group.modules[0];
  return <div className="brain-page brain-module-page">
    <section className="brain-task-head"><div><h2>{group.title}｜{group.count} 个模块</h2><p>{group.caption}。左侧选择模块，右侧查看当前生效内容和原文件证据。</p></div><Button onClick={() => goTo("brain-overview")}>返回知识全景</Button></section>
    <div className="brain-module-browser"><Card title="模块目录" caption={`${group.count} 个模块 · 点击切换`} className="brain-module-nav-card"><div>{group.modules.map((module,index)=><button className={selected===index?"active":""} key={module.code} onClick={()=>setSelected(index)} type="button"><span><b>{module.code}</b><em>{module.title}</em></span><Pill tone={module.state==="positive"?"positive":module.state==="warning"?"warning":"neutral"}>{module.meta}</Pill></button>)}</div></Card><div className="brain-module-detail"><section className="brain-detail-title"><div><Pill tone="positive">{selectedModule.code} · 当前生效</Pill><h2>{selected===0?detail.heading:selectedModule.title}</h2><p>{selected===0?detail.intro:"该模块已经由企业资料自动填充；下方展示当前生效结构和来源示例。"}</p></div><Button onClick={() => goTo("brain-decisions")}>查看待决策内容</Button></section><Card title="结构化内容" caption="内容可编辑；发布时保留修改人、时间和原始证据"><div className="brain-structured-facts">{detail.facts.map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div></Card><Card title="来源证据与适用范围"><div className="brain-source-list">{detail.sources.map((source,index)=><div key={source}><i>{index+1}</i><span><b>{source}</b><small>{index===0?"正式制度 · 当前有效":"交叉来源 · 已核对"}</small></span><Pill tone="positive">可追溯</Pill></div>)}</div></Card></div></div>
  </div>;
}

function BrainDecisionsScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const decisions=[
    ["高风险事实","产品与服务 · 568 套餐活动价","旧资料 498 元/投影㎡；新政策 568 元/投影㎡","AI 推荐：按有效期分别保留"],
    ["高风险事实","商务政策 · 付款方式","报价表、合同模板的付款节点不一致","需要企业负责人确认"],
    ["中风险事实","服务区域 · 吉安覆盖","知识库写全国服务；服务点清单无吉安直营店","AI 推荐：以 59 城清单为准"],
    ["目录决策","设计师渠道合作模块归属","3 份资料形成独立业务主题","AI 推荐：创建独立模块"],
  ];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>待决策中心｜4 项</h2><p>只有会影响价格、付款、服务范围和企业承诺的真实冲突才需要人工确认。</p></div><Button onClick={()=>notify("已接受 2 项低风险 AI 推荐；高风险事实仍需逐项确认")}>接受低风险推荐</Button></section><div className="brain-decision-summary"><BrainMetric value="2 项" label="高风险事实" soft/><BrainMetric value="1 项" label="中风险事实"/><BrainMetric value="1 项" label="目录决策"/><BrainMetric value="约 8 分钟" label="预计工作量"/></div><div className="brain-decision-list">{decisions.map((row,index)=><article key={row[1]}><span className="brain-decision-index">0{index+1}</span><div><small>{row[0]}</small><h3>{row[1]}</h3><p>{row[2]}</p><b>{row[3]}</b></div><Pill tone={index<2?"warning":index===2?"neutral":"info"}>{index<2?"必须确认":"可采用推荐"}</Pill><Button kind={index===0?"primary":"default"} onClick={()=>index===0?goTo("brain-conflict"):notify(`演示：已打开“${row[1]}”`)}>{index===0?"开始选择":"查看选项"}</Button></article>)}</div></div>;
}

function BrainConflictScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const [choice,setChoice]=useState("fused");
  const options=[
    {id:"old",title:"选项 A｜498 元/投影㎡",desc:"直接采用《五一焕新活动政策》中的价格",meta:"有效期：2026-05-01 至 05-31 · 已过期"},
    {id:"new",title:"选项 B｜568 元/投影㎡",desc:"直接采用《暑期焕新活动政策》中的价格",meta:"有效期：2026-07-01 至 08-31 · 当前有效"},
    {id:"fused",title:"AI 推荐｜按有效期融合两个价格版本",desc:"五一期间保留 498 元；当前暑期活动使用 568 元，并保留历史版本",meta:"不删除旧政策，按生效时间自动选择"},
  ];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>选择题 1 / 4｜确定活动价格口径</h2><p>系统保留每个候选的原文件、有效时间和来源证据，并同时给出融合结果。</p></div><Pill tone="warning">高风险事实</Pill></section><section className="brain-question-banner"><div><b>568 套餐当前应该使用哪个活动价格？</b><span>影响：产品服务、商务政策、企微报价和门店报价单</span></div><Pill tone="warning">3 个候选</Pill></section><div className="brain-conflict-layout"><div className="brain-choice-list">{options.map(option=><label className={choice===option.id?"selected":""} key={option.id}><input checked={choice===option.id} name="price-choice" onChange={()=>setChoice(option.id)} type="radio"/><span><b>{option.title}</b><p>{option.desc}</p><small>{option.meta}</small></span></label>)}<section className="brain-formal-preview"><div><b>选择后的正式知识预览</b><Pill>将写入 v13</Pill></div><p>当前活动基础价为 568 元/投影㎡，原价 868 元/投影㎡；仅适用于 2026 暑期焕新活动并保留五一历史版本。</p><Button kind="primary" onClick={()=>{notify("已保存融合价格口径并更新企业大脑 v13 草稿");goTo("brain-decisions");}}>确认并返回下一题</Button></section></div><Card title="来源证据"><div className="brain-evidence-list"><div><b>《五一焕新活动政策.pdf》</b><span>P4｜498 元/投影㎡｜2026-05-31 失效</span></div><div><b>《暑期焕新活动政策.pdf》</b><span>P6｜568 元/投影㎡｜2026-08-31 失效</span></div><div><b>《套餐报价口径.xlsx》</b><span>C12｜当前报价 568 元｜持续有效</span></div></div><div className="brain-ai-reason"><b>AI 为什么推荐融合</b><p>两份文件并非同时有效，属于时间范围不同，而不是真实互相否定。按有效期分别保留最安全。</p></div></Card></div></div>;
}

function BrainExpansionScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  return <div className="brain-page"><section className="brain-task-head"><div><h2>AI 自动扩展模块｜设计师渠道合作</h2><p>上传资料出现现有目录无法覆盖的独立业务主题，系统已自动创建草稿模块。</p></div><Button onClick={()=>goTo("brain-overview")}>返回企业大脑全景</Button></section><div className="brain-expansion-status"><BrainMetric value="3 份" label="形成模块的资料"/><BrainMetric value="8 项" label="已抽取字段"/><BrainMetric value="1 个" label="自动创建模块"/><BrainMetric value="1 个" label="资料不足候选" soft/></div><div className="brain-two-column expansion"><Card title="企业独有标准 / 设计师渠道合作" caption="模块编号 EXT-008 · 草稿版本 v1"><div className="brain-structured-facts">{[["合作对象","室内设计师、独立工作室和设计机构"],["项目报备","客户姓名、项目地址、预计面积和报备时间"],["保护期","首次有效报备后 30 天"],["服务费","按合同回款节点结算；比例以渠道政策为准"],["冲突处理","同一客户重复报备时以首次完整资料为准"],["所需材料","渠道合作协议、收款信息和项目结算单"]].map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div><div className="button-row"><Button kind="primary" onClick={()=>{notify("已确认模块结构并加入 v13 草稿");goTo("brain-release");}}>确认模块结构</Button><Button onClick={()=>notify("已保留草稿，等待补充资料")}>暂不发布</Button></div></Card><div className="stack"><Card title="为什么创建新模块"><p className="brain-card-copy">3 份资料都在描述渠道合作对象、项目报备、服务费和结算，不属于产品、履约或付款政策的子条目。</p></Card><Card title="形成该模块的资料"><div className="brain-source-list">{["设计师渠道合作政策.docx","渠道结算说明.pdf","有大有小品牌手册.pdf"].map((item,index)=><div key={item}><i>{index+1}</i><span><b>{item}</b><small>{index===0?"主来源":"交叉来源"}</small></span><Pill tone="positive">已读取</Pill></div>)}</div></Card><Card title="资料不足的候选"><div className="brain-candidate-row"><span><b>工程项目投标</b><small>仅 1 份资料，暂不创建正式模块</small></span><Pill tone="warning">等待补充</Pill></div></Card></div></div></div>;
}

function BrainReleaseScreen({ goTo, notify }: Pick<BrainScreenProps, "goTo" | "notify">) {
  const checks=[["来源可追溯","375 / 375 条知识可回到原文件"],["冲突已处理","4 / 4 道选择题已有结论"],["高风险事实","价格、付款和活动均经人工确认"],["有效期检查","五一旧活动自动转为历史版本"],["模块结构","设计师渠道合作已独立建模"],["未知内容","2 项缺口保持未知，未自动编造"]];
  return <div className="brain-page"><section className="brain-task-head"><div><h2>准备发布｜企业大脑 v13</h2><p>本次由 5 份新文档、4 道选择题和 1 个扩展模块共同生成。</p></div><Button kind="primary" onClick={()=>notify("演示：企业大脑 v13 已发布，可随时回滚到 v12")}>发布 v13</Button></section><div className="brain-version-compare"><section><div><b>已发布大脑 v12</b><Pill tone="positive">线上使用中</Pill></div><p>289 条知识｜10 个模块｜2026-07-28 发布</p><small>当前被企微销售、视频生成和召回模块调用</small></section><section className="draft"><div><b>草稿大脑 v13</b><Pill tone="warning">准备发布</Pill></div><p>375 条知识｜11 个模块｜4 项决策已完成</p><small>发布后替换 v12，可随时回滚</small></section></div><div className="brain-release-metrics"><BrainMetric value="+86" label="新增知识"/><BrainMetric value="+1" label="扩展模块"/><BrainMetric value="4/4" label="已完成决策"/><BrainMetric value="-1" label="过期政策归档"/><BrainMetric value="5 份" label="新增资料"/></div><div className="brain-release-grid"><Card title="发布质量检查" action={<Pill tone="positive">全部通过</Pill>}><div className="brain-check-list">{checks.map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone="positive">通过</Pill></div>)}</div></Card><Card title="v12 → v13 主要变化"><div className="brain-change-list">{[["产品服务","568 套餐价格、配置和不包含项","更新 18 条"],["商务政策","按有效期保留 498 / 568 两个活动版本","更新 9 条"],["用户画像","补充改造阶段和旧改客户特征","更新 3 条"],["履约 SOP","新增上门量房和企微留档节点","更新 12 条"],["设计师渠道合作","从 3 份资料自动创建新模块","新增模块"],["售后与质保","仍缺少退款和赔付细则","保持缺口"]].map(row=><div key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><Pill tone={row[2].includes("缺口")?"warning":"neutral"}>{row[2]}</Pill></div>)}</div></Card></div><section className="brain-publish-footer"><div><b>安全发布</b><span>发布后保留完整版本记录；发现问题可一键回滚到 v12。</span></div><Button kind="primary" onClick={()=>{notify("已确认发布企业大脑 v13");goTo("brain-overview");}}>确认发布企业大脑 v13</Button></section></div>;
}

export function BrainScreenContent({
  id,
  goTo,
  notify,
}: BrainScreenProps & { id: string }) {
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
