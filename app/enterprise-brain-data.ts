export const PRODUCTION_SNAPSHOT_AT = "2026-08-02";

export const productionStats = {
  brandProfile: { total: 3, usable: 1 },
  knowledgeDocuments: 67,
  conversationExamples: 206,
  decisionRules: 36,
  knowledgeEntries: 362,
  knowledgeChunks: 2987,
};

export const knowledgeDocumentCounts = [
  ["产品与配置", 23],
  ["价格与商务政策", 20],
  ["履约流程", 14],
  ["高频问答", 5],
  ["销售脚本（隔离）", 5],
] as const;

export const conversationStageCounts = [
  ["持续培育", 117, "8.2"],
  ["决策推进", 74, "8.3"],
  ["破冰建联", 15, "7.7"],
] as const;

export type BrainFact = readonly [label: string, value: string];

export type BrainModule = {
  code: string;
  title: string;
  meta: string;
  state?: "positive" | "warning" | "neutral" | "info";
  intro: string;
  facts: readonly BrainFact[];
  sources: readonly string[];
  liveCategory?: string;
};

export type BrainGroupKey = "core" | "industry" | "unique";

export const coreModules: readonly BrainModule[] = [
  {
    code: "C01",
    title: "品牌定位与价值主张",
    meta: "生产档案",
    state: "positive",
    intro: "来自 brand_profile 与企业文化资料的当前品牌定义。",
    facts: [
      ["品牌", "有大有小"],
      ["定位", "大牌产品，低位价格；装修全品类一站式供应链"],
      ["使命", "为用户提供极致性价比的高质平价产品"],
      ["愿景", "和用户交朋友，成为世界全屋定制供应链典范"],
      ["核心能力", "硬装、软装、柜体定制及家电点位规划协同"],
      ["经营原则", "全国统一价、报价透明、资金进入公司账户"],
    ],
    sources: ["brand_profile｜有大有小｜更新于 2026-04-22", "knowledge_documents｜企业文化与三大承诺"],
  },
  {
    code: "C02",
    title: "产品与服务矩阵",
    meta: "24 个品类",
    state: "positive",
    intro: "生产档案中登记的主营品类与一站式服务边界。",
    facts: [
      ["柜体定制", "衣柜、橱柜、榻榻米、玄关柜、电视柜、阳台柜等全屋柜体"],
      ["硬装协同", "拆改、水电、泥瓦、木作、油工等按门店供应链能力承接"],
      ["软装协同", "窗帘、灯具、家具与空间搭配"],
      ["家电能力", "不直接销售家电，负责冰箱、洗烘、洗碗机等点位预留"],
      ["设计交付", "上门量尺、3D 方案、拆单、生产、安装与售后"],
      ["报价方式", "硬装与软装需量房后依据现场和选配生成报价"],
    ],
    sources: ["brand_profile｜product_categories（24 项）", "knowledge_documents｜产品配置详情（568基础配置）"],
  },
  {
    code: "C03",
    title: "价格体系与预算预估",
    meta: "20 份价格资料",
    state: "warning",
    intro: "当前基础计价、预算公式和付款节点；加急口径存在冲突，尚未直接发布为承诺。",
    facts: [
      ["基础价", "568 元/投影㎡；江浙沪、北京、深圳另加 100 元/㎡"],
      ["房产证口径", "约 284 元/房产证㎡，用于早期预算沟通，不替代实测报价"],
      ["预算公式", "房产面积 ÷ 2 × 568 ×（1 + 配置系数）"],
      ["配置系数", "标配 10% / 高配 20% / 豪配 30%；超过 30% 建议复核"],
      ["定金", "2000 元，计入总价并支付至总部账户"],
      ["付款节点", "签约支付合同款 80% 减定金；出货前支付 20% 尾款"],
    ],
    sources: ["knowledge_documents｜价格体系与预算预估", "brand_profile｜价格口径与 FAQ"],
  },
  {
    code: "C04",
    title: "板材 / 门板 / 五金配置",
    meta: "23 份产品资料",
    state: "positive",
    intro: "568 基础配置及可选升级项，全部来自生产知识文档。",
    facts: [
      ["柜体", "兔宝宝 / 莫干山 / 千年舟 18mm ENF 多层板，PUR 封边"],
      ["背板", "标配 9mm ENF 多层板卡槽工艺；升级 18mm 加 60 元/㎡"],
      ["柜门", "18mm 净竹板、MDI 胶、双面 PET、肤感门板"],
      ["五金", "DTC / 悍高二段力阻尼铰链、三节阻尼轨道；精诺三合一"],
      ["抽屉", "每 3㎡投影面积赠 1 个 600mm 内标准抽屉，超出 240 元/个"],
      ["颜色", "单订单超过 3 个颜色，每增加 1 个加收 500 元"],
    ],
    sources: ["knowledge_documents｜产品配置详情（568基础配置）", "knowledge_documents｜客户高频问题（产品规格）"],
  },
  {
    code: "C05",
    title: "服务区域与门店网络",
    meta: "59 城覆盖",
    state: "warning",
    intro: "服务覆盖与实体门店严格分开，避免把合作服务点误说成直营门店。",
    facts: [
      ["实体门店", "生产资料登记 11 个城市 / 区域门店；公开原型不展示详细地址"],
      ["服务覆盖", "59 个城市可由合作装企、设计师和量尺师傅提供服务"],
      ["允许表达", "“您所在城市有网络服务点，可安排量尺和设计”"],
      ["禁止表达", "网络服务点不得称为门店、直营店，也不得虚构门店地址"],
      ["清单外处理", "说明当地暂无直营门店，并查询最近可服务网点"],
      ["运输边界", "距最近服务中心 50km 内免物流费，超出按 8 元/km"],
    ],
    sources: ["knowledge_documents｜全国门店地址清单（地址已脱敏）", "knowledge_documents｜全国网络服务点城市清单"],
  },
  {
    code: "C06",
    title: "样板房活动政策",
    meta: "当前业务口径",
    state: "positive",
    intro: "568 样板房专项政策的价格来源、名额逻辑和守价纪律。",
    facts: [
      ["价格来源", "ENF 多层实木板原价 868 元/㎡，总部补贴 300 元形成 568 元/㎡"],
      ["名额单位", "按套申请；每个小区名额有限，需以活动库实时余量为准"],
      ["品质说明", "样板房用于展示，由资深设计和高评分安装班组优先服务"],
      ["全国口径", "公开透明统一价，不因客户、门店或谈判改变"],
      ["可承诺条件", "活动名称、价格、名额与有效期必须在活动库中处于可用状态"],
      ["禁止内容", "不对外透露利润点、成本结构或未经确认的名额"],
    ],
    sources: ["knowledge_documents｜样板房专项政策：568 是怎么来的", "brand_profile｜selling_points"],
  },
  {
    code: "C07",
    title: "企业承诺与风险边界",
    meta: "3 处待决策",
    state: "warning",
    intro: "企业承诺、售后 SLA 与现有资料冲突的集中边界。",
    facts: [
      ["正品", "保证正品；资料写有“假一赔三”，对外使用前应绑定正式合同条款"],
      ["环保", "ENF 级板材；资料写有环保不合格全额赔付，需绑定检测与赔付条件"],
      ["资金", "供应商、工人和工厂按单结算，客户款项进入公司账户"],
      ["售后", "1 年质保、终身维护；响应时限存在两套表述"],
      ["退定", "品牌档案与高频问答对“7 天退款”表述冲突，暂不自动承诺"],
      ["加急", "10 / 15 / 20 天及加急费率存在不一致，暂不自动承诺"],
    ],
    sources: ["brand_profile｜FAQ 与 selling_points", "knowledge_documents｜高频问题、流程与承诺资料"],
  },
];

