export type EvidenceStatus = "complete" | "missing_locator" | "missing_document";

export type EvidenceReference = {
  id: string;
  originalFilename: string | null;
  originalFileUrl?: string | null;
  extractedTitle: string;
  locator: string;
  excerpt: string;
  versionLabel?: string;
  status: EvidenceStatus;
  note: string;
};

type ModuleLike = {
  code: string;
  title: string;
  sources: readonly string[];
};

function pendingEvidence(
  id: string,
  extractedTitle: string,
  locator: string,
  excerpt: string,
  note = "当前生产库只保留了抽取结果，未保存用户上传时的原始文件名、文件地址和稳定段落定位。",
): EvidenceReference {
  return {
    id,
    originalFilename: null,
    extractedTitle,
    locator,
    excerpt,
    status: "missing_document",
    note,
  };
}

const moduleEvidence: Record<string, readonly EvidenceReference[]> = {
  C01: [
    pendingEvidence(
      "C01-E01",
      "企业文化与三大承诺",
      "已识别内容段落：使命 → 愿景 → 三大承诺 → 六大标准",
      "“使命：为用户提供极致性价比的高质平价产品……愿景：和用户交朋友，成为世界全屋定制供应链典范。”",
      "已核对：该抽取条目的原始文件链接为空；品牌档案也没有关联原始文档。不能标记为完整可追溯。",
    ),
  ],
  C02: [
    pendingEvidence("C02-E01", "产品配置详情（568基础配置）", "已识别内容段落：柜体 / 背板 / 柜门 / 五金铰链轨道", "“柜体：18mm 多层板、ENF 级环保、PUR 封边……五金铰链轨道：DTC / 悍高。”"),
    pendingEvidence("C02-E02", "主营品类档案", "原始段落尚未保存", "当前抽取结果记录了柜体定制、硬装、软装及家电点位规划等 24 个品类。"),
  ],
  C03: [
    pendingEvidence("C03-E01", "价格体系与预算预估", "已识别内容段落：全国统一价 / 预算公式 / 配置系数 / 付款方式", "“全国统一价：568 元/投影㎡……预估总价 = 预估投影面积 × 568 ×（1 + 配置系数）。”"),
    pendingEvidence("C03-E02", "价格口径与高频问答", "原始段落尚未保存", "当前抽取结果包含 2000 元定金、80% 合同款和出货前 20% 尾款。"),
  ],
  C04: [
    pendingEvidence("C04-E01", "产品配置详情（568基础配置）", "已识别内容段落：基础配置 / 升级选项 / 9mm 背板原因", "“每 3㎡投影面积送 1 个抽屉……背板升级 18mm 多层板加 60 元/㎡。”"),
    pendingEvidence("C04-E02", "客户高频问题（产品规格）", "已识别内容段落：颜色 / 五金 / 抽屉 / 灯带 / 玻璃门 / 超深", "“单个订单超过 3 个颜色，每多一个加收 500 元。”"),
  ],
  C05: [
    pendingEvidence("C05-E01", "全国门店地址清单", "已识别内容段落：实体门店城市与地址", "生产资料登记了 11 个城市或区域门店；公开原型不展示详细地址。"),
    pendingEvidence("C05-E02", "全国网络服务点城市清单", "已识别内容段落：服务覆盖 ≠ 实体门店 / 59 城清单", "“网络服务点 = 能服务，不等于有店。”"),
  ],
  C06: [
    pendingEvidence("C06-E01", "样板房专项政策：568 是怎么来的", "已识别内容段落：价怎么来的 / 名额怎么算 / 为什么值 / 口径纪律", "“ENF 级多层实木板原本定价 868 元/平……总部直接补贴 300 元，形成 568 元/平。”"),
  ],
  C07: [
    pendingEvidence("C07-E01", "企业文化与三大承诺", "已识别内容段落：三大承诺 / 六大标准", "“保证正品，假一赔三，环保检验不合格全额赔付。”"),
    pendingEvidence("C07-E02", "客户高频问题（价格/退定/时间）", "已识别内容段落：退定怎么处理 / 生产周期", "“不承诺任何退款条件、不主动说‘不退’、也不给任何时限型承诺。”"),
    pendingEvidence("C07-E03", "客户高频问题（售后/验收）", "已识别内容段落：保修期 / 售后响应 / 验收", "当前抽取结果同时出现 1 小时 / 1 天 / 3 天和 24H / 72H 两套售后时限。"),
  ],
  E01: [pendingEvidence("E01-E01", "订单服务全流程（10步）", "已识别内容段落：步骤一“客户交定”至步骤十“安装验收”", "从 2000 元交定、企微建群、量尺设计、签约生产到安装验收的十步流程。")],
  E02: [pendingEvidence("E02-E01", "订单服务全流程（10步）", "已识别内容段落：步骤四“现场量尺” / 步骤五“在线设计”", "“量尺数据上传后 24H 内约客户在线沟通方案；5 天内出第一版方案。”")],
  E03: [pendingEvidence("E03-E01", "订单服务全流程（10步）", "已识别内容段落：步骤一“客户交定” / 步骤六“线上签约” / 步骤八“出货安装”", "“客户支付 2000 元到总部账户……签约支付 80%，出货前支付 20% 尾款。”")],
  E04: [pendingEvidence("E04-E01", "订单服务全流程（10步）", "已识别内容段落：步骤七“拆单生产”至步骤九“安装补单”", "“生产预计 30 天；投影 30㎡以内安装 3 天，每增加 15㎡增加 1 天。”")],
  E05: [pendingEvidence("E05-E01", "客户高频问题（售后/验收）", "已识别内容段落：保修期 / 售后响应 / 交付 / 验收", "“提供 1 年保修期，超过保修期提供有偿维修，终身维护。”")],
  E06: [pendingEvidence("E06-E01", "客户高频问题（产品规格）", "已识别内容段落：灯带 / 玻璃门 / 背板 / 超深柜体", "“玻璃门补差 280 元/平……超深 100mm 内按 1.2 倍。”")],
  E07: [pendingEvidence("E07-E01", "全国网络服务点城市清单", "已识别内容段落：服务覆盖说明 / 59 城清单 / 禁止表达", "“可以说当地有网络服务点；绝不能说有门店或直营店。”")],
  E08: [pendingEvidence("E08-E01", "企业承诺与高频问答资料组", "已识别内容段落：价格 / 退定 / 加急 / 售后承诺", "退定、加急和售后时限存在冲突，自动回复必须暂停承诺并转人工。")],
};

