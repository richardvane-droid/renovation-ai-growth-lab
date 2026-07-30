"use client";

import { useMemo, useRef, useState } from "react";
import {
  conversations,
  customers,
  Screen,
  videos,
} from "./prototype-data";

type ScreenProps = {
  screen: Screen;
  goTo: (id: string) => void;
  notify: (message: string) => void;
};

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Button({
  children,
  onClick,
  kind = "default",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: "default" | "primary" | "danger" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      className={`ui-button ui-button-${kind}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Card({
  title,
  caption,
  children,
  action,
  className = "",
}: {
  title?: string;
  caption?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || caption || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {caption && <p>{caption}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <span className="progress-track">
      <span style={{ width: `${value}%` }} />
    </span>
  );
}

function EmptyCover({
  label,
  index = 0,
  portrait = false,
}: {
  label: string;
  index?: number;
  portrait?: boolean;
}) {
  return (
    <div className={`media-cover cover-${(index % 6) + 1} ${portrait ? "portrait" : ""}`}>
      <span>▶</span>
      <small>{label}</small>
    </div>
  );
}

function FileUpload({
  label,
  onUpload,
}: {
  label: string;
  onUpload: (name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        className="visually-hidden"
        type="file"
        accept="video/*,image/*,.pdf,.doc,.docx,.xlsx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file.name);
        }}
      />
      <Button kind="primary" onClick={() => ref.current?.click()}>
        {label}
      </Button>
    </>
  );
}

function BusinessScreen({ notify }: Pick<ScreenProps, "notify">) {
  const categories = [
    "全屋定制",
    "橱柜",
    "衣柜",
    "榻榻米 / 柜体",
    "整木定制 / 护墙板",
    "木门",
    "系统门窗",
    "旧房翻新",
  ];
  const regions = ["漳州市", "厦门市", "泉州市", "龙岩市", "福州市", "福建省其他地区"];
  const [selectedCategories, setSelectedCategories] = useState(["全屋定制", "橱柜", "衣柜", "榻榻米 / 柜体"]);
  const [selectedRegions, setSelectedRegions] = useState(["漳州市", "厦门市"]);
  const [saved, setSaved] = useState(true);

  function toggle(value: string, selected: string[], setter: (next: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
    setSaved(false);
  }

  return (
    <div className="business-layout">
      <Card
        title="选择业务信息"
        caption="两项均为必填，支持多选"
        className="form-card"
      >
        <div className="selection-group">
          <div className="selection-title">
            <b>主营品类</b>
            <span>已选 {selectedCategories.length} 项</span>
          </div>
          <div className="check-grid">
            {categories.map((item) => (
              <button
                className={selectedCategories.includes(item) ? "check-option selected" : "check-option"}
                key={item}
                onClick={() => toggle(item, selectedCategories, setSelectedCategories)}
                type="button"
              >
                <i>{selectedCategories.includes(item) ? "✓" : ""}</i>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="selection-group">
          <div className="selection-title">
            <b>服务区域</b>
            <span>已选 {selectedRegions.length} 项</span>
          </div>
          <div className="check-grid">
            {regions.map((item) => (
              <button
                className={selectedRegions.includes(item) ? "check-option selected" : "check-option"}
                key={item}
                onClick={() => toggle(item, selectedRegions, setSelectedRegions)}
                type="button"
              >
                <i>{selectedRegions.includes(item) ? "✓" : ""}</i>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="summary-bar">
          <b>共选择 {selectedCategories.length} 个品类、{selectedRegions.length} 个区域</b>
          <Button
            kind="primary"
            onClick={() => {
              if (!selectedCategories.length || !selectedRegions.length) {
                notify("主营品类和服务区域均不能为空");
                return;
              }
              setSaved(true);
              notify("业务信息已保存，匹配视频正在更新");
            }}
          >
            保存业务信息
          </Button>
        </div>
      </Card>
      <Card
        title="已保存内容"
        caption="最近保存：今天 14:32"
        action={<Pill tone={saved ? "positive" : "warning"}>{saved ? "已保存" : "有修改"}</Pill>}
        className="saved-card"
      >
        <div className="identity-card">
          <b>有大有小｜漳州全屋定制</b>
          <span>当前正在使用 · 可随时修改</span>
        </div>
        <div className="saved-block">
          <div><b>主营品类</b><span>{selectedCategories.length} 项</span></div>
          <div className="chip-wrap">{selectedCategories.map((item) => <Pill key={item}>{item}</Pill>)}</div>
          <div className="link-actions"><button onClick={() => notify("已进入编辑状态")}>编辑</button><button onClick={() => { setSelectedCategories([]); setSaved(false); }}>删除</button></div>
        </div>
        <div className="saved-block">
          <div><b>服务区域</b><span>{selectedRegions.length} 项</span></div>
          <div className="chip-wrap">{selectedRegions.map((item) => <Pill key={item}>{item}</Pill>)}</div>
          <div className="link-actions"><button onClick={() => notify("已进入编辑状态")}>编辑</button><button onClick={() => { setSelectedRegions([]); setSaved(false); }}>删除</button></div>
        </div>
        <Button onClick={() => notify("新的业务配置表单已准备好")}>＋ 添加新的业务配置</Button>
      </Card>
    </div>
  );
}

function LabelScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [labels, setLabels] = useState<Record<number, "match" | "no" | undefined>>({
    0: "match",
    1: "match",
    2: "no",
  });
  const completed = Object.values(labels).filter(Boolean).length;
  return (
    <div className="stack">
      <div className="filter-bar">
        <b>为“全屋定制 · 漳州/厦门”匹配的首批样本</b>
        <span>已标记 {completed} / 10</span>
        <Button onClick={() => notify("已加载下一批 10 条候选视频")}>继续标记更多视频</Button>
      </div>
      <div className="video-list">
        {videos.slice(0, 10).map((video, index) => (
          <article className="video-row" key={video.title}>
            <button className="cover-button" onClick={() => goTo("video-label-detail")} type="button">
              <EmptyCover index={index} label={video.duration} />
            </button>
            <div className="video-copy">
              <b>{video.title}</b>
              <span>{video.account} · {video.views} 播放</span>
              <small>匹配理由：{index % 2 ? "包含真实完工空间、板材与柜体细节" : "痛点开场 + 前后对比 + 到店行动"}</small>
            </div>
            <div className="label-actions">
              <button
                className={labels[index] === "match" ? "selected positive" : ""}
                onClick={() => setLabels((current) => ({ ...current, [index]: "match" }))}
                type="button"
              >
                ✓ 匹配
              </button>
              <button
                className={labels[index] === "no" ? "selected negative" : ""}
                onClick={() => setLabels((current) => ({ ...current, [index]: "no" }))}
                type="button"
              >
                × 不匹配
              </button>
              {labels[index] && <button className="text-button" onClick={() => setLabels((current) => ({ ...current, [index]: undefined }))}>撤销</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SliceScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [files, setFiles] = useState([
    ["龙文店厨房安装实拍.mp4", "已完成", "12"],
    ["衣柜封边细节.mov", "分析中", "—"],
    ["118㎡完工全景.mp4", "已完成", "9"],
    ["儿童房收纳改造.mp4", "已完成", "7"],
  ]);
  return (
    <div className="stack">
      <div className="filter-bar">
        <div>
          <b>真实素材库</b>
          <span>自动识别镜头、动作、场景和可复用话术</span>
        </div>
        <FileUpload
          label="＋ 上传本地视频"
          onUpload={(name) => {
            setFiles((current) => [[name, "分析中", "—"], ...current]);
            notify(`${name} 已上传，正在分析`);
          }}
        />
      </div>
      <div className="asset-table">
        <div className="asset-table-head"><span>视频</span><span>状态</span><span>可归档片段</span><span>内容描述</span><span>操作</span></div>
        {files.map(([name, status, count], index) => (
          <div className="asset-table-row" key={`${name}-${index}`}>
            <EmptyCover index={index} label={index % 2 ? "00:36" : "00:42"} />
            <div><b>{name}</b><small>{index % 2 ? "门店实拍 · 竖屏" : "工地现场 · 横屏"}</small></div>
            <Pill tone={status === "已完成" ? "positive" : "warning"}>{status}</Pill>
            <strong>{count}</strong>
            <span>{status === "已完成" ? "安装工艺、空间全景、柜体细节、客户动线" : "正在识别镜头与语义…"}</span>
            <div className="row-actions">
              <button onClick={() => goTo("video-slice-detail")}>详情</button>
              <button onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpokespersonScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const specs = [
    ["正面口播", "9:16 · 1080P · 30–60 秒", "镜头平视，完整说一段门店介绍", "已完成"],
    ["转身展示", "9:16 · 1080P · 15–30 秒", "半身入镜，左右转身与自然手势", "已完成"],
    ["情绪语料", "16:9 · 1080P · 60 秒", "平静、热情、解释、邀约四种语气", "待上传"],
  ];
  return (
    <div className="spokesperson-layout">
      <Card title="代言人档案" caption="门店店长 · 杜海鹏" className="profile-card">
        <div className="portrait-placeholder">杜</div>
        <div className="profile-meta">
          <b>杜店长｜漳州龙文店</b>
          <span>角色：专业顾问型店长</span>
          <span>适合：工艺讲解、门店介绍、方案邀约</span>
          <Pill tone="positive">肖像授权已确认</Pill>
        </div>
        <FileUpload label="替换正面照片" onUpload={(name) => notify(`${name} 已设为代言人照片`)} />
      </Card>
      <Card title="视频规格与状态" caption="不同规格用于口播合成、动作匹配与情绪控制" className="spec-card">
        {specs.map(([title, spec, description, status], index) => (
          <div className="spec-row" key={title}>
            <EmptyCover portrait index={index + 2} label={index === 2 ? "待上传" : "00:42"} />
            <div><b>{title}</b><span>{spec}</span><small>{description}</small></div>
            <Pill tone={status === "已完成" ? "positive" : "warning"}>{status}</Pill>
            <Button onClick={() => status === "已完成" ? goTo("video-spokesperson-detail") : notify("请选择本地视频上传")}>{status === "已完成" ? "查看" : "上传"}</Button>
          </div>
        ))}
      </Card>
      <Card title="演示视频" caption="真实案例：杜店长介绍 568 元/㎡活动与板材配置" className="demo-card">
        <EmptyCover portrait index={5} label="00:38 · 查看示例" />
        <p>镜头平视、安静环境、人物腰部以上入镜；开头停顿 1 秒，结尾保持自然表情 2 秒。</p>
      </Card>
    </div>
  );
}

function TopVideosScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [day, setDay] = useState("今天 7/31");
  const [selected, setSelected] = useState(0);
  return (
    <div className="stack">
      <div className="filter-bar">
        <div className="segmented">
          {["今天 7/31", "昨天 7/30", "前天 7/29"].map((item) => (
            <button className={day === item ? "active" : ""} key={item} onClick={() => setDay(item)}>{item}</button>
          ))}
        </div>
        <span>每日 09:00 更新 · 仅保留最近三天</span>
        <Button kind="primary" onClick={() => notify(`已选择「${videos[selected].title}」作为今日参考`)}>
          使用已选视频
        </Button>
      </div>
      <div className="top-video-grid">
        {videos.map((video, index) => (
          <article className={selected === index ? "top-video-card selected" : "top-video-card"} key={video.title}>
            <button onClick={() => setSelected(index)} type="button">
              <EmptyCover portrait index={index} label={video.duration} />
            </button>
            <div className="rank-badge">#{index + 1}</div>
            <b>{video.title}</b>
            <span>{video.account}</span>
            <div className="metric-row"><small>赞 {video.likes}</small><small>评 {video.comments}</small><small>藏 {video.saves}</small><small>转 {video.shares}</small></div>
            <div className="card-actions"><button onClick={() => setSelected(index)}>{selected === index ? "✓ 已选中" : "选择"}</button><button onClick={() => goTo("video-competitor-detail")}>详情</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReportScreen({ notify }: Pick<ScreenProps, "notify">) {
  const [ready, setReady] = useState(true);
  const report = [
    ["00:00–00:03", "钩子", "“33㎡钻石厨房，台面竟多出 1.8 米”", "快速推近 + 数字字幕"],
    ["00:03–00:10", "问题", "原户型转角浪费、两人操作拥挤", "手持绕行 + 红线标注"],
    ["00:10–00:24", "方案", "高低台、钻石转角与电器高柜", "三段匹配剪辑"],
    ["00:24–00:34", "证明", "安装前后同机位对比", "遮罩擦除转场"],
    ["00:34–00:42", "行动", "领取同户型厨房规划清单", "店长正面口播"],
  ];
  if (!ready) {
    return (
      <div className="analysis-state">
        <div className="spinner" />
        <h3>正在分析爆款结构</h3>
        <p>已完成画面切片，正在识别话术与自然流量信号。</p>
        <Progress value={63} />
        <span>预计剩余 1 分 40 秒</span>
        <Button onClick={() => setReady(true)}>完成分析演示</Button>
      </div>
    );
  }
  return (
    <article className="report">
      <div className="report-title">
        <div><Pill tone="positive">分析完成</Pill><h2>《33㎡钻石厨房》自然流量结构拆解</h2><p>样本：42 秒 · 8.6 万自然播放 · 完播率 41.8% · 搜藏率 17.3%</p></div>
        <Button onClick={() => setReady(false)}>查看分析中状态</Button>
      </div>
      <div className="report-summary">
        <strong>核心结论</strong>
        <p>这条视频用“反常面积 + 明确收益”完成前三秒钩子；中段用同机位真实对比证明方案，而不是堆叠效果图；结尾由门店店长给出低承诺行动，形成自然咨询。</p>
      </div>
      <div className="report-table">
        <div><b>片段</b><b>结构作用</b><b>话术</b><b>转场与画面</b></div>
        {report.map((row) => <div key={row[0]}>{row.map((item) => <span key={item}>{item}</span>)}</div>)}
      </div>
      <div className="insight-grid">
        <Card title="主角特征"><p>35–45 岁店长形象；语速 220 字/分钟；不夸张表演；镜头始终在真实门店或工地。</p></Card>
        <Card title="可复用结构"><p>数字反差开场 → 痛点走位 → 方案细节 → 同机位证明 → 领取清单。</p></Card>
        <Card title="避免照搬"><p>不可复刻竞品户型与文案；需替换为门店真实案例、价格库与服务区域。</p></Card>
      </div>
      <Button kind="primary" onClick={() => notify("报告结构已确认，已进入视频生成任务")}>确认结构并开始生成</Button>
    </article>
  );
}

function ProgressScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [paused, setPaused] = useState(false);
  const pipeline = [
    ["脚本改写", "已完成", "positive"],
    ["分镜拆解", "已完成", "positive"],
    ["素材匹配", "已完成", "positive"],
    ["口播合成", paused ? "已暂停" : "进行中 6/8", "warning"],
    ["剪辑打包", "等待中", "neutral"],
    ["质检导出", "等待中", "neutral"],
  ] as const;
  const logs = [
    ["14:32:01", "脚本改写", "检测到钩子句式，自动优化开头文案结构", "完成"],
    ["14:32:18", "分镜拆解", "拆分为 12 个分镜片段，平均时长 3.5 秒", "完成"],
    ["14:32:45", "素材匹配", "厨房实拍素材匹配成功，相似度 94%", "完成"],
    ["14:33:02", "素材匹配", "片段 #7 替换为高清钻石台面特写", "完成"],
    ["14:33:38", "口播合成", "品牌声明校验失败：缺少品牌角标水印", "重试"],
    ["14:33:52", "口播合成", "自动重试成功：已补充品牌角标水印", "完成"],
    ["14:34:05", "口播合成", paused ? "任务已由用户暂停" : "正在合成第 6/8 段口播音频…", paused ? "暂停" : "进行中"],
  ];
  return (
    <div className="stack">
      <Card title="任务 AKKE-VIDEO-0729" caption="基准视频：33㎡钻石厨房案例｜42 秒｜8.6 万自然播放">
        <div className="task-progress"><b>总进度 {paused ? "73" : "76"}%</b><Progress value={paused ? 73 : 76} /><span>{paused ? "任务已暂停" : "预计剩余 1 分 40 秒"}</span></div>
      </Card>
      <Card title="生成流水线">
        <div className="pipeline">
          {pipeline.map(([title, status, tone]) => <div key={title}><b>{title}</b><Pill tone={tone}>{status}</Pill></div>)}
        </div>
      </Card>
      <Card title="实时日志" action={<button className="text-link" onClick={() => goTo("video-log-detail")}>打开日志详情 ›</button>} className="log-card">
        <div className="log-table">
          <div><b>时间</b><b>模块</b><b>事件描述</b><b>状态</b></div>
          {logs.map((row) => <div key={`${row[0]}${row[2]}`}>{row.map((item, index) => <span className={index === 3 ? `status-${item}` : ""} key={item}>{item}</span>)}</div>)}
        </div>
      </Card>
      <div className="button-row">
        <Button onClick={() => { setPaused((value) => !value); notify(paused ? "任务已继续" : "任务已暂停"); }}>{paused ? "继续任务" : "暂停任务"}</Button>
        <Button kind="danger" onClick={() => notify("取消操作需要二次确认，演示版未执行")}>取消生成</Button>
        <Button onClick={() => notify("已打开本任务的全部输入素材")}>查看输入素材</Button>
      </div>
    </div>
  );
}

function ResultScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  return (
    <div className="result-layout">
      <Card title="今日成片" caption="AKKE-VIDEO-0729 · 9:16 · 42 秒" className="result-player">
        <EmptyCover portrait index={1} label="点击播放成片" />
        <div className="version-tabs"><button className="active">V3 推荐版</button><button>V2 字幕版</button><button>V1 初稿</button></div>
      </Card>
      <Card title="自动质检" caption="全部 8 项通过" className="qa-list">
        {[
          ["画面清晰度", "97", "positive"],
          ["字幕安全区", "通过", "positive"],
          ["口播与字幕一致", "99%", "positive"],
          ["品牌角标", "通过", "positive"],
          ["价格承诺", "无风险", "positive"],
          ["音乐版权", "可商用", "positive"],
          ["敏感词", "0 条", "positive"],
          ["视频完整性", "通过", "positive"],
        ].map(([label, value, tone]) => <div className="qa-item" key={label}><span>{label}</span><Pill tone={tone as "positive"}>{value}</Pill></div>)}
        <Button kind="primary" onClick={() => notify("成片已下载：AKKE-VIDEO-0729-V3.mp4")}>下载可发布成片</Button>
        <Button onClick={() => goTo("video-result-detail")}>查看成片详情</Button>
      </Card>
      <Card title="发布建议" caption="根据样本互动峰值和本店粉丝在线时间">
        <div className="publish-suggestion"><strong>今天 19:40–20:10</strong><span>标题建议：33㎡钻石厨房，台面多出 1.8 米是怎么做到的？</span><span>首评建议：回复“厨房”，领取同户型动线规划清单。</span></div>
      </Card>
    </div>
  );
}

function TrainingScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [docs, setDocs] = useState([
    ["销售培训手册 2026.pdf", "已解析", "126 条知识"],
    ["568 元套餐与包含项.xlsx", "已解析", "48 条价格规则"],
    ["暑期焕新季活动规则.docx", "已解析", "12 条活动规则"],
    ["门店地址与接待库存.xlsx", "已解析", "3 家门店"],
    ["板材配置说明.pdf", "有冲突", "2 条待处理"],
  ]);
  return (
    <div className="stack">
      <div className="filter-bar">
        <div><b>销售可信知识源</b><span>价格、活动名额、地址等已入库信息可以承诺；其他内容谨慎表达。</span></div>
        <FileUpload label="＋ 上传培训资料" onUpload={(name) => { setDocs((current) => [[name, "解析中", "—"], ...current]); notify(`${name} 正在解析`); }} />
      </div>
      <div className="doc-grid">
        {docs.map(([name, status, count], index) => (
          <Card key={name} className="doc-card">
            <div className="doc-icon">{name.split(".").pop()?.toUpperCase()}</div>
            <div><b>{name}</b><span>{count}</span></div>
            <Pill tone={status === "已解析" ? "positive" : status === "有冲突" ? "warning" : "info"}>{status}</Pill>
            <button onClick={() => goTo("sales-training-detail")}>查看解析 ›</button>
            <button onClick={() => setDocs((current) => current.filter((_, i) => i !== index))}>删除</button>
          </Card>
        ))}
      </div>
      <Card title="知识覆盖情况">
        <div className="coverage-grid">{[["价格与包含项", 96], ["活动与名额", 100], ["材料与工艺", 88], ["门店与服务区域", 100], ["售后与工期", 72]].map(([label, value]) => <div key={String(label)}><span>{label}</span><b>{value}%</b><Progress value={Number(value)} /></div>)}</div>
      </Card>
    </div>
  );
}

function ChampionScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const samples = [
    ["CASE-001", "林女士｜118㎡原木风", "到店", "先确认风格，再用活动名额完成邀约"],
    ["CASE-002", "陈先生｜预算 15 万", "到店", "分档解释价格，邀请带户型到店"],
    ["CASE-003", "周女士｜关注环保", "到店", "引用 ENF 板材配置与检测报告"],
    ["CASE-004", "吴先生｜地址偏远", "量房", "确认区域后预约免费上门测量"],
    ["CASE-005", "张女士｜只看效果图", "继续沟通", "用风格选择题补齐基础信息"],
    ["CASE-006", "黄先生｜多次压价", "未转化", "坚持承诺边界，未虚构优惠"],
    ["CASE-007", "赵女士｜旧房翻新", "到店", "先问改造范围，再推荐真实案例"],
    ["CASE-008", "王先生｜新房未交付", "留资", "发送装修时间表，低频培育"],
    ["CASE-009", "李女士｜板材对比", "到店", "说明品牌差异，不攻击竞品"],
    ["CASE-010", "郭先生｜周末有空", "到店", "核实库存后确认接待时段"],
  ];
  return (
    <div className="stack">
      <div className="filter-bar"><b>销冠真实对话样本 10 / 10</b><span>客户隐私已脱敏 · 成功结果统一为“客户到店”</span><Button kind="primary" onClick={() => notify("10 段样本已提交训练")}>提交训练</Button></div>
      <div className="sample-table">
        <div><b>样本</b><b>客户场景</b><b>结果</b><b>识别出的关键策略</b><b>操作</b></div>
        {samples.map((row) => <div key={row[0]}>{row.slice(0, 4).map((item, i) => i === 2 ? <Pill tone={item === "到店" ? "positive" : "neutral"} key={item}>{item}</Pill> : <span key={item}>{item}</span>)}<button onClick={() => goTo("sales-champion-detail")}>查看详情 ›</button></div>)}
      </div>
    </div>
  );
}

function SimulationScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [current, setCurrent] = useState(68);
  const [score, setScore] = useState(4);
  return (
    <div className="simulation-layout">
      <Card title={`模拟演练 ${current + 1} / 100`} caption="场景：客户询问报价并希望周末到店" className="simulation-chat">
        <div className="chat customer"><b>客户</b><p>我家 118㎡，预算 15 万，周末能过去看看。你们 568 元/㎡活动还在吗？</p></div>
        <div className="chat robot"><b>机器人</b><p>活动仍在有效期。为了给您安排更合适的设计师，想先确认您更偏奶油风还是原木风？周六下午目前还有 2 个接待名额。</p></div>
        <div className="score-grid">
          {["需求理解", "回答准确", "承诺边界", "到店推进"].map((item) => <label key={item}><span>{item}</span><div>{[1,2,3,4,5].map((n) => <button className={n <= score ? "active" : ""} key={n} onClick={() => setScore(n)}>{n}</button>)}</div></label>)}
        </div>
        <textarea defaultValue="信息完整，活动与名额均来自可信数据；建议将“名额”与具体门店绑定。" aria-label="标注意见" />
        <div className="button-row"><Button onClick={() => goTo("sales-simulation-detail")}>打开场景详情</Button><Button kind="primary" onClick={() => { setCurrent((value) => Math.min(99, value + 1)); notify("评分已保存，进入下一组"); }}>提交并下一组</Button></div>
      </Card>
      <Card title="标注进度" caption="预计剩余 22 分钟" className="simulation-progress">
        <strong>{current}%</strong><Progress value={current} />
        <div className="mini-stats"><span><b>68</b> 已完成</span><span><b>17</b> 需改写</span><span><b>6</b> 高风险</span></div>
        <Pill tone="warning">优先完成活动承诺类场景</Pill>
      </Card>
    </div>
  );
}

function PromptScreen({ notify }: Pick<ScreenProps, "notify">) {
  const [version, setVersion] = useState("V3 草稿");
  const [text, setText] = useState(`你是“有大有小｜漳州全屋定制”的专业销售顾问。

目标：通过自然对话帮助客户明确需求，并推动客户到店。

工作规则：
1. 先确认户型、地址、预算和风格，再提供建议。
2. 活动价格、活动名额、门店地址仅在知识库有明确记录时承诺。
3. 报价按“基础 / 品质 / 高配”三档解释，不虚构折扣。
4. 客户表达明确拒绝、投诉或复杂施工问题时，立即转人工。
5. 表达专业、简洁、不压迫；每次只问一个关键问题。`);
  return (
    <div className="prompt-layout">
      <Card title="机器人整体风格和规则" caption="系统根据培训资料、销冠对话和 100 组演练自动生成" className="prompt-editor">
        <div className="prompt-toolbar"><Pill tone="info">{version}</Pill><span>上次发布：V2 · 今天 09:15</span></div>
        <textarea value={text} onChange={(event) => setText(event.target.value)} aria-label="机器人提示词" />
        <div className="button-row"><Button onClick={() => setText((value) => `${value}\n6. 对客户敏感信息只用于本次服务。`)}>＋ 添加规则</Button><Button kind="primary" onClick={() => { setVersion("V3 已发布"); notify("提示词 V3 已发布并立即生效"); }}>发布新版本</Button></div>
      </Card>
      <Card title="规则检查" caption="发布前自动检查" className="rule-checks">
        {["价格承诺只引用价格库", "活动名额只引用库存", "成功目标为客户到店", "人工接管条件完整", "无过度收集隐私"].map((item) => <div key={item}><span>✓</span>{item}</div>)}
        <div className="rule-warning"><b>1 条建议</b><p>可增加“客户只想了解风格时，不立即追问预算”的柔性规则。</p></div>
      </Card>
    </div>
  );
}

function MetricsScreen({ notify }: Pick<ScreenProps, "notify">) {
  const cards = [["新增会话", "128", "+12.4%"], ["有效需求", "74", "+8.8%"], ["到店预约", "11", "+3"], ["机器人独立完成", "81.6%", "+5.2%"], ["人工接管", "8", "-2"]];
  return (
    <div className="stack">
      <div className="filter-bar"><b>今天 · 2026/07/31</b><span>数据更新至 15:20</span><Button onClick={() => notify("日报链接已复制")}>分享日报</Button></div>
      <div className="metric-cards">{cards.map(([label,value,change]) => <Card key={label} className="metric-card"><span>{label}</span><strong>{value}</strong><small>{change} 较昨日</small></Card>)}</div>
      <div className="dashboard-grid">
        <Card title="从加企微到到店漏斗" caption="成功转化口径：客户实际到店">
          <div className="funnel">{[["新增企微",128,100],["有效对话",96,75],["明确需求",74,58],["预约到店",18,14],["实际到店",11,9]].map(([label,value,width]) => <div key={String(label)} style={{width:`${width}%`}}><span>{label}</span><b>{value}</b></div>)}</div>
        </Card>
        <Card title="机器人处理质量" caption="按今日真实会话自动统计">
          <div className="quality-bars">{[["回答正确率",94],["需求识别率",91],["承诺边界合规",98],["到店推进有效",76],["表达自然度",87]].map(([label,value]) => <div key={String(label)}><span>{label}</span><b>{value}%</b><Progress value={Number(value)} /></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

function QualityScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [selected, setSelected] = useState(0);
  const customer = conversations[selected];
  return (
    <div className="quality-layout">
      <Card title="按成交意愿从高到低" caption="待质检 23 · 高风险 3" className="conversation-list">
        {conversations.map((row, index) => (
          <button className={selected === index ? "conversation-item selected" : "conversation-item"} onClick={() => setSelected(index)} key={row[0]}>
            <div><b>{row[0]}　意愿 {row[1]}</b><small>{row[3]}</small></div><span>{row[2]}</span><em>{row[4]}　查看详情 ›</em>
          </button>
        ))}
      </Card>
      <Card title={`${customer[0]}｜意愿 ${customer[1]}｜${customer[4]}`} action={<Pill tone="positive">成功目标：到店</Pill>} className="quality-detail">
        <div className="chat customer"><b>客户</b><p>我家 118㎡，预算 15 万，周末能过去看看。</p></div>
        <div className="chat robot"><b>机器人</b><p>可以。为了安排更合适的设计师，您更偏奶油风还是原木风？</p></div>
        <div className="chat customer"><b>客户</b><p>原木风。活动 568 元/㎡，周末还有名额吗？</p></div>
        <div className="chat robot"><b>机器人</b><p>活动仍在有效期，周六下午还有 2 个接待名额。我先为您登记 15:00 到店意向。</p></div>
        <div className="review-box"><b>人工评判</b><div className="chip-wrap"><Pill tone="positive">✓ 合格</Pill><Pill>需修改</Pill><Pill tone="danger">高风险</Pill></div><span>需求理解 5/5　承诺边界 5/5　到店推进 5/5　表达自然度 4/5</span><textarea defaultValue="建议始终使用“登记到店意向”，避免使用“临时保留”。" /></div>
        <div className="button-row"><Button kind="primary" onClick={() => notify("质检结果已保存，进入下一条")}>通过并下一条</Button><Button onClick={() => goTo("sales-conversation-detail")}>打开完整案例详情</Button></div>
      </Card>
    </div>
  );
}

function FaqScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const faqs = [
    ["全屋定制怎么报价？", "82", "76%", "待优化", "价格"],
    ["568 元/㎡包含哪些内容？", "74", "91%", "已优化", "活动"],
    ["用什么板材？环保吗？", "67", "84%", "待优化", "材料"],
    ["多久可以安装完成？", "51", "72%", "待优化", "工期"],
    ["可以免费量房吗？", "46", "95%", "已优化", "服务"],
    ["漳州哪些区域可以上门？", "39", "98%", "已优化", "区域"],
    ["活动还有名额吗？", "34", "88%", "需绑定库存", "活动"],
  ];
  return (
    <div className="stack">
      <div className="filter-bar"><b>近 7 天高频问题</b><span>优先处理“提问多 + 回答满意度低”的问题</span><Button onClick={() => notify("已按提问次数排序")}>按频次排序</Button></div>
      <div className="faq-table">
        <div><b>问题</b><b>提问次数</b><b>满意度</b><b>分类</b><b>状态</b><b>操作</b></div>
        {faqs.map((row) => <div key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><span>{row[2]}</span><Pill>{row[4]}</Pill><Pill tone={row[3] === "已优化" ? "positive" : "warning"}>{row[3]}</Pill><button onClick={() => goTo("sales-faq-detail")}>调整回答 ›</button></div>)}
      </div>
    </div>
  );
}

const plugins = [
  ["A", "户型图 + 风格方案", "客户发送户型图与风格后，自动返回同户型案例与初步布局", "已开通", "1,284"],
  ["B", "自动报价详细方案", "识别面积与户型，调用门店价格库生成三档报价明细", "配置中", "628"],
  ["C", "免费上门测量", "收集预算与地址，确认服务范围后预约免费量房和方案", "已开通", "416"],
  ["D", "风格选择题", "信息不足时发送效果图选择题，几轮后补齐客户基础信息", "未开通", "—"],
];

function PluginCenterScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  return (
    <div className="plugin-grid">
      {plugins.map(([letter,title,description,status,count], index) => (
        <Card className="plugin-card" key={letter}>
          <div className="plugin-letter">{letter}</div><Pill tone={status === "已开通" ? "positive" : status === "配置中" ? "warning" : "neutral"}>{status}</Pill>
          <h3>{title}</h3><p>{description}</p>
          <div className="plugin-stats"><span>近 30 天触发</span><strong>{count}</strong></div>
          <div className="button-row"><Button onClick={() => notify(`已打开 ${title} 运行记录`)}>运行记录</Button><Button kind={index === 3 ? "primary" : "default"} onClick={() => goTo("sales-plugin-config")}>{index === 3 ? "开通插件" : "配置"}</Button></div>
        </Card>
      ))}
    </div>
  );
}

function PluginConfigScreen({ notify }: Pick<ScreenProps, "notify">) {
  const [selected, setSelected] = useState(1);
  const plugin = plugins[selected];
  return (
    <div className="plugin-config-layout">
      <Card title="选择插件" className="plugin-picker">
        {plugins.map((row,index) => <button className={selected === index ? "active" : ""} onClick={() => setSelected(index)} key={row[0]}><i>{row[0]}</i><span><b>{row[1]}</b><small>{row[3]}</small></span></button>)}
      </Card>
      <Card title={`${plugin[0]} · ${plugin[1]}`} caption="触发条件 → 可信数据 → 自动动作 → 人工兜底" className="config-form">
        <label><span>触发条件</span><input defaultValue={selected === 1 ? "客户明确提供面积 + 户型，并询问价格" : selected === 2 ? "客户提供地址 + 预算，并希望上门服务" : "客户信息满足插件要求"} /></label>
        <label><span>绑定知识</span><select defaultValue="有大有小｜漳州门店"><option>有大有小｜漳州门店</option><option>厦门门店价格库</option></select></label>
        <label><span>自动动作</span><textarea defaultValue={selected === 1 ? "调用价格库，生成基础 / 品质 / 高配三档详细报价，列明包含项与可选项。" : selected === 2 ? "核验地址服务范围与量房库存，生成 3 个候选时段供客户选择。" : plugin[2]} /></label>
        <div className="flow-steps">{["提取客户信息", "核验业务数据", "生成内容", "发送前风险检查", "创建人工跟进"].map((item,index) => <div key={item}><i>{index + 1}</i><span>{item}</span></div>)}</div>
        <label className="toggle-line"><input defaultChecked type="checkbox" />发送后创建人工跟进任务</label>
        <label className="toggle-line"><input defaultChecked type="checkbox" />价格、名额和服务范围不确定时禁止发送</label>
        <Button kind="primary" onClick={() => notify(`${plugin[1]} 配置已保存并通过测试`)}>保存并测试插件</Button>
      </Card>
    </div>
  );
}

function ActivitiesScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const activities = [
    ["暑期焕新季", "2026.07.15–08.15", "568 元/投影㎡ · 20 个到店名额", "进行中", "128"],
    ["免费量房周", "2026.08.01–08.07", "免费上门量房 + 初步方案", "待开始", "0"],
    ["ENF 板材公开课", "2026.07.18–07.31", "到店看样 + 环保检测讲解", "进行中", "74"],
    ["老客户转介绍", "长期", "成功到店赠保养服务", "进行中", "53"],
  ];
  return (
    <div className="activities-layout">
      <Card title="新增活动" caption="活动周期、价格、名额必须与业务库一致" className="activity-form">
        <label><span>活动名称</span><input defaultValue="免费量房周" /></label>
        <label><span>活动周期</span><input defaultValue="2026.08.01 — 2026.08.07" /></label>
        <label><span>核心权益</span><textarea defaultValue="免费上门测量 + 初步平面方案；每日 6 个服务名额。" /></label>
        <label><span>目标客群</span><input defaultValue="已发户型图、预算 10 万以上、未到店" /></label>
        <div className="poster-mini"><span>免费量房周</span><b>量房 + 初步方案</b><small>漳州 / 厦门指定区域</small></div>
        <Button kind="primary" onClick={() => notify("活动已保存，等待海报审核")}>保存活动</Button>
      </Card>
      <Card title="存量活动" caption="可查看、编辑、暂停或删除" className="activity-list">
        {activities.map((row) => <article key={row[0]}><div><b>{row[0]}</b><span>{row[1]}</span><small>{row[2]}</small></div><Pill tone={row[3] === "进行中" ? "positive" : "warning"}>{row[3]}</Pill><strong>{row[4]} 人</strong><button onClick={() => goTo("recall-activity-detail")}>详情 ›</button></article>)}
      </Card>
    </div>
  );
}

function RecallMetricsScreen() {
  return (
    <div className="stack">
      <div className="metric-cards">{[["召回中","386","+28"],["消息送达率","98.7%","+0.4%"],["回复率","30.9%","+6.4%"],["预约量房","28","+9"],["实际到店","16","+5"]].map(([l,v,c]) => <Card className="metric-card" key={l}><span>{l}</span><strong>{v}</strong><small>{c} 较上期</small></Card>)}</div>
      <div className="dashboard-grid">
        <Card title="七次触达回复表现" caption="第 3 次知识案例与第 4 次体验券表现最好">
          <div className="touch-chart">{[18,26,43,38,27,19,11].map((value,index) => <div key={index}><span style={{height:`${value*3}px`}} /><b>第{index+1}次</b><small>{value}%</small></div>)}</div>
        </Card>
        <Card title="内容类型效果" caption="近 30 天">
          <div className="content-ranking">{[["同小区案例","42.6%","positive"],["预算拆分知识","36.8%","info"],["免费量房券","34.1%","warning"],["板材环保知识","29.7%","info"],["活动海报","18.2%","danger"]].map(([label,value,tone],index) => <div key={label}><i>{index+1}</i><span>{label}</span><b>{value}</b><Pill tone={tone as "positive"}>{index < 2 ? "优先使用" : "观察"}</Pill></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

function RecallPoolScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [sort, setSort] = useState("信任分");
  const sorted = useMemo(() => [...customers].sort((a,b) => sort === "信任分" ? Number(b[3])-Number(a[3]) : a[5].localeCompare(b[5])), [sort]);
  return (
    <div className="stack">
      <div className="filter-bar"><div><b>正在召回的客户</b><span>共 386 人</span></div><select value={sort} onChange={(e) => setSort(e.target.value)}><option>信任分</option><option>下一次触达</option></select><input placeholder="搜索姓名 / 手机号" aria-label="搜索召回客户" /><Button onClick={() => notify("用户池已导出")}>导出用户池</Button></div>
      <div className="customer-table">
        <div><b>客户</b><b>装修阶段</b><b>联系阶段</b><b>信任分</b><b>召回策略</b><b>下一次</b></div>
        {sorted.map((row,index) => <button className={index===0 ? "selected" : ""} key={row[0]} onClick={() => goTo("recall-customer-detail")}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><strong className={Number(row[3]) > 70 ? "good" : Number(row[3]) < 30 ? "bad" : ""}>{row[3]}</strong><span>{row[4]}</span><em>{row[5]}<small>详情 ›</small></em></button>)}
      </div>
    </div>
  );
}

function CadenceScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const touches = [
    ["1", "知识", "《新房装修前先确认的 7 件事》", "加企微后 1 天", "已发送"],
    ["2", "案例", "同小区 118㎡原木风收纳案例", "第 1 次后 2 天", "已发送"],
    ["3", "知识", "15 万预算如何分配更合理", "第 2 次后 2 天", "待审核"],
    ["4", "权益", "免费上门量房体验券", "第 3 次后 3 天", "已排期"],
    ["5", "证明", "ENF 板材检测与工艺细节", "第 4 次后 3 天", "自动生成"],
    ["6", "活动", "暑期焕新季 · 周末 2 个名额", "第 5 次后 5 天", "自动生成"],
    ["7", "关怀", "温和收口：需要时随时找我", "第 6 次后 7 天", "自动生成"],
  ];
  return (
    <div className="cadence-layout">
      <Card title="林女士｜七次触达计划" caption="设计方案比较中 · 已报价未到店 · 信任分 82" className="touch-list">
        {touches.map((row,index) => <button className={index===2 ? "active" : ""} key={row[0]} onClick={() => goTo("recall-cadence-detail")}><i>{row[0]}</i><div><Pill>{row[1]}</Pill><b>{row[2]}</b><span>{row[3]}</span></div><Pill tone={row[4] === "已发送" ? "positive" : row[4] === "待审核" ? "warning" : "neutral"}>{row[4]}</Pill></button>)}
      </Card>
      <Card title="当前步骤详情" caption="第 3 次 · 预算知识" className="touch-detail">
        <div className="message-preview"><small>为林女士生成</small><h3>15 万预算，柜体应该花多少？</h3><p>结合您 118㎡原木风需求，建议先把预算按柜体 28%、硬装 42%、软装 30% 拆开，再决定可升级项。</p><span>附件：个性化预算知识海报</span></div>
        <div className="rule-box"><b>生成原因</b><p>客户询问过总价，但没有清楚理解包含项；此时先给知识，不直接推活动。</p></div>
        <div className="rule-box"><b>停止规则</b><p>客户明确拒绝、已选竞品或连续 2 次负面反馈时立即停止。</p></div>
        <Button kind="primary" onClick={() => notify("第 3 次触达已提交人工审核")}>提交发送审核</Button>
      </Card>
    </div>
  );
}

function RecallPluginScreen({ goTo }: Pick<ScreenProps, "goTo">) {
  return (
    <div className="plugin-grid recall-plugin-cards">
      <Card className="plugin-card"><div className="plugin-letter">A</div><Pill tone="positive">已启用</Pill><h3>个性化知识海报</h3><p>根据装修阶段、最近问题、预算与风格自动生成有用知识，不直接硬推活动。</p><div className="plugin-stats"><span>近 30 天发送</span><strong>1,842</strong></div><Button kind="primary" onClick={() => goTo("recall-poster")}>配置海报</Button></Card>
      <Card className="plugin-card"><div className="plugin-letter">B</div><Pill tone="positive">已启用</Pill><h3>免费上门测量券</h3><p>核验地址、服务区域和预约库存后，生成可核销体验券和候选时间。</p><div className="plugin-stats"><span>近 30 天核销</span><strong>86</strong></div><Button kind="primary" onClick={() => goTo("recall-coupon")}>配置体验券</Button></Card>
    </div>
  );
}

function PosterScreen({ notify }: Pick<ScreenProps, "notify">) {
  const [topic, setTopic] = useState("预算拆分");
  return (
    <div className="poster-layout">
      <Card title="海报生成规则" caption="客户阶段：预算犹豫期">
        <label><span>知识主题</span><select value={topic} onChange={(e)=>setTopic(e.target.value)}><option>预算拆分</option><option>板材环保</option><option>收纳规划</option><option>装修流程</option></select></label>
        <label><span>适用客户</span><input defaultValue="预算 10–20 万 · 已报价未到店" /></label>
        <label><span>品牌落款</span><input defaultValue="有大有小｜漳州全屋定制" /></label>
        <label className="toggle-line"><input defaultChecked type="checkbox" />自动引用客户面积和风格</label>
        <label className="toggle-line"><input defaultChecked type="checkbox" />发送前需要人工审核</label>
        <Button kind="primary" onClick={() => notify("海报模板已保存")}>保存海报模板</Button>
      </Card>
      <div className="knowledge-poster">
        <small>有大有小 · 装修知识</small>
        <h2>{topic === "预算拆分" ? "15 万预算，怎么分更合理？" : `${topic}，先看这 3 点`}</h2>
        <p>根据 118㎡原木风需求生成</p>
        <div><span>柜体</span><b>28%</b><Progress value={28}/></div>
        <div><span>硬装</span><b>42%</b><Progress value={42}/></div>
        <div><span>软装</span><b>30%</b><Progress value={30}/></div>
        <em>扫码领取同户型预算清单</em>
      </div>
    </div>
  );
}

function CouponScreen({ notify }: Pick<ScreenProps, "notify">) {
  return (
    <div className="coupon-layout">
      <Card title="体验券规则" caption="只有服务区域和库存均通过校验才允许发送">
        <label><span>权益名称</span><input defaultValue="免费上门量房 + 初步平面方案" /></label>
        <label><span>服务区域</span><input defaultValue="漳州市龙文区、芗城区；厦门市指定区域" /></label>
        <label><span>有效期</span><input defaultValue="领取后 7 天内预约" /></label>
        <label><span>每日库存</span><input defaultValue="漳州 6 单 / 厦门 4 单" /></label>
        <label className="toggle-line"><input defaultChecked type="checkbox" />发送前实时校验预约库存</label>
        <Button kind="primary" onClick={() => notify("体验券规则已保存并同步预约库存")}>保存体验券</Button>
      </Card>
      <div className="coupon-card">
        <small>有大有小 · 专属到店权益</small><h2>免费上门量房</h2><p>赠送初步平面方案</p><div className="coupon-code">7 天内有效 · HZ0286</div><span>适用：漳州龙文区 / 芗城区</span><em>需预约 · 每户限用 1 次</em>
      </div>
    </div>
  );
}

function ReviewScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const pending = [
    ["林女士", "第 3 次 · 预算知识海报", "今天 16:30", "低风险"],
    ["赵女士", "第 4 次 · 免费量房体验券", "今天 18:00", "需审核"],
    ["吴先生", "第 6 次 · 暑期活动海报", "明天 10:00", "需审核"],
    ["王女士", "第 2 次 · 报价解释", "明天 14:00", "低风险"],
  ];
  return (
    <div className="review-layout">
      <Card title="待发送审核" caption="优先检查权益、价格、库存与高频触达" className="pending-list">
        {pending.map((row,index) => <button className={index===1 ? "active" : ""} key={row[0]} onClick={() => goTo("recall-review-detail")}><div><b>{row[0]}</b><span>{row[1]}</span><small>{row[2]}</small></div><Pill tone={row[3] === "低风险" ? "positive" : "warning"}>{row[3]}</Pill></button>)}
      </Card>
      <Card title="赵女士｜第 4 次触达" caption="免费上门量房体验券" className="review-evidence">
        <div className="evidence-block"><b>客户上下文</b><p>暂缓装修 · 3 天未回复 · 信任分 58 · 地址：漳州龙文区。</p></div>
        <div className="message-preview"><small>待发送内容</small><p>赵女士，之前您提到还没确定房屋尺寸。这里有一张免费上门量房体验券，领取后 7 天内可以预约，我们会给您一份初步平面方案。</p><span>附件：免费上门量房券 HZ0286</span></div>
        <div className="check-list">{["客户地址可服务", "活动仍在有效期", "候选时段有库存", "未作价格/结果承诺", "未触发停止规则", "发送频率合规"].map((item) => <div key={item}><span>✓</span>{item}<Pill tone="positive">通过</Pill></div>)}</div>
        <div className="button-row"><Button kind="primary" onClick={() => notify("审核通过，内容将按计划发送")}>批准并发送</Button><Button onClick={() => goTo("recall-review-detail")}>修改内容</Button><Button kind="danger" onClick={() => notify("该客户召回已停止")}>停止召回</Button></div>
      </Card>
    </div>
  );
}

function GenericDetail({ screen, goTo, notify }: ScreenProps) {
  const parent = screen.parent ?? "";
  const isConversation = screen.id.includes("conversation") || screen.id.includes("champion") || screen.id.includes("simulation");
  const isVideo = screen.module === "video";
  const isRecall = screen.module === "recall";
  return (
    <div className="detail-layout">
      <Card
        title={screen.title}
        caption={screen.summary}
        action={<Pill tone={screen.module === "video" ? "info" : screen.module === "sales" ? "positive" : "warning"}>真实案例</Pill>}
        className="detail-main"
      >
        {isVideo && (
          <div className="detail-video-area">
            <EmptyCover portrait={screen.id !== "video-slice-detail"} index={3} label="播放完整素材" />
            <div className="detail-facts">
              <h3>AKKE-VIDEO-0729｜33㎡钻石厨房</h3>
              <p>来源：有大有小漳州龙文店 · 2026/07/29 · 杜店长</p>
              <div className="metric-cards compact"><span><b>42 秒</b>时长</span><span><b>8.6万</b>自然播放</span><span><b>41.8%</b>完播率</span></div>
              <div className="segment-list">{["00:00–00:03 数字钩子", "00:03–00:10 厨房痛点", "00:10–00:24 钻石转角方案", "00:24–00:34 同机位对比", "00:34–00:42 门店行动"].map((item,index) => <button key={item}><i>{index+1}</i><span>{item}</span><em>编辑</em></button>)}</div>
            </div>
          </div>
        )}
        {isConversation && (
          <div className="detail-conversation">
            <div className="chat customer"><b>客户 14:42</b><p>我家 118㎡，预算 15 万，周末能过去看看。</p></div>
            <div className="chat robot"><b>机器人 14:42</b><p>可以。为了安排更合适的设计师，您更偏奶油风还是原木风？</p></div>
            <div className="chat customer"><b>客户 14:43</b><p>原木风。活动 568 元/㎡，周末还有名额吗？</p></div>
            <div className="chat robot"><b>机器人 14:43</b><p>活动仍在有效期，周六下午还有 2 个接待名额。我先为您登记 15:00 到店意向。</p></div>
            <div className="knowledge-cite"><b>本次引用的可信数据</b><p>活动库：暑期焕新季｜库存：周六 15:00 剩 2 个｜地址库：漳州龙文店</p></div>
          </div>
        )}
        {isRecall && (
          <div className="recall-detail">
            <div className="customer-profile"><div className="avatar-large">林</div><div><h3>林女士｜118㎡原木风</h3><p>设计方案比较中 · 已报价未到店 · 信任分 82</p><div className="chip-wrap"><Pill tone="positive">高意向</Pill><Pill>漳州龙文区</Pill><Pill>预算 15 万</Pill></div></div></div>
            <div className="timeline-detail">{["7/21 加企微并发送户型", "7/22 机器人完成需求确认", "7/24 发送同小区案例", "7/27 询问活动价格", "7/29 断联进入召回", "7/31 预算知识待审核"].map((item,index) => <div key={item}><i>{index+1}</i><span>{item}</span><Pill tone={index<4 ? "positive" : index===5 ? "warning" : "neutral"}>{index<4 ? "完成" : index===5 ? "待审核" : "自动"}</Pill></div>)}</div>
          </div>
        )}
        {screen.id === "sales-training-detail" && (
          <div className="parsed-detail"><h3>568 元套餐与包含项.xlsx</h3>{[["价格规则","568 元/投影㎡；原价 868 元"],["板材配置","兔宝宝 / 莫干山 / 千年舟 ENF 多层板"],["门板五金","双面 PET 门板 · PUR 封边 · 悍高五金"],["服务边界","设计、安装、售后全包"],["不包含","油工、乳胶漆与瓷砖全案"]].map(([label,value]) => <div key={label}><b>{label}</b><span>{value}</span><Pill tone="positive">可信</Pill></div>)}</div>
        )}
        {screen.id === "sales-faq-detail" && (
          <div className="faq-editor"><h3>全屋定制怎么报价？</h3><p>近 7 天提问 82 次 · 当前满意度 76%</p><label><span>标准回答</span><textarea defaultValue="我们按投影面积与柜体配置报价。当前活动是 568 元/投影㎡，包含 ENF 多层板、双面 PET 门板、PUR 封边与标准五金；具体金额需要结合户型、柜体数量和升级项核算。您可以发户型图，我先给您做三档估算。" /></label><label><span>引用证据</span><input defaultValue="价格库 V2026.07 · 活动库「暑期焕新季」" /></label><label><span>适用边界</span><input defaultValue="仅漳州/厦门指定服务区域；不含油工、乳胶漆、瓷砖" /></label></div>
        )}
        <div className="detail-actions"><Button onClick={() => goTo(parent)}>← 返回主列表</Button><Button kind="primary" onClick={() => notify(`${screen.title}已保存`)}>保存当前结果</Button></div>
      </Card>
      <Card title="自动检查与操作记录" caption="所有关键修改均保留证据" className="detail-side">
        {["业务数据来源可追溯", "当前内容在有效期内", "未超出服务区域", "无未经授权的价格承诺", "操作人：杜老板"].map((item) => <div className="audit-line" key={item}><span>✓</span>{item}</div>)}
        <div className="history-box"><b>最近操作</b><p>14:42 系统生成初稿</p><p>14:46 杜老板打开详情</p><p>14:51 修改说明内容</p></div>
        <Button onClick={() => notify("完整审计记录已导出")}>导出完整记录</Button>
      </Card>
    </div>
  );
}

export function ScreenContent({ screen, goTo, notify }: ScreenProps) {
  if (screen.detail) return <GenericDetail screen={screen} goTo={goTo} notify={notify} />;
  switch (screen.id) {
    case "video-business": return <BusinessScreen notify={notify} />;
    case "video-label": return <LabelScreen goTo={goTo} notify={notify} />;
    case "video-slices": return <SliceScreen goTo={goTo} notify={notify} />;
    case "video-spokesperson": return <SpokespersonScreen goTo={goTo} notify={notify} />;
    case "video-top": return <TopVideosScreen goTo={goTo} notify={notify} />;
    case "video-report": return <ReportScreen notify={notify} />;
    case "video-progress": return <ProgressScreen goTo={goTo} notify={notify} />;
    case "video-result": return <ResultScreen goTo={goTo} notify={notify} />;
    case "sales-training": return <TrainingScreen goTo={goTo} notify={notify} />;
    case "sales-champion": return <ChampionScreen goTo={goTo} notify={notify} />;
    case "sales-simulation": return <SimulationScreen goTo={goTo} notify={notify} />;
    case "sales-prompt": return <PromptScreen notify={notify} />;
    case "sales-metrics": return <MetricsScreen notify={notify} />;
    case "sales-quality": return <QualityScreen goTo={goTo} notify={notify} />;
    case "sales-faq": return <FaqScreen goTo={goTo} notify={notify} />;
    case "sales-plugins": return <PluginCenterScreen goTo={goTo} notify={notify} />;
    case "sales-plugin-config": return <PluginConfigScreen notify={notify} />;
    case "recall-activities": return <ActivitiesScreen goTo={goTo} notify={notify} />;
    case "recall-metrics": return <RecallMetricsScreen />;
    case "recall-pool": return <RecallPoolScreen goTo={goTo} notify={notify} />;
    case "recall-cadence": return <CadenceScreen goTo={goTo} notify={notify} />;
    case "recall-plugins": return <RecallPluginScreen goTo={goTo} />;
    case "recall-poster": return <PosterScreen notify={notify} />;
    case "recall-coupon": return <CouponScreen notify={notify} />;
    case "recall-review": return <ReviewScreen goTo={goTo} notify={notify} />;
    default: return <div>页面内容准备中</div>;
  }
}