const industryCategoryModules: readonly [string, string, number][] = [
  ["I01", "装修流程与预算", 4],
  ["I02", "装修找谁与合作模式", 7],
  ["I03", "收房环节", 3],
  ["I04", "设计环节", 6],
  ["I05", "开工准备", 4],
  ["I06", "拆旧环节", 4],
  ["I07", "泥工工序", 1],
  ["I08", "水电工序", 5],
  ["I09", "瓦工工序", 5],
  ["I10", "木工工序", 5],
  ["I11", "油工工序", 3],
  ["I12", "全屋定制", 4],
  ["I13", "保洁除醛", 1],
  ["I14", "主材购买", 7],
  ["I15", "全屋家电", 10],
  ["I16", "智能家居与软装", 7],
];

const industryCategoryMap: Record<string, string[]> = {
  I01: ["00装修流程和预算", "1.家装避坑装修全流程", "5.家装预算表"],
  I02: ["01装修找谁？"],
  I03: ["02收房环节"],
  I04: ["03设计环节"],
  I05: ["04开工准备"],
  I06: ["05拆旧环节"],
  I07: ["06泥工"],
  I08: ["07水电"],
  I09: ["08瓦工"],
  I10: ["09木工"],
  I11: ["10油工"],
  I12: ["11全屋定制"],
  I13: ["12保洁除醛"],
  I14: ["13主材购买"],
  I15: ["14全屋家电"],
  I16: ["15智能家居", "16全屋软装"],
};

