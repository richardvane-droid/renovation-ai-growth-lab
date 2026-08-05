"use client";

import { useEffect, useMemo, useState } from "react";

type ModuleKey = "video" | "sales" | "recall";

type ModuleConfig = {
  key: ModuleKey;
  index: string;
  label: string;
  title: string;
  description: string;
  metric: string;
  stages: { key: string; label: string; kicker: string; questions: string[] }[];
};

const modules: ModuleConfig[] = [
  {
    key: "video",
    index: "01",
    label: "视频增长",
    title: "从抖音线索挖掘到可用视频",
    description: "用偏好校准理解业务，从竞品爆款中选择结构，再调用真实素材自动生成获客视频。",
    metric: "每日 1 条可用成片",
    stages: [
      {
        key: "calibration",
        label: "业务校准",
        kicker: "首次引导",
        questions: ["10 条样本是否足以识别业务偏好？", "素材切片描述需要多细，用户才愿意信任？"],
      },
      {
        key: "benchmark",
        label: "爆款监控",
        kicker: "每日任务",
        questions: ["什么指标决定一条视频值得模仿？", "如何解释“参考结构”而不是“复制内容”？"],
      },
      {
        key: "generation",
        label: "视频生成",
        kicker: "结果交付",
        questions: ["哪些制作过程需要向用户透明？", "成片验收需要哪些自动质量检查？"],
      },
    ],
  },
  {
    key: "sales",
    index: "02",
    label: "企微销售",
    title: "从加企业微信到聊天到店",
    description: "训练销售机器人、监控真实对话、修正常见问答，并通过插件完成报价、量房和需求收集。",
    metric: "提升到店预约率",
    stages: [
      {
        key: "training",
        label: "机器人训练",
        kicker: "首次引导",
        questions: ["100 组模拟演练如何降低标注负担？", "提示词应该开放到什么程度让运营修改？"],
      },
      {
        key: "operations",
        label: "聊天运营",
        kicker: "每日任务",
        questions: ["质检排序优先看成交意愿还是风险？", "高频问答怎样形成可持续的人工修正闭环？"],
      },
      {
        key: "plugins",
        label: "插件中心",
        kicker: "自动能力",
        questions: ["插件触发条件如何让运营人员看得懂？", "自动报价和预约服务的人工兜底点在哪里？"],
      },
    ],
  },
  {
    key: "recall",
    index: "03",
    label: "断联召回",
    title: "断联后按客户阶段持续召回",
    description: "同步真实召回记录与客户回复，并根据装修阶段、沉默时长和已知需求安排下一次触达。",
    metric: "提高断联回复率",
    stages: [
      {
        key: "activities",
        label: "活动管理",
        kicker: "内容准备",
        questions: ["活动有效期和库存变化如何阻止错误发送？", "海报与活动权益是否需要审批流？"],
      },
      {
        key: "dashboard",
        label: "召回运营",
        kicker: "每日运营",
        questions: ["信任分由哪些行为构成才容易解释？", "第几次召回应允许人工干预或停止？"],
      },
      {
        key: "plugins",
        label: "召回插件",
        kicker: "自动能力",
        questions: ["知识海报应基于客户阶段还是最近问题？", "体验券如何避免频繁发送和权益滥用？"],
      },
    ],
  },
];

const competitorVideos = [
  ["小户型扩容", "12.8%", "86"],
  ["奶油风全屋", "11.4%", "81"],
  ["报价避坑", "10.2%", "78"],
  ["柜体收纳", "9.8%", "74"],
  ["设计前后", "9.1%", "72"],
  ["板材对比", "8.7%", "69"],
  ["工地巡检", "8.2%", "67"],
  ["门店案例", "7.9%", "64"],
];

const chatRows = [
  ["王女士", "方案对比", "92", "预算与报价", "待标注"],
  ["刘先生", "需求确认", "86", "板材环保", "优秀"],
  ["赵女士", "到店预约", "78", "门店地址", "需优化"],
  ["陈先生", "初次咨询", "64", "风格选择", "待标注"],
];

type RecallRecord = {
  date: string;
  day: number;
  status: string;
  topic: string | null;
  message: string;
};

type PlannedTouch = {
  day: number;
  topic: string;
  draft: string;
  scheduledAt: string | null;
};

type RecallRecipient = {
  id: string;
  name: string;
  status: string;
  stage: string;
  successfulTouches: number;
  remainingTouches: number;
  nextRecallAt: string | null;
  nextRecallInDays: number | null;
  records: RecallRecord[];
  plannedTouches: PlannedTouch[];
};

type RecallPortalData = {
  generatedAt: string;
  dueNow: number;
  summary: {
    queued: number;
    sent: number;
    replied: number;
    replyRate: number | null;
    progressed: number;
  };
  recipients: RecallRecipient[];
};

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "purple" | "gray" | "red";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Progress({ value, tone = "blue" }: { value: number; tone?: string }) {
  return (
    <span className="progress" aria-label={`进度 ${value}%`}>
      <span className={`progress-fill progress-${tone}`} style={{ width: `${value}%` }} />
    </span>
  );
}