function extractedTitleFromHint(source: string) {
  const parts = source.split("｜").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join("｜") : parts[0] || "未命名抽取条目";
}

export function resolveModuleEvidence(module: ModuleLike): readonly EvidenceReference[] {
  const resolved = moduleEvidence[module.code];
  if (resolved) return resolved;
  return module.sources.map((source, index) => pendingEvidence(
    `${module.code}-E${String(index + 1).padStart(2, "0")}`,
    extractedTitleFromHint(source),
    "页码、章节和段落尚未保存",
    `当前模块“${module.title}”已经形成结构化内容，但无法从现有记录回到用户上传的原始段落。`,
  ));
}

export function originalFilenameFromUrl(fileUrl: string | null | undefined) {
  if (!fileUrl) return null;
  try {
    const path = new URL(fileUrl).pathname;
    const lastPart = path.split("/").filter(Boolean).pop();
    return lastPart ? decodeURIComponent(lastPart) : null;
  } catch {
    return null;
  }
}

export function liveEntryEvidence(entry: {
  id: string;
  title: string;
  summary: string | null;
  file_url: string | null;
}): EvidenceReference {
  const originalFilename = originalFilenameFromUrl(entry.file_url);
  return {
    id: `KB-${entry.id}`,
    originalFilename,
    originalFileUrl: entry.file_url,
    extractedTitle: entry.title,
    locator: "原始页码、章节和段落尚未保存",
    excerpt: entry.summary || "当前条目没有独立摘要。",
    status: originalFilename ? "missing_locator" : "missing_document",
    note: originalFilename
      ? "已关联原始文件，但现有切片只有内部序号，不能替代用户可理解的页码或段落定位。"
      : "未关联原始文件，不能标记为完整可追溯。",
  };
}