export const industryModules: readonly BrainModule[] = industryCategoryModules.map(([code, title, count]) => ({
  code,
  title,
  meta: `${count} 个专题入口`,
  state: "positive" as const,
  intro: "从生产知识库 kb_entries 实时读取标题、摘要、来源与更新时间；原型不复制原文件全文。",
  facts: [
    ["数据范围", `${industryCategoryMap[code].join("、")} 等生产分类`],
    ["检索方式", "按关键词、分类和来源筛选，可直接打开真实条目详情"],
    ["内容边界", "仅行业工序、材料、预算、验收与经验，不混入聊天节奏技巧"],
    ["证据保留", "条目保留来源、原文件链接及更新时间；公开页只呈现必要摘要"],
  ],
  sources: ["kb_entries｜生产库实时元数据", "kb_chunks｜2,987 个检索片段（不在公开页直接展开）"],
  liveCategory: industryCategoryMap[code][0],
}));

export const uniqueModules: readonly BrainModule[] = [
  {
    code: "E01", title: "订单服务全流程（10步）", meta: "10 个节点", state: "positive",
    intro: "客户交定到安装验收的企业实际 SOP。",
    facts: [["01 交定", "签电子定金单，2000 元进入总部账户并在 ERP 建单"], ["02–03 建群", "财务确认后建企微服务群，销售介绍设计师并明确联系人"], ["04 量尺", "现场满足条件后预约量尺，记录全部定制空间并上传 ERP"], ["05 设计", "24 小时内约沟通，5 天内首版，提供 2 次免费修改"], ["06–07 签约生产", "支付 80% 后拆单排产，客户可在公众号查看进度"], ["08–10 安装验收", "尾款、配送、安装、补单和验收均有节点记录"]],
    sources: ["knowledge_documents｜订单服务全流程（10步）"],
  },
  {
    code: "E02", title: "量尺与设计标准", meta: "5 天首版", state: "positive",
    intro: "量尺前置条件、职责和设计时效。",
    facts: [["现场条件", "地砖或地板完成、吊顶完成、墙面打底完成"], ["预约", "客户拍照发群后由设计师安排量尺师联系"], ["量尺责任", "量尺师负责现场尺寸与后续安装衔接"], ["初版方案", "量尺数据上传后 24 小时内约客户，5 天内出第一版"], ["修改", "提供 2 次免费修改，建议客户一次汇总修改点"], ["复尺", "资料另写复尺费用 200 元，适用条件需进一步确认"]],
    sources: ["knowledge_documents｜订单服务全流程（10步）", "knowledge_documents｜复尺费用200元"],
  },
  {
    code: "E03", title: "合同与付款节点", meta: "3 个节点", state: "warning",
    intro: "生产资料中的付款流程；退定条件存在冲突。",
    facts: [["定金", "2000 元，直接支付总部账户并计入总价"], ["合同款", "签电子供货合同时支付合同款 80% 减定金"], ["尾款", "产品入库后、工厂安排送货前支付 20%"], ["资金安全", "个人不得收款，交易与有大有小品牌直接发生"], ["退定冲突", "brand_profile 写 7 天冷静期；高频问答要求不承诺退款条件"], ["发布状态", "退定相关自动回复暂停，等待负责人选择正式口径"]],
    sources: ["brand_profile｜付款 FAQ", "knowledge_documents｜客户高频问题（价格/退定/时间）"],
  },
  {
    code: "E04", title: "生产、配送与安装", meta: "30 + 5–7 天", state: "warning",
    intro: "标准周期与加急资料的真实现状。",
    facts: [["标准生产", "财务确认收到 80% 款次日起预计 30 天"], ["标准安装", "大货通装通常 5–7 个工作日；SOP 另按投影面积估算 3–7 天"], ["补单", "余料充足 3 天；需调板或较多补单 5–7 天"], ["安装排期", "30㎡内约 3 天，每增加 15㎡增加 1 天"], ["加急冲突", "资料同时出现 10、15、20 天口径及 5% / 10% 费率"], ["发布状态", "标准周期可用；加急周期与费率需人工确认"]],
    sources: ["knowledge_documents｜订单服务全流程（10步）", "knowledge_documents｜加急服务缩短周期", "brand_profile｜生产周期 FAQ"],
  },
  {
    code: "E05", title: "验收、质保与售后 SLA", meta: "1 年质保", state: "warning",
    intro: "验收、保修和售后响应存在两套时限描述。",
    facts: [["验收", "量尺师约客户现场验收并签验收单，72 小时后系统默认通过"], ["质保", "基础 1 年质保，终身维护；另有加 3 个点升级 5 年质保资料"], ["口径 A", "1 小时联系、1 个工作日给方案、3 个工作日安排上门"], ["口径 B", "24 小时响应、72 小时安排师傅上门"], ["楼梯搬运", "2 楼起 5 元/㎡/层；距电梯超过 30m 适当补贴师傅"], ["发布状态", "质保内容可用；具体 SLA 需选择统一口径"]],
    sources: ["knowledge_documents｜客户高频问题（售后/验收）", "brand_profile｜售后 FAQ"],
  },
  {
    code: "E06", title: "增项与非标计价", meta: "可计算", state: "positive",
    intro: "灯带、玻璃门、超深柜体等非标与增项规则。",
    facts: [["灯带", "悍高灯带 80 元/米（含安装），按规格整体区间 30–120 元/米"], ["控制件", "稳压器、变压器、开关各 80 元/个"], ["玻璃门", "补差 280 元/㎡；单扇不足 0.5㎡按 0.5㎡"], ["拉直器", "120 元/根；双面 PET 一般不建议增加"], ["超深", "超 100 / 200 / 300mm 以内分别 ×1.2 / ×1.3 / ×1.5，以上 ×2"], ["背板升级", "18mm 多层板加 60 元/㎡，基础方案仍推荐 9mm"]],
    sources: ["knowledge_documents｜客户高频问题（产品规格）", "knowledge_documents｜增项价目与产品配置"],
  },
  {
    code: "E07", title: "服务覆盖表达纪律", meta: "59 城", state: "positive",
    intro: "把“能服务”与“有门店”分开的企业专属口径。",
    facts: [["覆盖能力", "59 城存在网络服务点，可安排合作装企、设计师和量尺师"], ["门店定义", "只有门店清单中的地点可称实体门店"], ["对外说法", "可说“当地有网络服务点、可安排上门服务”"], ["禁止说法", "不得把服务点称为直营店或编造门店地址"], ["清单外", "先说明暂无直营门店，再查询最近可服务网点"], ["隐私处理", "公开原型展示城市数量和规则，不公开完整地址"]],
    sources: ["knowledge_documents｜全国网络服务点城市清单", "knowledge_documents｜全国门店地址清单"],
  },
  {
    code: "E08", title: "承诺自动化边界", meta: "3 项暂停", state: "warning",
    intro: "允许自动承诺的内容必须来自有效、无冲突的生产资料。",
    facts: [["可以自动引用", "当前基础价、基础产品配置、标准付款节点、59 城服务覆盖规则"], ["条件式引用", "活动价格和名额需实时检查活动库状态"], ["暂停自动承诺", "退定条件、加急周期 / 费率、售后具体 SLA"], ["环保与赔付", "需要检测条件与合同条款同时存在后才能对外承诺"], ["门店信息", "服务点不得冒充实体门店"], ["聊天技巧", "非行业经验的聊天节奏与销售话术不进入企业大脑"]],
    sources: ["brand_profile｜当前档案", "knowledge_documents｜67 份企业资料交叉核对"],
  },
];