function Stat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </div>
  );
}

function SectionHead({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function VideoCalibration() {
  const [niche, setNiche] = useState("全屋定制");
  const niches = ["全屋定制", "设计师", "装修公司", "材料供应商", "软装门店", "施工团队"];

  return (
    <div className="screen-grid calibration-grid">
      <section className="panel">
        <SectionHead title="1. 选择业务细分" description="系统从已抓取内容中匹配首批样本" />
        <div className="choice-grid">
          {niches.map((item) => (
            <button
              className={niche === item ? "choice active" : "choice"}
              key={item}
              onClick={() => setNiche(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="insight-box">
          <Badge tone="blue">AI 业务画像</Badge>
          <p>
            当前偏好：真实空间改造、柜体收纳与工艺细节；减少纯口播，优先使用“痛点开场 + 前后对比 + 到店领取方案”。
          </p>
        </div>
      </section>

      <section className="panel">
        <SectionHead title="2. 匹配视频标注" description={`已为「${niche}」匹配 10 条视频`} />
        <div className="mini-video-grid">
          {["小户型扩容", "板材避坑", "柜体细节", "报价拆解", "安装过程", "门店案例"].map(
            (name, index) => (
              <div className="mini-video" key={name}>
                <div className={`thumbnail thumbnail-${(index % 4) + 1}`}>
                  <span>▶</span>
                  <small>00:{18 + index * 3}</small>
                </div>
                <b>{name}</b>
                <div className="vote-row">
                  <button className={index === 0 ? "selected" : ""}>匹配</button>
                  <button>不匹配</button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="panel panel-wide">
        <SectionHead
          title="3. 真实素材与自动切片"
          description="上传业务视频和门店形象；系统按镜头变化、动作和语义自动分段"
          action={<button className="button button-primary">＋ 上传视频</button>}
        />
        <div className="asset-row">
          <div className="asset-thumb thumbnail-2">00:42</div>
          <div className="asset-meta">
            <b>衣柜安装实拍.mp4</b>
            <span>已切割 4 段 · 92.4 MB</span>
            <Progress value={100} tone="green" />
          </div>
          <Badge tone="green">分析完成</Badge>
        </div>
        <div className="segments">
          {[
            ["00:00–00:08", "进店前后对比"],
            ["00:08–00:19", "板材细节展示"],
            ["00:19–00:31", "安装工艺讲解"],
            ["00:31–00:42", "完工空间全景"],
          ].map(([time, label]) => (
            <div className="segment" key={time}>
              <strong>{time}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function VideoBenchmark({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="screen-grid benchmark-grid">
      <section className="panel panel-main">
        <SectionHead
          title="今日竞品爆款 TOP 10"
          description="每日 09:00 自动更新 · 按互动率与获客意向综合排序"
          action={<Badge tone="green">监控已更新</Badge>}
        />
        <div className="video-card-grid">
          {competitorVideos.map(([name, rate, score], index) => (
            <button
              className={selected === index ? "video-card selected" : "video-card"}
              key={name}
              onClick={() => onSelect(index)}
            >
              <div className={`video-cover thumbnail-${(index % 4) + 1}`}>
                <Badge tone={index < 3 ? "amber" : "gray"}>#{index + 1}</Badge>
                <span className="play">▶</span>
              </div>
              <b>{name}</b>
              <span>{rate} 互动率</span>
              <Progress value={Number(score)} />
            </button>
          ))}
        </div>
      </section>

      <aside className="panel detail-panel">
        <SectionHead title="爆款拆解" description={`已选择 #${selected + 1} ${competitorVideos[selected][0]}`} />
        <ol className="structure-list">
          {[
            ["3 秒钩子", "8㎡卧室，收纳多出 30%"],
            ["冲突痛点", "空间小、东西多、动线乱"],
            ["方案证明", "真实前后对比 + 尺寸展示"],
            ["转化动作", "领取同户型规划方案"],
          ].map(([title, text], index) => (
            <li key={title}>
              <i>{index + 1}</i>
              <div>
                <b>{title}</b>
                <span>{text}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="metric-stack">
          <div>
            <span>完播率</span>
            <strong>68.4%</strong>
          </div>
          <Progress value={68} tone="green" />
          <div>
            <span>评论获客意向</span>
            <strong>高</strong>
          </div>
          <Progress value={82} tone="amber" />
        </div>
        <button className="button button-primary button-full">用已选视频生成</button>
      </aside>
    </div>
  );
}

function VideoGeneration() {
  const [done, setDone] = useState(false);
  const logs = [
    ["脚本结构解析完成", true],
    ["业务素材匹配完成", true],
    ["镜头切割与节奏重排", true],
    ["口播字幕与卖点生成", true],
    ["品牌门店片尾合成", done],
    ["导出与安全检查", done],
  ] as const;

  return (
    <div className="screen-grid generation-grid">
      <section className="panel log-panel">
        <SectionHead title="制作进展" description={done ? "任务已完成" : "预计剩余 01:26"} />
        <div className="task-progress">
          <span>{done ? "100%" : "88%"}</span>
          <Progress value={done ? 100 : 88} />
        </div>
        <ol className="timeline">
          {logs.map(([label, complete], index) => (
            <li className={complete ? "complete" : ""} key={label}>
              <i>{complete ? "✓" : index + 1}</i>
              <div>
                <b>{label}</b>
                <span>09:{32 + index}:0{index}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="console-line">AI_LOG · {done ? "导出完成，等待下载" : "字幕时间轴对齐中…"}</div>
      </section>

      <section className="panel preview-panel">
        <SectionHead title="成片预览" description="竖版 9:16 · 32 秒" />
        <div className="phone-video">
          <small>全屋定制 · 杭州</small>
          <div>
            <strong>8㎡卧室</strong>
            <b>收纳翻倍方案</b>
          </div>
          <span>镜头 06 / 09</span>
          <button>领取同户型规划</button>
        </div>
      </section>

      <aside className="panel qa-panel">
        <SectionHead title="质量检查" description="自动审核" />
        {[
          ["脚本一致性", "96"],
          ["画面清晰度", "92"],
          ["品牌安全", "通过"],
          ["口播节奏", "良好"],
        ].map(([label, value]) => (
          <div className="qa-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
        <button className="button button-primary button-full" onClick={() => setDone(true)}>
          {done ? "下载今日成片" : "完成生成演示"}
        </button>
      </aside>
    </div>
  );
}

function SalesTraining() {
  return (
    <div className="screen-grid training-grid">
      <section className="panel training-steps">
        <SectionHead title="机器人训练引导" description="完成后即可接管企微聊天" />
        {[
          ["1", "销售培训资料", "已上传 6 份", true],
          ["2", "冠军对话样本", "10 / 10 段", true],
          ["3", "模拟演练标注", "68 / 100", false],
          ["4", "风格与规则", "待确认", false],
        ].map(([number, title, detail, done], index) => (
          <div className="training-step" key={String(title)}>
            <i className={done ? "done" : index === 2 ? "current" : ""}>{done ? "✓" : number}</i>
            <div>
              <b>{title}</b>
              <span>{detail}</span>
            </div>
          </div>
        ))}
        <button className="button button-primary button-full">继续标注</button>
      </section>

      <section className="panel conversation-panel">
        <SectionHead title="模拟演练 · 第 69 / 100 组" description="请判断机器人回复质量" />
        <div className="chat-bubble customer">
          <small>客户</small>
          <p>90㎡全屋定制大概多少钱？</p>
        </div>
        <div className="chat-bubble robot">
          <small>AI 销售机器人</small>
          <p>可以先按 3 个配置档给您估算。方便发一下户型，或者告诉我是几室几厅吗？</p>
        </div>
        <div className="rating-row">
          <span>话术专业度</span>
          {[1, 2, 3, 4, 5].map((score) => (
            <button className={score === 4 ? "active" : ""} key={score}>
              {score}
            </button>
          ))}
          <button className="button button-primary">提交评分</button>
        </div>
      </section>

      <section className="panel prompt-panel panel-wide">
        <SectionHead
          title="机器人整体风格与规则"
          description="可增删改，发布后立即生效"
          action={
            <div className="badge-row">
              <Badge>专业顾问</Badge>
              <Badge tone="purple">先问后答</Badge>
              <Badge tone="green">不强推销</Badge>
            </div>
          }
        />
        <div className="prompt-editor">
          <code>SYSTEM PROMPT</code>
          <p>
            你是一名全屋定制销售顾问。先确认户型、地址、预算和风格偏好，再给出分档建议；报价须标注范围与影响因素；遇到复杂问题转人工，不承诺未核实的工期与折扣。
          </p>
        </div>
      </section>
    </div>
  );
}

function SalesOperations() {
  return (
    <div className="operations-stack">
      <div className="stat-grid">
        <Stat label="新增会话" value="128" change="+12.4%" />
        <Stat label="高意向客户" value="24" change="+8 人" />
        <Stat label="到店预约" value="11" change="8.6%" />
        <Stat label="人工接管率" value="6.2%" change="-1.4%" />
      </div>
      <div className="screen-grid operations-grid">
        <section className="panel panel-main">
          <SectionHead
            title="真实对话质检"
            description="成交意愿从高到低 · 最新优先"
            action={<button className="button button-secondary">筛选</button>}
          />
          <div className="data-table">
            <div className="table-row table-head">
              <span>客户 / 阶段</span>
              <span>意愿</span>
              <span>最近问题</span>
              <span>质检</span>
            </div>
            {chatRows.map(([name, stage, score, question, result]) => (
              <div className="table-row" key={name}>
                <span>
                  <b>{name}</b>
                  <small>{stage}</small>
                </span>
                <span>
                  <Badge tone={Number(score) > 80 ? "green" : "amber"}>{score}</Badge>
                </span>
                <span>{question}</span>
                <span>
                  <Badge tone={result === "优秀" ? "green" : result === "需优化" ? "red" : "blue"}>
                    {result}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        </section>
        <aside className="panel faq-panel">
          <SectionHead title="高频问题聚合" description="优先修正问得最多的问题" />
          {[
            ["全屋定制怎么报价？", "82", "已优化"],
            ["用什么板材？环保吗？", "67", "待调整"],
            ["多久可以装完？", "51", "待调整"],
            ["可以免费量房吗？", "46", "已优化"],
          ].map(([question, count, status]) => (
            <div className="faq-row" key={question}>
              <div>
                <b>{question}</b>
                <span>{count} 次</span>
              </div>
              <Badge tone={status === "已优化" ? "green" : "amber"}>{status}</Badge>
              <Progress value={Number(count)} tone={status === "已优化" ? "green" : "purple"} />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

const salesPlugins = [
  ["A", "户型图 + 风格", "客户发户型图后自动返回同类方案", "已开通"],
  ["B", "自动报价方案", "识别户型后生成分档报价明细", "配置中"],
  ["C", "免费上门量房", "收集预算与地址并调度装修公司", "已开通"],
  ["D", "风格选择题", "多轮效果图选择补全客户画像", "未开通"],
];

function SalesPlugins({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (value: number) => void;
}) {
  const plugin = salesPlugins[selected];
  return (
    <div className="screen-grid plugin-grid">
      <section className="plugin-list-grid">
        {salesPlugins.map(([letter, title, description, status], index) => (
          <button
            className={selected === index ? "panel plugin-card selected" : "panel plugin-card"}
            key={letter}
            onClick={() => onSelect(index)}
          >
            <i>{letter}</i>
            <div>
              <b>{title}</b>
              <p>{description}</p>
            </div>
            <Badge tone={status === "已开通" ? "green" : status === "配置中" ? "purple" : "amber"}>
              {status}
            </Badge>
          </button>
        ))}
      </section>
      <aside className="panel plugin-config">
        <SectionHead title={`插件 ${plugin[0]} · ${plugin[1]}`} description="触发条件 → 自动动作 → 人工兜底" />
        <label>
          触发条件
          <span>识别到面积 + 户型</span>
        </label>
        <label>
          自动执行
          <span>生成基础 / 品质 / 高配三档方案</span>
        </label>
        <div className="flow-list">
          {["提取面积、房型与城市", "匹配门店报价库", "生成材料与费用明细", "创建销售跟进任务"].map(
            (item, index) => (
              <div key={item}>
                <i>0{index + 1}</i>
                <span>{item}</span>
              </div>
            ),
          )}
        </div>
        <label className="check-line">
          <input defaultChecked type="checkbox" />
          报价后自动创建人工跟进任务
        </label>
        <button className="button button-primary button-full">保存配置</button>
      </aside>
    </div>
  );
}

function RecallActivities() {
  return (
    <div className="screen-grid activity-grid">
      <section className="panel activity-form">
        <SectionHead title="新增活动信息" description="真实活动资料尚未接入，当前仅保留填写位置" />
        {[
          ["活动名称", "待同步活动名称"],
          ["活动周期", "待同步开始与结束日期"],
          ["目标客群", "待同步客户适用条件"],
          ["核心权益", "待核验权益、价格与使用边界"],
        ].map(([label, value]) => (
          <label key={label}>
            {label}
            <input defaultValue={value} />
          </label>
        ))}
        <div className="poster-upload">
          <div>海报预览</div>
          <button className="button button-secondary">替换海报</button>
          <button className="button button-primary">保存活动</button>
        </div>
      </section>
      <section className="panel activity-list">
        <SectionHead
          title="存量活动"
          description="可启停、编辑或删除"
          action={<Badge tone="amber">资料待接入</Badge>}
        />
        {[
          ["样板房权益", "有效期待同步", "待核验", "名额待同步"],
          ["同小区案例", "长期内容", "可用于召回", "已发送 8 次"],
          ["产品配置说明", "长期内容", "可用于召回", "已发送 10 次"],
          ["品质保障说明", "长期内容", "可用于召回", "已发送 9 次"],
        ].map(([name, time, status, people]) => (
          <div className="activity-row" key={name}>
            <i className={status === "可用于召回" ? "on" : ""} />
            <div>
              <b>{name}</b>
              <span>
                {time} · {people}
              </span>
            </div>
            <Badge tone={status === "可用于召回" ? "green" : "amber"}>{status}</Badge>
            <button>编辑 ···</button>
          </div>
        ))}
        <div className="sync-note">当前仅同步已验证的召回内容；活动库存、海报和预约名额尚未接入</div>
      </section>
    </div>
  );
}

function RecallDashboard() {
  const [data, setData] = useState<RecallPortalData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = window.location.hash.slice(1).trim();
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
      window.queueMicrotask(() => setLoadState("missing"));
      return;
    }
    const controller = new AbortController();
    fetch("https://wecom-chat.vercel.app/api/public/client-recall", {
      cache: "no-store",
      headers: { "X-Portal-Token": token },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as RecallPortalData & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "召回数据加载失败");
        setData(body);
        setSelectedId(body.recipients[0]?.id ?? "");
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadState("error");
      });
    return () => controller.abort();
  }, []);

  const recipients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!data || !keyword) return data?.recipients ?? [];
    return data.recipients.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        item.stage.toLowerCase().includes(keyword),
    );
  }, [data, search]);
  const selected =
    data?.recipients.find((item) => item.id === selectedId) ?? recipients[0] ?? null;

  if (loadState === "missing") {
    return (
      <section className="panel recall-connect">
        <Badge tone="amber">需要专属链接</Badge>
        <h3>召回运营数据尚未连接</h3>
        <p>请使用项目负责人提供的完整专属链接打开。令牌只保留在浏览器地址中，不会写进 GitHub Pages 日志。</p>
      </section>
    );
  }

  if (loadState === "loading") {
    return <section className="panel recall-connect"><h3>正在读取召回运营数据…</h3></section>;
  }

  if (loadState === "error" || !data) {
    return (
      <section className="panel recall-connect">
        <Badge tone="red">连接失败</Badge>
        <h3>暂时无法读取召回数据</h3>
        <p>请确认使用完整专属链接，稍后重新加载页面。</p>
      </section>
    );
  }

  return (
    <div className="operations-stack">
      <div className="stat-grid">
        <Stat label="进入召回" value={String(data.summary.queued)} change={`${data.recipients.length} 位客户`} />
        <Stat label="成功发送" value={String(data.summary.sent)} change="当前统计范围" />
        <Stat
          label="召回后回复"
          value={String(data.summary.replied)}
          change={`${Math.round((data.summary.replyRate ?? 0) * 100)}%`}
        />
        <Stat label="当前待召回" value={String(data.dueNow)} change="已到可触达时间" />
      </div>
      <div className="screen-grid recall-live-grid">
        <section className="panel user-pool">
          <SectionHead
            title="召回用户池"
            description={`真实数据 · 更新于 ${new Date(data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`}
            action={
              <input
                aria-label="搜索客户"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索客户…"
                value={search}
              />
            }
          />
          <div className="data-table recall-table">
            <div className="table-row table-head">
              <span>客户</span>
              <span>当前阶段</span>
              <span>已完成</span>
              <span>剩余</span>
              <span>下次召回</span>
            </div>
            {recipients.map((item) => (
              <button
                className={`table-row recall-user-row ${selected?.id === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <span>
                  <b>{item.name}</b>
                  <small>{item.id}</small>
                </span>
                <span>{item.stage}</span>
                <span>
                  <Badge tone="green">{item.successfulTouches} 次</Badge>
                </span>
                <strong>{item.remainingTouches} 次</strong>
                <span>
                  {item.nextRecallAt
                    ? item.nextRecallInDays === 0
                      ? "今天"
                      : `${item.nextRecallInDays} 天后`
                    : "无后续计划"}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel recall-customer-detail">
          {selected ? (
            <>
              <SectionHead
                title={selected.name}
                description={`${selected.id} · ${selected.stage} · ${selected.status}`}
                action={<Badge tone="green">剩余 {selected.remainingTouches} 次</Badge>}
              />
              <div className="recall-detail-columns">
                <div>
                  <h4>已发送记录</h4>
                  <div className="recall-message-list">
                    {selected.records.map((record, index) => (
                      <article key={`${record.date}-${index}`}>
                        <div>
                          <b>第 {record.day} 次 · {record.topic ?? "未标注话题"}</b>
                          <span>{new Date(record.date).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })} · {record.status}</span>
                        </div>
                        <p>{record.message || "未记录召回话术"}</p>
                      </article>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>接下来几次话术草稿</h4>
                  <div className="recall-plan-list">
                    {selected.plannedTouches.length ? (
                      selected.plannedTouches.map((plan) => (
                        <article key={`${selected.id}-${plan.day}`}>
                          <div>
                            <b>第 {plan.day} 次 · {plan.topic}</b>
                            <span>
                              {plan.scheduledAt
                                ? new Date(plan.scheduledAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
                                : "待前一次执行后确定"}
                            </span>
                          </div>
                          <p>{plan.draft}</p>
                        </article>
                      ))
                    ) : (
                      <p className="recall-empty">当前没有后续召回计划。</p>
                    )}
                  </div>
                  <small className="recall-draft-note">
                    草稿供内部提前审核；最终发送前会结合客户最新回复与画像更新。
                  </small>
                </div>
              </div>
            </>
          ) : (
            <p className="recall-empty">请选择一位客户查看召回记录。</p>
          )}
        </section>
      </div>
    </div>
  );
}

function RecallPlugins() {
  const [selected, setSelected] = useState(0);
  const [posterImage, setPosterImage] = useState("");
  const [posterState, setPosterState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  async function generatePoster() {
    if (selected !== 0 || posterState === "loading") return;
    const token = window.location.hash.slice(1).trim();
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
      setPosterState("error");
      return;
    }
    setPosterState("loading");
    try {
      const response = await fetch("https://wecom-chat.vercel.app/api/public/recall-poster", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-Portal-Token": token,
        },
        body: JSON.stringify({
          topic: "产品配置与品质保障",
          customerStage: "沉默客户持续观察",
          customerNeed: "预算、板材、收纳与装修避坑",
        }),
      });
      const body = (await response.json()) as { imageDataUrl?: string; error?: string };
      if (!response.ok || !body.imageDataUrl) throw new Error(body.error ?? "海报生成失败");
      setPosterImage(body.imageDataUrl);
      setPosterState("ready");
    } catch {
      setPosterState("error");
    }
  }

  return (
    <div className="screen-grid recall-plugin-grid">
      <section className="panel recall-plugin-list">
        <SectionHead title="召回插件" description="与客户生命周期阶段和真实话题库联动" />
        {[
          ["A", "个性化知识内容", "真实话题已接入，海报图片待接入"],
          ["B", "上门体验权益", "预约、名额和核销资料待接入"],
        ].map(([letter, title, description], index) => (
          <button
            className={selected === index ? "recall-plugin-card active" : "recall-plugin-card"}
            key={letter}
            onClick={() => setSelected(index)}
          >
            <i>{letter}</i>
            <div>
              <b>{title}</b>
              <span>{description}</span>
            </div>
            <Badge tone={index === 0 ? "green" : "amber"}>{index === 0 ? "内容已接入" : "暂未启用"}</Badge>
          </button>
        ))}
        <div className="strategy-note">
          <b>当前策略</b>
          <span>按阶段动态选择内容 · 客户回复或明确拒绝后立即停止</span>
          <Progress value={100} />
        </div>
      </section>
      <section className="panel poster-preview-panel">
        <SectionHead
          title={selected === 0 ? "个性化知识内容" : "上门体验权益"}
          description={
            selected !== 0
              ? "资料待接入，不会自动发送"
              : posterState === "loading"
                ? "Seedream 4.5 正在生成海报底图…"
                : posterState === "ready"
                  ? "Seedream 4.5 已生成 · 点击可重新生成"
                  : posterState === "error"
                    ? "生成失败或缺少专属链接 · 点击重试"
                    : "已同步真实召回话题 · 点击海报生成底图"
          }
        />
        <div
          aria-busy={posterState === "loading"}
          aria-label={selected === 0 ? "生成个性化知识海报" : undefined}
          className={selected === 0 ? "knowledge-poster" : "knowledge-poster coupon"}
          onClick={generatePoster}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") void generatePoster();
          }}
          role={selected === 0 ? "button" : undefined}
          style={posterImage ? { backgroundImage: `linear-gradient(rgba(249, 251, 255, 0.82), rgba(249, 251, 255, 0.92)), url(${posterImage})` } : undefined}
          tabIndex={selected === 0 ? 0 : undefined}
        >
          <small>{selected === 0 ? "真实话题库" : "资料尚未接入"}</small>
          <strong>{selected === 0 ? "产品配置与品质保障" : "预约能力待核验"}</strong>
          <b>{selected === 0 ? "按客户阶段选择下一条内容" : "暂不生成或发送权益券"}</b>
          {selected === 0 ? (
            <>
              <span>产品配置 · 已发送 10 次</span>
              <Progress value={58} />
              <span>品质保障 · 已发送 9 次</span>
              <Progress value={82} tone="purple" />
              <span>同小区案例 · 已发送 8 次</span>
              <Progress value={66} tone="green" />
            </>
          ) : (
            <div className="coupon-code">门店预约表、服务地区与核销记录待同步</div>
          )}
        </div>
      </section>
      <aside className="panel cadence-panel">
        <SectionHead title="发送节奏" description="阶段变化后动态确定，发送前再次核验" />
        {[
          ["01", "冷启动：产品配置或品质保障", "1–2 天后"],
          ["02", "需求浮现：围绕户型与风格", "约 3 天后"],
          ["03", "决策推进：方案或待确认事项", "约 2 天后"],
          ["04", "持续观察：案例与装修知识", "约 7 天后"],
          ["05", "沉默 30–60 天：新案例", "约 10 天后"],
          ["06", "沉默 60–90 天：轻量价值", "约 15 天后"],
          ["07", "沉默 90 天以上：低频蓄水", "约 30 天后"],
        ].map(([day, content, status], index) => (
          <div className="cadence-row" key={day}>
            <i className={index < 2 ? "done" : index === 2 ? "current" : ""}>{day}</i>
            <div>
              <b>{content}</b>
              <span>{status}</span>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

function BrainstormStrip({ questions }: { questions: string[] }) {
  return (
    <div className="brainstorm-strip">
      <span>本轮讨论问题</span>
      {questions.map((question, index) => (
        <p key={question}>
          <i>{index + 1}</i>
          {question}
        </p>
      ))}
    </div>
  );
}

function ProductScreen({
  module,
  stageKey,
  selectedVideo,
  setSelectedVideo,
  selectedPlugin,
  setSelectedPlugin,
}: {
  module: ModuleConfig;
  stageKey: string;
  selectedVideo: number;
  setSelectedVideo: (value: number) => void;
  selectedPlugin: number;
  setSelectedPlugin: (value: number) => void;
}) {
  let content: React.ReactNode = null;
  if (module.key === "video") {
    if (stageKey === "calibration") content = <VideoCalibration />;
    if (stageKey === "benchmark")
      content = <VideoBenchmark selected={selectedVideo} onSelect={setSelectedVideo} />;
    if (stageKey === "generation") content = <VideoGeneration />;
  }
  if (module.key === "sales") {
    if (stageKey === "training") content = <SalesTraining />;
    if (stageKey === "operations") content = <SalesOperations />;
    if (stageKey === "plugins")
      content = <SalesPlugins selected={selectedPlugin} onSelect={setSelectedPlugin} />;
  }
  if (module.key === "recall") {
    if (stageKey === "activities") content = <RecallActivities />;
    if (stageKey === "dashboard") content = <RecallDashboard />;
    if (stageKey === "plugins") content = <RecallPlugins />;
  }

  const stage = module.stages.find((item) => item.key === stageKey) ?? module.stages[0];

  return (
    <>
      <BrainstormStrip questions={stage.questions} />
      <div className={`prototype-shell theme-${module.key}`}>
        <aside className="product-sidebar">
          <div className="product-brand">
            <i>AI</i>
            <div>
              <b>智营增长</b>
              <span>装修行业工作台</span>
            </div>
          </div>
          <nav>
            {modules.map((item) => (
              <div className={item.key === module.key ? "side-nav active" : "side-nav"} key={item.key}>
                <i>{item.index}</i>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="automation-status">
            <span>AI 自动执行</span>
            <b>
              <i /> 运行正常
            </b>
          </div>
        </aside>
        <main className="product-main">
          <header className="product-toolbar">
            <div>
              <small>{stage.kicker}</small>
              <h2>{stage.label}</h2>
            </div>
            <div className="toolbar-actions">
              <Badge tone="green">数据已更新</Badge>
              <span className="avatar">杜</span>
              <b>杜先生</b>
            </div>
          </header>
          <div className="product-content">{content}</div>
        </main>
      </div>
    </>
  );
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("video");
  const [stageByModule, setStageByModule] = useState<Record<ModuleKey, string>>({
    video: "calibration",
    sales: "training",
    recall: "activities",
  });
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [selectedPlugin, setSelectedPlugin] = useState(1);
  const [copied, setCopied] = useState(false);

  const selectedModule = useMemo(
    () => modules.find((item) => item.key === activeModule) ?? modules[0],
    [activeModule],
  );

  useEffect(() => {
    const token = window.location.hash.slice(1).trim();
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return;
    window.setTimeout(() => {
      setActiveModule("recall");
      setStageByModule((current) => ({ ...current, recall: "dashboard" }));
      document.querySelector("#prototype")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, []);

  function changeModule(key: ModuleKey) {
    setActiveModule(key);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="site">
      <header className="site-header">
        <a className="site-logo" href="#top" aria-label="返回顶部">
          <span>AI</span>
          <div>
            <b>营销增长工作台</b>
            <small>产品草图评审 · V0.1</small>
          </div>
        </a>
        <nav className="site-nav" aria-label="页面导航">
          <a href="#overview">业务总览</a>
          <a href="#prototype">交互草图</a>
          <a href="#discussion">讨论建议</a>
        </nav>
        <button className="button button-dark" onClick={copyLink}>
          {copied ? "链接已复制" : "复制评审链接"}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <Badge tone="blue">团队头脑风暴版 · 2026.07</Badge>
          <h1>
            把装修营销的三条增长链路，
            <br />
            放进同一个 <em>AI 工作台</em>
          </h1>
          <p>
            这是用于讨论产品方向的 HTML 草图，不代表最终视觉稿。请重点评审任务顺序、人工介入点、数据指标与自动化边界。
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#prototype">
              开始浏览草图
            </a>
            <a className="button button-secondary" href="#discussion">
              查看讨论提纲
            </a>
          </div>
        </div>
        <div className="hero-board" aria-label="三条业务链路概览">
          <div className="hero-board-head">
            <span>今日增长任务</span>
            <Badge tone="green">系统运行正常</Badge>
          </div>
          {modules.map((item, index) => (
            <div className="hero-task" key={item.key}>
              <i>0{index + 1}</i>
              <div>
                <b>{item.title}</b>
                <span>{item.metric}</span>
              </div>
              <Progress value={[82, 64, 71][index]} tone={item.key === "recall" ? "green" : item.key === "sales" ? "purple" : "blue"} />
            </div>
          ))}
          <div className="hero-metrics">
            <div>
              <strong>328</strong>
              <span>本周新增线索</span>
            </div>
            <div>
              <strong>24</strong>
              <span>高意向客户</span>
            </div>
            <div>
              <strong>30.9%</strong>
              <span>召回回复率</span>
            </div>
          </div>
        </div>
      </section>

      <section className="overview" id="overview">
        <div className="eyebrow">THREE GROWTH LOOPS</div>
        <div className="overview-heading">
          <div>
            <h2>三项功能不是孤立工具，而是一条持续增长闭环</h2>
            <p>内容负责获得线索，对话负责推进决策，召回负责重新激活未成交客户。</p>
          </div>
          <span>内容获客 → 私域转化 → 存量激活</span>
        </div>
        <div className="module-cards">
          {modules.map((item) => (
            <button
              className={`module-card module-${item.key}`}
              key={item.key}
              onClick={() => {
                changeModule(item.key);
                document.querySelector("#prototype")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>{item.index}</span>
              <Badge tone={item.key === "video" ? "blue" : item.key === "sales" ? "purple" : "green"}>
                {item.label}
              </Badge>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div>
                <b>{item.metric}</b>
                <i>查看草图 →</i>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="prototype-section" id="prototype">
        <div className="prototype-intro">
          <div>
            <div className="eyebrow">INTERACTIVE WIREFRAMES</div>
            <h2>点击模块和场景，浏览 9 张关键界面</h2>
          </div>
          <p>桌面端按照 1440px 后台工作台设计；手机端会缩放为评审浏览模式。</p>
        </div>
        <div className="module-tabs" role="tablist" aria-label="功能模块">
          {modules.map((item) => (
            <button
              aria-selected={activeModule === item.key}
              className={activeModule === item.key ? "active" : ""}
              key={item.key}
              onClick={() => changeModule(item.key)}
              role="tab"
            >
              <i>{item.index}</i>
              <span>
                <b>{item.label}</b>
                <small>{item.title}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="stage-tabs" role="tablist" aria-label={`${selectedModule.label}场景`}>
          {selectedModule.stages.map((stage, index) => (
            <button
              aria-selected={stageByModule[selectedModule.key] === stage.key}
              className={stageByModule[selectedModule.key] === stage.key ? "active" : ""}
              key={stage.key}
              onClick={() =>
                setStageByModule((current) => ({
                  ...current,
                  [selectedModule.key]: stage.key,
                }))
              }
              role="tab"
            >
              <i>0{index + 1}</i>
              {stage.label}
              <small>{stage.kicker}</small>
            </button>
          ))}
        </div>
        <ProductScreen
          module={selectedModule}
          selectedPlugin={selectedPlugin}
          selectedVideo={selectedVideo}
          setSelectedPlugin={setSelectedPlugin}
          setSelectedVideo={setSelectedVideo}
          stageKey={stageByModule[selectedModule.key]}
        />
      </section>

      <section className="discussion" id="discussion">
        <div className="discussion-copy">
          <div className="eyebrow">BRAINSTORMING GUIDE</div>
          <h2>建议团队先讨论流程，再讨论视觉</h2>
          <p>
            本轮目标不是确认按钮颜色，而是找出用户是否理解任务、是否愿意提供数据、哪些动作必须人工确认，以及系统怎样证明结果可信。
          </p>
        </div>
        <div className="discussion-grid">
          {[
            ["01", "用户价值", "每条链路最早在哪一步让客户感受到价值？能否再提前？"],
            ["02", "数据与信任", "系统调用、生成和评分的依据，哪些必须展示给运营人员？"],
            ["03", "人工边界", "报价、发送、停止召回等高风险动作，人工确认点放在哪里？"],
            ["04", "每日习惯", "如何把三个模块压缩成运营人员每天 30 分钟内可完成的任务？"],
          ].map(([number, title, text]) => (
            <article key={number}>
              <i>{number}</i>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div>
          <b>AI 营销增长工作台</b>
          <span>装修行业产品草图 · 仅用于内部讨论</span>
        </div>
        <button className="button button-secondary" onClick={copyLink}>
          {copied ? "链接已复制" : "复制页面链接"}
        </button>
      </footer>
    </main>
  );
}