export const brainGroups: Record<BrainGroupKey, {
  title: string;
  caption: string;
  destination: string;
  modules: readonly BrainModule[];
}> = {
  core: { title: "A｜企业核心", caption: "企业是谁、卖什么、服务谁、哪些内容可以承诺", destination: "brain-core", modules: coreModules },
  industry: { title: "B｜行业通用", caption: "生产知识库中的装修工序、材料、预算、验收和避坑经验", destination: "brain-industry", modules: industryModules },
  unique: { title: "C｜企业独有", caption: "有大有小真实执行的价格、流程、服务能力、时效和例外", destination: "brain-unique", modules: uniqueModules },
};

export const realConflicts = [
  {
    id: "refund",
    level: "高风险事实",
    title: "定金退款条件",
    issue: "品牌档案写“7 天冷静期可退”；高频问答要求“不承诺任何退款条件，也不给时限承诺”。",
    recommendation: "AI 建议：暂停自动承诺，负责人按正式合同选择口径",
  },
  {
    id: "expedite",
    level: "高风险事实",
    title: "加急生产周期与费率",
    issue: "资料同时出现 10 天、15 天、20 天，以及合同款 5% / 10% 的不同组合。",
    recommendation: "需要企业负责人确认适用条件与唯一对外版本",
  },
  {
    id: "aftercare",
    level: "中风险事实",
    title: "售后响应时限",
    issue: "一套资料写 1 小时 / 1 天 / 3 天，另一套写 24 小时 / 72 小时。",
    recommendation: "AI 建议：拆分为首次联系、方案回复和上门三个 SLA",
  },
  {
    id: "coverage",
    level: "表达边界",
    title: "59 城服务覆盖与实体门店",
    issue: "服务点清单明确“可服务不等于有店”，需要形成机器人硬校验规则。",
    recommendation: "AI 建议：保留两张清单，并在输出前校验实体门店字段",
  },
] as const;

export type PublicKnowledgeEntry = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source: string | null;
  type: string | null;
  priority: number | null;
  updated_at: string | null;
};

// Supabase publishable keys are intentionally safe for browser use when RLS is enabled.
// This key can read only the public industry knowledge index; private enterprise tables remain blocked.
const PUBLIC_KB_ENDPOINT = "https://nytlptpfqfnrpqemrtpr.supabase.co/rest/v1/kb_entries";
const PUBLIC_KB_KEY = "sb_publishable_v_Lrirj9X3Hbts8f0xqNrQ_poAqphZs";

export async function fetchPublicKnowledgeEntries(signal?: AbortSignal): Promise<PublicKnowledgeEntry[]> {
  const query = new URLSearchParams({
    select: "id,title,summary,category,source,type,priority,updated_at",
    is_active: "eq.true",
    order: "priority.desc,updated_at.desc",
    limit: "500",
  });
  const response = await fetch(`${PUBLIC_KB_ENDPOINT}?${query.toString()}`, {
    headers: { apikey: PUBLIC_KB_KEY, Authorization: `Bearer ${PUBLIC_KB_KEY}` },
    signal,
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response.json() as Promise<PublicKnowledgeEntry[]>;
}
