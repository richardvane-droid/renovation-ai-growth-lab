"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Screen } from "./prototype-data";

export type PrototypeDetailContext = {
  videoTitle?: string;
  account?: string;
  rank?: string;
  duration?: string;
  sourceFileName?: string;
  sourceStatus?: string;
  sourceSummary?: string;
  sourceOrigin?: string;
  conflictChoices?: string;
  parsedValues?: string;
  spokespersonName?: string;
  materialType?: string;
  conversationId?: string;
  lineDecisions?: string;
  sampleName?: string;
  outcome?: string;
  customerName?: string;
  activityName?: string;
  activityPeriod?: string;
  activityBenefit?: string;
  activitySentCount?: string;
  renovationStage?: string;
  contactStage?: string;
  priorityScore?: string;
  nextAction?: string;
  nextTime?: string;
  touchNumber?: string;
  touchTitle?: string;
  touchTime?: string;
  plannedTime?: string;
  verificationNeeded?: string;
  currentMessage?: string;
  currentAttachment?: string;
  currentReason?: string;
  currentAnswer?: string;
  currentBoundary?: string;
  currentSource?: string;
  currentStatus?: string;
  customerLockReason?: string;
  sourceLockReason?: string;
  question?: string;
  frequency?: string;
  satisfaction?: string;
  exerciseNumber?: string;
  intentScore?: string;
  issue?: string;
};

export type PrototypeDetailContentProps = {
  screen: Screen;
  goTo: (id: string) => void;
  notify: (message: string) => void;
  context?: PrototypeDetailContext;
};

type DetailPageProps = PrototypeDetailContentProps;
type Tone = "neutral" | "positive" | "warning" | "danger" | "info";
type ButtonKind = "default" | "primary" | "danger" | "ghost";

function emitDetailEvent(name: string, detail: Record<string, string>) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

const ui: Record<string, CSSProperties> = {
  stack: { display: "grid", gap: 10 },
  twoColumns: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(220px, .85fr)",
  },
  facts: {
    display: "grid",
    gap: 7,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  fact: {
    background: "#f5f5f5",
    borderRadius: 7,
    display: "grid",
    gap: 3,
    padding: 9,
  },
  factLabel: { color: "#666", fontSize: 12 },
  factValue: { fontSize: 14 },
  explanation: {
    background: "#eef6ff",
    border: "1px solid #c8dcff",
    borderRadius: 8,
    display: "grid",
    gap: 5,
    padding: 10,
  },
  warning: {
    background: "#fff3d6",
    border: "1px solid #e3c06b",
    borderRadius: 8,
    display: "grid",
    gap: 5,
    padding: 10,
  },
  positive: {
    background: "#eaf7ef",
    border: "1px solid #b9dfc8",
    borderRadius: 8,
    display: "grid",
    gap: 5,
    padding: 10,
  },
  title: { fontSize: 14, margin: 0 },
  copy: { fontSize: 13, lineHeight: 1.7, margin: 0 },
  muted: { color: "#666", fontSize: 12, lineHeight: 1.6, margin: 0 },
  rows: { display: "grid", gap: 6 },
  row: {
    alignItems: "center",
    background: "#f7f7f7",
    border: "1px solid #e1e1e1",
    borderRadius: 7,
    display: "grid",
    fontSize: 12,
    gap: 8,
    gridTemplateColumns: "28px minmax(0, 1fr) auto",
    padding: 8,
  },
  numbered: {
    alignItems: "center",
    background: "#333",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    fontSize: 11,
    fontStyle: "normal",
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  actionRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  field: { display: "grid", fontSize: 12, gap: 5 },
  input: {
    border: "1px solid #bdbdbd",
    borderRadius: 7,
    fontSize: 13,
    padding: 8,
    width: "100%",
  },
  textarea: {
    border: "1px solid #bdbdbd",
    borderRadius: 7,
    fontSize: 13,
    lineHeight: 1.7,
    minHeight: 92,
    padding: 8,
    resize: "vertical",
    width: "100%",
  },
  miniHeading: { fontSize: 14, margin: "2px 0 0" },
  media: {
    alignItems: "center",
    background: "linear-gradient(145deg, #202020, #555)",
    borderRadius: 9,
    color: "#fff",
    display: "grid",
    gap: 8,
    justifyItems: "center",
    minHeight: 220,
    padding: 16,
    textAlign: "center",
  },
  mediaPlay: {
    alignItems: "center",
    background: "rgba(255,255,255,.18)",
    border: "1px solid rgba(255,255,255,.45)",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    fontSize: 22,
    height: 54,
    justifyContent: "center",
    paddingLeft: 4,
    width: 54,
  },
};

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Button({
  children,
  onClick,
  kind = "default",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: ButtonKind;
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
  action,
  children,
  className = "",
}: {
  title?: string;
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
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

function DetailShell({
  screen,
  decision,
  decisionHint,
  checks,
  children,
  actions,
  goTo,
}: {
  screen: Screen;
  decision: string;
  decisionHint: string;
  checks: string[];
  children: ReactNode;
  actions: ReactNode;
  goTo: (id: string) => void;
}) {
  return (
    <div className="detail-layout">
      <Card className="detail-main">
        {children}
        <div style={ui.actionRow}>{actions}</div>
      </Card>
      <Card title={decision} caption={decisionHint} className="detail-side">
        <b className="detail-check-label">检查这三点</b>
        <div style={ui.rows}>
          {checks.map((item, index) => (
            <div className="audit-line" key={item}>
              <span>{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
        <Button onClick={() => goTo(screen.parent ?? "")}>← 返回上一级列表</Button>
      </Card>
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span style={ui.fact}>
      <small style={ui.factLabel}>{label}</small>
      <b style={ui.factValue}>{value}</b>
    </span>
  );
}

function MediaExample({
  title,
  meta,
  onPlay,
  portrait = true,
}: {
  title: string;
  meta: string;
  onPlay: () => void;
  portrait?: boolean;
}) {
  return (
    <div style={{ ...ui.media, minHeight: portrait ? 300 : 190 }}>
      <button aria-label={`播放${title}`} onClick={onPlay} style={ui.mediaPlay} type="button">▶</button>
      <b style={{ fontSize: 15 }}>{title}</b>
      <small style={{ color: "#eee", fontSize: 12 }}>{meta}</small>
    </div>
  );
}

function VideoLabelDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const title = context?.videoTitle ?? "33㎡钻石厨房：台面多出 1.8 米";
  const source = context?.account ?? "同行公开账号";
  const duration = context?.duration ?? "00:42";
  const subject = title.includes("厨房") ? ["厨房定制", "厨房动线和柜体细节", "本店有厨房案例即可"]
    : title.includes("衣柜") ? ["衣柜定制", "衣柜内部和封边细节", "本店有衣柜工艺可拍"]
      : title.includes("玄关") ? ["玄关收纳", "进门前后对比", "本店有完工案例可拍"]
        : title.includes("儿童") ? ["儿童房收纳", "安全与收纳细节", "需注意儿童隐私"]
          : title.includes("板材") ? ["板材工艺", "样板与检测说明", "资料准确才可拍"]
            : ["全屋定制案例", "客户问题和解决办法", "先确认本店有相近案例"];
  const [watched, setWatched] = useState(false);
  const [decision, setDecision] = useState<"match" | "no" | null>(null);
  const [reason, setReason] = useState("");
  const reasonReady = reason.trim().length >= 8;

  function save(next: "match" | "no") {
    if (!watched) {
      notify("请先播放完整示例，再保存判断");
      return;
    }
    if (!reasonReady) {
      notify("请先写至少 8 个字，说明为什么适合或不适合");
      return;
    }
    setDecision(next);
    emitDetailEvent("demo-video-label-saved", {
      decision: next,
      reason: reason.trim(),
      videoTitle: title,
    });
    notify(next === "match" ? "已保存：这条视频适合本店" : "已保存：这条视频不适合本店");
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="这条示例视频，门店会不会做、能不能照着拍？"
      decisionHint="只判断业务和拍摄条件，不要因为播放量高就选“适合”。"
      checks={[`先从头播放 ${duration}`, `确认本店确实做“${subject[0]}”相关业务`, "二选一并保存，不要空着"]}
      actions={(
        <>
          <Button disabled={!watched || !reasonReady} kind={decision === "match" ? "primary" : "default"} onClick={() => save("match")}>{!watched ? "先播放完整示例" : !reasonReady ? "先写满 8 个字的理由" : "✓ 适合本店，保存判断"}</Button>
          <Button disabled={!watched || !reasonReady} kind={decision === "no" ? "danger" : "default"} onClick={() => save("no")}>{!watched ? "播放后才能判断" : !reasonReady ? "先写满 8 个字的理由" : "× 不适合本店，保存原因"}</Button>
        </>
      )}
    >
      <div style={ui.twoColumns}>
        <div style={ui.stack}>
          <MediaExample
            title={title}
            meta={`${source} · ${duration} · 门店场景演示`}
            onPlay={() => {
              setWatched(true);
              emitDetailEvent("demo-video-watched", {
                purpose: "label",
                videoTitle: title,
              });
              notify("演示：已从头播放到结尾，现在可以做判断");
            }}
          />
          <Pill tone={watched ? "positive" : "warning"}>{watched ? "已完整播放" : "还没有完整播放"}</Pill>
        </div>
        <div style={ui.stack}>
          <div style={ui.facts}>
            <Fact label="讲的业务" value={subject[0]} />
            <Fact label="主要看什么" value={subject[1]} />
            <Fact label="本店拍摄条件" value={subject[2]} />
          </div>
          <div style={ui.explanation}>
            <b style={ui.title}>用店长的话理解</b>
            <p style={ui.copy}>这条视频的题目是“{title}”。重点判断本店有没有相近业务和自己的画面；不能照抄对方家的户型、价格、客户或文案。</p>
          </div>
          <label style={ui.field}>
            <span>我的判断理由（以后系统会照这个标准找视频）</span>
            <textarea
              onChange={(event) => setReason(event.target.value)}
              placeholder="例如：本店有相近的厨房案例，也能拍出自己的柜体细节。"
              style={ui.textarea}
              value={reason}
            />
          </label>
          <small style={ui.copy}>{reasonReady ? "理由已写清，可以选择“适合”或“不适合”。" : "至少写 8 个字。不会写时，可先用下面的示例，再按门店实际修改。"}</small>
          <div style={ui.actionRow}>
            <Button onClick={() => setReason(`本店有${subject[0]}的真实案例，也能拍出自己的做法。`)}>填入“适合”理由示例</Button>
            <Button onClick={() => setReason(`本店暂时没有${subject[0]}的真实案例，不能照着拍。`)}>填入“不适合”理由示例</Button>
          </div>
          {decision && <Pill tone={decision === "match" ? "positive" : "danger"}>当前判断：{decision === "match" ? "适合本店" : "不适合本店"}</Pill>}
        </div>
      </div>
    </DetailShell>
  );
}

function VideoSliceDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const fileName = context?.sourceFileName ?? "龙文店厨房安装实拍.mp4";
  const segments = [
    ["00:00–00:06", "安装师傅进场，展示厨房原始样子"],
    ["00:06–00:14", "转角柜五金拉出，展示拿取方式"],
    ["00:14–00:23", "柜门缝隙和 PUR 封边近景"],
    ["00:23–00:31", "完工全景，店长从门口走到台面"],
  ];
  const [kept, setKept] = useState([true, true, true, true]);

  function toggle(index: number) {
    setKept((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value));
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="系统切出的 4 段画面，哪些以后还值得拿来做视频？"
      decisionHint="画面稳、内容看得清就保留；黑屏、抖动或拍错内容就删除。"
      checks={["逐段点播放，不能只看文字", "发现说明不准就直接改", "确认保留数量后存进素材库"]}
      actions={(
        <>
          <Button kind="primary" onClick={() => notify(`已保存 ${kept.filter(Boolean).length} 段可用素材`)}>保存这 {kept.filter(Boolean).length} 段到素材库</Button>
          <Button onClick={() => notify("已退回，系统将按新规则重新拆分")}>这次拆得不好，重新拆分</Button>
        </>
      )}
    >
      <div style={ui.stack}>
        <div style={ui.positive}>
          <b style={ui.title}>原视频：{fileName}</b>
          <p style={ui.copy}>31 秒 · 手机竖拍 · 系统已切成 4 段。勾选表示“以后还能用”。</p>
        </div>
        <div style={ui.rows}>
          {segments.map(([time, description], index) => (
            <div key={time} style={{ ...ui.row, gridTemplateColumns: "28px 72px minmax(0, 1fr) auto" }}>
              <input aria-label={`保留${time}片段`} checked={kept[index]} onChange={() => toggle(index)} type="checkbox" />
              <Button onClick={() => notify(`正在播放 ${time} 片段`)}>▶ {time}</Button>
              <label style={ui.field}>
                <span>这段拍了什么</span>
                <input defaultValue={description} style={ui.input} />
              </label>
              <Pill tone={kept[index] ? "positive" : "neutral"}>{kept[index] ? "保留" : "不保留"}</Pill>
            </div>
          ))}
        </div>
        <div style={ui.warning}>
          <b style={ui.title}>别把客户隐私存进去</b>
          <p style={ui.copy}>如果画面里出现客户正脸、电话、门牌号或图纸姓名，请先点“不保留”。</p>
        </div>
      </div>
    </DetailShell>
  );
}

function VideoSpokespersonDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const name = context?.spokespersonName ?? "杜海鹏";
  const focus = context?.materialType ?? "全部照片和视频";
  const canUpdateMain = context?.sourceReady === "yes" && focus === "不同语气示范";
  const [authorized, setAuthorized] = useState(true);
  const [needsRetake, setNeedsRetake] = useState<string[]>(["四种语气口播"]);
  const [confirmed, setConfirmed] = useState(false);
  const [watched, setWatched] = useState<string[]>([]);
  const materials = [
    ["正面照片", "脸部清楚、无遮挡、光线均匀", "可使用"],
    ["正面口播", "45 秒，声音清楚，嘴型完整", "可使用"],
    ["转身展示", "18 秒，半身入镜，动作自然", "可使用"],
    ["四种语气口播", "“热情”一段收音有杂音", "建议重拍"],
  ];
  const requiredVideoChecks = ["正面口播", "转身展示", "四种语气口播"];
  const allVideosChecked = requiredVideoChecks.every((item) => watched.includes(item));
  const photoChecked = watched.includes("正面照片");
  const allMaterialsChecked = photoChecked && allVideosChecked;

  function toggleRetake(item: string) {
    setNeedsRetake((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
    setConfirmed(false);
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={`${name}的照片和视频，能不能授权给系统做店长口播？`}
      decisionHint="必须本人同意；有杂音或画面不清楚的项目先重拍，不能勉强通过。"
      checks={["先查看正面照片，再逐项播放 3 段视频", "本人确认愿意出镜", "有问题的项目勾选“要重拍”"]}
      actions={(
        <>
          <Button disabled={!authorized || needsRetake.length > 0 || !allMaterialsChecked || confirmed} kind="primary" onClick={() => { setConfirmed(true); if (canUpdateMain) emitDetailEvent("demo-spokesperson-material-confirmed", { materialType: focus, sourceReady: "yes", spokespersonName: name }); notify(canUpdateMain ? `${name}的授权和素材已确认，可用于制作口播；返回主页面会显示已完成` : `${name}的本页检查结果已保存；这不是从待检查视频进入，因此不会改变主页面上传状态`); }}>{confirmed ? "授权和素材已确认" : !photoChecked ? "先查看正面照片" : !allVideosChecked ? `先检查剩余 ${requiredVideoChecks.filter((item) => !watched.includes(item)).length} 段视频` : "确认本人授权，全部设为可用"}</Button>
          <Button disabled={needsRetake.length === 0 || confirmed} onClick={() => notify(`已创建 ${needsRetake.length} 项重拍任务`)}>安排重拍选中的 {needsRetake.length} 项</Button>
        </>
      )}
    >
      <div style={ui.stack}>
        <div className="customer-profile">
          <div className="avatar-large">{name.slice(0, 1)}</div>
          <div>
            <h3>{name}｜漳州龙文店店长</h3>
            <p>用途：制作本店短视频口播；不会用于其他门店。</p>
            <div className="chip-wrap"><Pill tone="positive">身份已核对</Pill><Pill tone={needsRetake.length === 0 ? "positive" : "warning"}>{needsRetake.length === 0 ? "没有待重拍项目" : `${needsRetake.length} 项建议重拍`}</Pill><Pill tone={allVideosChecked ? "positive" : "warning"}>已检查 {requiredVideoChecks.filter((item) => watched.includes(item)).length} / 3 段视频</Pill></div>
          </div>
        </div>
        <div style={ui.explanation}>
          <b style={ui.title}>你从“{focus}”点进来</b>
          <p style={ui.copy}>先重点检查这一项；提交整套素材前，仍要把下面所有项目看完。</p>
        </div>
        <div style={ui.rows}>
          {materials.map(([item, standard, status], index) => {
            const isVideo = requiredVideoChecks.includes(item);
            const checked = watched.includes(item);
            return (
            <div key={item} style={{ ...ui.row, gridTemplateColumns: "28px 90px minmax(0, 1fr) auto auto" }}>
              <i style={ui.numbered}>{index + 1}</i>
              <b>{item}</b>
              <span>{standard}</span>
              <Button onClick={() => { setWatched((current) => current.includes(item) ? current : [...current, item]); notify(isVideo ? `正在播放检查：${item}` : `正在查看照片：${item}`); }}>{checked ? isVideo ? "✓ 视频已检查" : "✓ 照片已查看" : isVideo ? "▶ 播放检查" : "查看照片"}</Button>
              <label style={{ alignItems: "center", display: "flex", gap: 5 }}>
                <input checked={needsRetake.includes(item)} onChange={() => toggleRetake(item)} type="checkbox" />
                {status === "建议重拍" ? "要重拍" : "标记重拍"}
              </label>
            </div>
            );
          })}
        </div>
        <label style={{ ...ui.positive, alignItems: "center", display: "flex", gridTemplateColumns: "auto 1fr" }}>
          <input checked={authorized} onChange={(event) => { setAuthorized(event.target.checked); setConfirmed(false); }} type="checkbox" />
          <span style={ui.copy}>本人已看过用途说明，同意使用这些照片和视频制作本店口播。</span>
        </label>
      </div>
    </DetailShell>
  );
}

function VideoCompetitorDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const title = context?.videoTitle ?? "118㎡原木风全屋定制完工实拍";
  const account = context?.account ?? "同行公开账号";
  const rank = context?.rank ?? "1";
  const duration = context?.duration ?? "00:36";
  const videoProfile = title.includes("板材") ? ["样板和检测报告特写", "环保等级怎么判断", "中"]
    : title.includes("价格") || title.includes("套餐") ? ["包含项逐项展示", "哪些包含、哪些另算", "中"]
      : title.includes("安装") || title.includes("缝隙") ? ["安装工艺近景", "缝隙和封边是否清楚", "高"]
        : title.includes("旧房") ? ["改造前后对比", "施工先后顺序", "中"]
          : title.includes("儿童") ? ["房间收纳细节", "安全和收纳怎么兼顾", "高"]
            : ["完工全景和柜内细节", "想看更多内部收纳", "高"];
  const [watched, setWatched] = useState(false);

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="今天要不要参考这条视频的讲法和节奏？"
      decisionHint="可以学“先讲痛点、再给方案”，不能照搬对方户型、价格、文案和客户画面。"
      checks={[`用播放按钮从头看完 ${duration}`, `确认本店有“${title}”相关真实案例`, "只借结构，不复制具体内容"]}
      actions={(
        <Button
          disabled={!watched}
          kind="primary"
          onClick={() => {
            emitDetailEvent("demo-top-video-selected", {
              account,
              decision: "selected",
              rank,
              videoTitle: title,
            });
            notify("已选为今天的参考视频，返回列表后会显示已选");
          }}
        >
          {watched ? "用这条做今天的参考" : "先播放完整视频"}
        </Button>
      )}
    >
      <div style={ui.twoColumns}>
        <div style={ui.stack}>
          <MediaExample title={title} meta={`候选第 ${rank} 名 · ${account} · ${duration} · 门店场景演示`} onPlay={() => { setWatched(true); emitDetailEvent("demo-video-watched", { videoTitle: title }); notify("演示：已从头播放到结尾；返回列表后会记为“已看完”"); }} />
          <Pill tone={watched ? "positive" : "warning"}>{watched ? "已完整播放" : "还没有完整播放"}</Pill>
        </div>
        <div style={ui.stack}>
          <div style={ui.facts}>
            <Fact label="开头主要画面" value={videoProfile[0]} />
            <Fact label="客户最关心" value={videoProfile[1]} />
            <Fact label="本店可拍程度" value={videoProfile[2]} />
          </div>
          <div style={ui.explanation}>
            <b style={ui.title}>这条为什么有人看</b>
            <p style={ui.copy}>题目直接说出客户关心的问题，画面用“{videoProfile[0]}”提供证据，最后再邀请客户了解下一步，没有先讲一大段品牌介绍。</p>
          </div>
          <div style={ui.warning}>
            <b style={ui.title}>能借鉴 / 不能照搬</b>
            <p style={ui.copy}>能借鉴：先说问题 → 展示真实证据 → 说明本店做法 → 给出下一步。</p>
            <p style={ui.copy}>不能照搬：对方客户家、户型面积、套餐价格、画面和原文字幕。</p>
          </div>
          <p style={ui.muted}>“已完整播放”只能由上方播放按钮记录，不能手动勾选。</p>
        </div>
      </div>
    </DetailShell>
  );
}

function VideoLogDetail({ screen, goTo, notify }: DetailPageProps) {
  const stages = [
    ["14:32:04", "写脚本", "用本店 568 元套餐和厨房案例生成", "完成"],
    ["14:32:31", "挑画面", "找到 6 段本店真实厨房素材", "完成"],
    ["14:33:18", "生成口播", "第一次收音断句异常，系统自动重试", "已恢复"],
    ["14:34:02", "加字幕", "门店名、价格和服务区域已核对", "完成"],
    ["14:35:10", "最终检查", "已经继续运行；完成比例请回主页面查看", "已恢复"],
  ];

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="看到一次红色失败后，店长要不要处理？"
      decisionHint="本例已经显示“自动重试成功”，所以不用重新上传。只有最新状态仍是红色才处理。"
      checks={["先看最下面一条最新记录", "“已恢复”表示系统已解决", "仍是红色再只重做出错步骤"]}
      actions={<Button kind="primary" onClick={() => { notify("已确认任务正常，将继续自动制作"); goTo(screen.parent ?? "video-progress"); }}>已恢复，不用处理，返回看进度</Button>}
    >
      <div style={ui.stack}>
        <div style={ui.positive}>
          <b style={ui.title}>任务 V-0731-014｜旧问题已经自动解决</b>
          <p style={ui.copy}>这页只显示处理记录；最新完成比例请回主页面查看。店长暂时不用补材料。</p>
        </div>
        <div style={ui.rows}>
          {stages.map(([time, stage, explanation, status], index) => (
            <div key={`${time}-${stage}`} style={{ ...ui.row, gridTemplateColumns: "62px 74px minmax(0, 1fr) auto" }}>
              <span>{time}</span>
              <b>{index + 1}. {stage}</b>
              <span>{explanation}</span>
              <Pill tone={status === "进行中" ? "warning" : "positive"}>{status}</Pill>
            </div>
          ))}
        </div>
        <div style={ui.explanation}>
          <b style={ui.title}>把“系统日志”理解成制作流水账</b>
          <p style={ui.copy}>它只是告诉你每一步做了什么。红色留在旧记录里不代表现在还失败，要以最下面的最新状态为准。</p>
        </div>
      </div>
    </DetailShell>
  );
}

function VideoResultDetail({ screen, goTo, notify }: DetailPageProps) {
  const [watched, setWatched] = useState(false);
  const checks = ["字幕没有错字", "口播声音自然", "门店名称正确", "568 元/㎡已写清适用条件", "画面没有客户隐私", "音乐可以商用"];
  const [confirmed, setConfirmed] = useState<boolean[]>(checks.map(() => false));
  const allDone = watched && confirmed.every(Boolean);

  function toggle(index: number) {
    setConfirmed((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value));
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="推荐版能不能直接下载发布？"
      decisionHint="必须本人从头播放一遍，再逐项打勾。系统检查通过也不能代替店长看成片。"
      checks={["先播放第 3 版 42 秒到结尾", "逐项核对 6 个发布风险", "全打勾后再下载"]}
      actions={(
        <>
          {allDone
            ? <a className="ui-button ui-button-primary" download="今日成片-第3版.mp4" href="./demos/finished-kitchen-video.mp4" onClick={() => notify("第 3 版已下载，并记录为“人工检查通过”")}>人工检查完成，下载第 3 版</a>
            : <Button disabled kind="primary">先看完并完成 6 项确认</Button>}
          <Button onClick={() => notify("已退回修改，请指出是字幕、声音、价格还是画面问题")}>发现问题，退回修改</Button>
        </>
      )}
    >
      <div style={ui.twoColumns}>
        <div style={ui.stack}>
          <video controls onEnded={() => { setWatched(true); notify("已记录：店长把第 3 版播放到结尾"); }} playsInline preload="metadata" style={{ borderRadius: 9, width: "100%" }}>
            <source src="./demos/finished-kitchen-video.mp4" type="video/mp4" />
            当前浏览器无法播放，可下载后查看。
          </video>
          <Pill tone={watched ? "positive" : "warning"}>{watched ? "已播放到结尾" : "还没有播放到结尾"}</Pill>
        </div>
        <div style={ui.stack}>
          <div style={ui.positive}>
            <b style={ui.title}>系统自动检查：8/8 通过</b>
            <p style={ui.copy}>还差店长人工确认。最容易出错的是门店名、价格条件和字幕同音字。</p>
          </div>
          <div style={ui.rows}>
            {checks.map((item, index) => (
              <label key={item} style={{ ...ui.row, cursor: "pointer", gridTemplateColumns: "22px 1fr auto" }}>
                <input checked={confirmed[index]} onChange={() => toggle(index)} type="checkbox" />
                <span>{item}</span>
                <Pill tone={confirmed[index] ? "positive" : "warning"}>{confirmed[index] ? "已确认" : "待确认"}</Pill>
              </label>
            ))}
          </div>
          <p style={ui.muted}>下载记录：今天 14:51 下载过第 2 版；第 3 版是当前建议发布版，修正了“投影面积”的字幕。</p>
        </div>
      </div>
    </DetailShell>
  );
}

function SalesTrainingDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const fileName = context?.sourceFileName ?? "568 元套餐与包含项.xlsx";
  const sourceStatus = context?.sourceStatus ?? "可用";
  const kind = fileName.includes("板材") ? "material"
    : fileName.includes("活动") ? "activity"
      : fileName.includes("地址") || fileName.includes("接待") ? "region"
        : fileName.includes("价格") || fileName.includes("套餐") || fileName.includes("568") ? "price"
          : "manual";
  const rowsByKind: Record<string, string[][]> = {
    price: [
      ["报价方式", "568 元 / 投影㎡", "价格表第 2 行"],
      ["包含板材", "ENF 多层板", "包含项第 1 条"],
      ["门板工艺", "双面 PET + PUR 封边", "包含项第 3 条"],
      ["标准五金", "门铰和基础拉篮，升级件另计", "包含项第 5 条"],
      ["不包含", "油工、乳胶漆、瓷砖", "不包含项第 2 条"],
    ],
    material: [
      ["环保等级", "ENF 多层板", "板材配置第 2 页"],
      ["可选品牌", "兔宝宝、莫干山", "板材配置第 3 页"],
      ["封边工艺", "PUR 封边", "工艺说明第 6 页"],
      ["检测说明", "可到店查看对应检测报告", "板材配置第 5 页"],
    ],
    activity: [
      ["活动名称", "暑期焕新季", "活动规则第 1 条"],
      ["活动时间", "2026/07/15—2026/08/15", "活动规则第 2 条"],
      ["基础套餐", "568 元 / 投影㎡", "活动规则第 4 条"],
      ["每天名额", "以门店每日接待表为准", "活动规则第 6 条"],
      ["不能承诺", "名额未核对前不能先答应客户", "活动规则第 9 条"],
    ],
    region: [
      ["漳州门店", "龙文区、芗城区及接待表所列区域", "服务区域表第 2 行"],
      ["厦门门店", "湖里区及接待表所列区域", "服务区域表第 3 行"],
      ["接待名额", "按日期读取门店每日接待表", "接待表说明第 1 条"],
      ["超出区域", "停止自动预约，交给销售确认", "服务区域表第 8 条"],
    ],
    manual: [
      ["先问什么", "户型、地址、预算和风格", "手册第 4 页"],
      ["价格怎么说", "只使用当前可用价格表", "手册第 8 页"],
      ["什么时候交给真人", "投诉、明确拒绝或复杂施工问题", "手册第 12 页"],
      ["隐私要求", "姓名、电话和详细地址不用于展示", "手册第 16 页"],
    ],
  };
  const parsedRows = rowsByKind[kind];
  const conflicts = [
    {
      id: "grade",
      label: "环保等级写法",
      latest: "板材配置说明.pdf：ENF 多层板",
      older: "销售培训手册 2026.pdf：E0 级生态板",
    },
    {
      id: "brands",
      label: "可选品牌范围",
      latest: "板材配置说明.pdf：兔宝宝、莫干山",
      older: "销售培训手册 2026.pdf：兔宝宝、莫干山、千年舟",
    },
  ];
  let savedConflictChoices: Record<string, string> = {};
  try {
    savedConflictChoices = JSON.parse(context?.conflictChoices ?? "{}") as Record<string, string>;
  } catch {
    savedConflictChoices = {};
  }
  const hasConflicts = sourceStatus.includes("冲突") || (kind === "material" && Object.keys(savedConflictChoices).length < conflicts.length);
  const [conflictChoices, setConflictChoices] = useState<Record<string, string>>(savedConflictChoices);
  let savedParsedValues: Record<string, string> = {};
  try {
    savedParsedValues = JSON.parse(context?.parsedValues ?? "{}") as Record<string, string>;
  } catch {
    savedParsedValues = {};
  }
  const [parsedValues, setParsedValues] = useState<Record<string, string>>(savedParsedValues);
  const conflictsResolved = !hasConflicts || conflicts.every((item) => Boolean(conflictChoices[item.id]));
  const kindLabel = kind === "price" ? "价格和包含项"
    : kind === "material" ? "板材配置"
      : kind === "activity" ? "活动时间和名额"
        : kind === "region" ? "服务区域和接待名额"
          : "销售接待规则";

  function resolvedValue(label: string, fallback: string) {
    if (kind !== "material") return fallback;
    if (label === "环保等级" && conflictChoices.grade === "older") return "E0 级生态板";
    if (label === "可选品牌" && conflictChoices.brands === "older") return "兔宝宝、莫干山、千年舟";
    return fallback;
  }

  const effectiveValues = Object.fromEntries(parsedRows.map(([label, value]) => [
    label,
    parsedValues[label] ?? resolvedValue(label, value),
  ]));
  const missingParsedLabels = parsedRows
    .map(([label]) => label)
    .filter((label) => !effectiveValues[label]?.trim());
  const canConfirm = conflictsResolved && missingParsedLabels.length === 0;

  function recordDecision(decision: "confirmed" | "paused") {
    emitDetailEvent("demo-training-file-decision", {
      conflictChoices: JSON.stringify(conflictChoices),
      decision,
      parsedValues: JSON.stringify(effectiveValues),
      sourceFileName: fileName,
      sourceStatus,
    });
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={`系统从“${fileName}”读出的${kindLabel}，能不能给机器人直接使用？`}
      decisionHint={hasConflicts ? "这份资料与旧文件有两处说法不一致。两处都选定以哪份为准后，才能确认可用。" : "逐条对照原文件；旧日期或说不准的内容要暂停，不能让机器人猜。"}
      checks={[`确认正在核对的文件是“${fileName}”`, `逐条核对${kindLabel}`, hasConflicts ? "处理完两处说法不一致" : "确认负责人和有效期后保存"]}
      actions={(
        <>
          <Button
            disabled={!canConfirm}
            kind="primary"
            onClick={() => {
              recordDecision("confirmed");
              notify(`${fileName}已确认，机器人可以使用这份资料`);
            }}
          >
            {!conflictsResolved ? `先处理剩余 ${conflicts.length - Object.keys(conflictChoices).length} 处冲突` : missingParsedLabels.length > 0 ? `先补全 ${missingParsedLabels.join("、")}` : "核对完成，允许机器人使用"}
          </Button>
          <Button
            kind="danger"
            onClick={() => {
              recordDecision("paused");
              notify(`${fileName}已暂停使用，机器人不会再使用其中内容`);
            }}
          >
            内容有误，先停用本文件
          </Button>
        </>
      )}
    >
      <div style={ui.stack}>
        <div style={hasConflicts ? ui.warning : ui.positive}>
          <b style={ui.title}>正在核对：{fileName}</b>
          <p style={ui.copy}>上传人：杜老板 · 更新时间：2026/07/28 · 当前状态：{hasConflicts ? "有 2 处说法不一致" : sourceStatus}。</p>
        </div>
        <div className="parsed-detail">
          {parsedRows.map(([label, value, source]) => (
            <div key={label} style={{ gridTemplateColumns: "78px minmax(0, 1fr) 130px auto" }}>
              <b>{label}</b>
              <input
                onChange={(event) => setParsedValues((current) => ({ ...current, [label]: event.target.value }))}
                style={ui.input}
                value={parsedValues[label] ?? resolvedValue(label, value)}
              />
              <span>{source}</span>
              <Pill tone={effectiveValues[label]?.trim() ? "positive" : "danger"}>{effectiveValues[label]?.trim() ? "有出处" : "不能为空"}</Pill>
            </div>
          ))}
        </div>
        {hasConflicts && (
          <div style={ui.stack}>
            <h3 style={ui.miniHeading}>两处说法不一致：逐项选择本店现在以哪份为准</h3>
            {conflicts.map((conflict, index) => (
              <fieldset key={conflict.id} style={ui.warning}>
                <legend><b>冲突 {index + 1}：{conflict.label}</b></legend>
                <label style={{ alignItems: "center", display: "flex", gap: 7 }}>
                  <input
                    checked={conflictChoices[conflict.id] === "latest"}
                    name={`conflict-${conflict.id}`}
                    onChange={() => setConflictChoices((current) => ({ ...current, [conflict.id]: "latest" }))}
                    type="radio"
                  />
                  <span>{conflict.latest}（较新，建议）</span>
                </label>
                <label style={{ alignItems: "center", display: "flex", gap: 7 }}>
                  <input
                    checked={conflictChoices[conflict.id] === "older"}
                    name={`conflict-${conflict.id}`}
                    onChange={() => setConflictChoices((current) => ({ ...current, [conflict.id]: "older" }))}
                    type="radio"
                  />
                  <span>{conflict.older}</span>
                </label>
                <Pill tone={conflictChoices[conflict.id] ? "positive" : "warning"}>{conflictChoices[conflict.id] ? "已选定本店说法" : "还没选择"}</Pill>
              </fieldset>
            ))}
          </div>
        )}
      </div>
    </DetailShell>
  );
}

type ChampionLineDecision = "borrowable" | "not-borrowable";
type ChampionRound = [speaker: "客户" | "销售顾问", copy: string, why: string];

function parseChampionLineDecisions(value?: string) {
  if (!value) return {} as Record<string, ChampionLineDecision>;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, ChampionLineDecision] =>
        entry[1] === "borrowable" || entry[1] === "not-borrowable"
      ),
    );
  } catch {
    return {} as Record<string, ChampionLineDecision>;
  }
}

function SalesChampionDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const name = context?.customerName ?? "林女士｜118㎡原木风";
  const sampleName = context?.sampleName ?? "示例 1";
  const conversationId = context?.conversationId ?? sampleName;
  const outcome = context?.outcome ?? "到店";
  const resultType = outcome.includes("未成交") ? "failed"
    : outcome.includes("继续") || outcome.includes("留下") ? "continuing"
      : "successful";
  const roundsByResult: Record<string, ChampionRound[]> = {
    successful: [
      ["客户", "我家 118㎡，想做原木风，预算 15 万。", "客户给出户型、风格、预算"],
      ["销售顾问", "您更在意环保、收纳，还是总预算不超？", "先问最在意什么，不急着报价"],
      ["客户", "家里有小孩，环保第一，预算也别超太多。", "客户明确环保优先"],
      ["销售顾问", "我先按 ENF 板材做基础和升级两档，带样板给您对比。周六下午方便到店吗？", "给两档方案，并用实物证明"],
      ["客户", outcome.includes("量房") ? "我到店不方便，可以先上门量房。" : "周六下午可以过去。", `实际结果：${outcome}`],
    ],
    continuing: [
      ["客户", "新房还没交付，我只是先了解一下，现在不准备到店。", "客户明确暂时不推进"],
      ["销售顾问", "明白，我先不催您。可以发一份交房前准备清单，等您拿房后再联系吗？", "尊重客户节奏，先提供有用资料"],
      ["客户", "可以，先发清单，交房后我再找你。", "客户同意继续保留联系"],
      ["销售顾问", "好的，我只发这一份；没有新进展前不会频繁打扰。", "说清联系频率和边界"],
    ],
    failed: [
      ["客户", "别家还能更便宜，你们能不能保证 500 元一平方？", "客户把最低价作为唯一条件"],
      ["销售顾问", "目前门店价格表没有 500 元这一档，我不能先答应。可以把现有套餐包含项和升级项给您列清楚。", "不为成交编造价格"],
      ["客户", "那不用了，我先选别家。", "客户明确没有成交"],
      ["销售顾问", "明白，我这边停止后续自动消息。以后需要核对配置时，您再联系即可。", "尊重拒绝并停止自动联系"],
    ],
  };
  const rounds = roundsByResult[resultType];
  const salesLineKeys = rounds.flatMap(([speaker], index) =>
    speaker === "销售顾问" ? [`line-${index + 1}`] : []
  );
  const [lineDecisions, setLineDecisions] = useState<Record<string, ChampionLineDecision>>(() => {
    const saved = parseChampionLineDecisions(context?.lineDecisions);
    return Object.fromEntries(
      salesLineKeys.map((lineKey) => [lineKey, saved[lineKey] ?? "borrowable"]),
    );
  });
  const borrowableCount = salesLineKeys.filter((lineKey) => lineDecisions[lineKey] !== "not-borrowable").length;
  const notBorrowableCount = salesLineKeys.length - borrowableCount;

  function changeLineDecision(lineKey: string, decision: ChampionLineDecision) {
    setLineDecisions((current) => ({ ...current, [lineKey]: decision }));
    emitDetailEvent("demo-champion-line-decision", {
      conversationId,
      decision,
      lineKey,
      sampleName,
    });
  }

  function recordSample(decision: "included" | "excluded") {
    emitDetailEvent("demo-champion-sample-decision", {
      borrowableCount: String(borrowableCount),
      customerName: name,
      conversationId,
      decision,
      lineDecisions: JSON.stringify(lineDecisions),
      notBorrowableCount: String(notBorrowableCount),
      outcome,
      sampleName,
    });
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="哪些销售回复值得保留？"
      decisionHint="销售回复默认可借鉴。只需把不准确、不合适或不得体的句子改为“不建议借鉴”。"
      checks={["先确认客户情况和实际结果", "逐句检查销售有没有乱承诺", `保存前确认结果是“${outcome}”`]}
      actions={(
        <>
          <Button
            disabled={borrowableCount === 0}
            kind="primary"
            onClick={() => {
              recordSample("included");
              notify(`已保存：${borrowableCount} 句可借鉴，${notBorrowableCount} 句不建议`);
            }}
          >
            {borrowableCount === 0
              ? "没有可借鉴的销售回复"
              : notBorrowableCount === 0
                ? `确认这 ${borrowableCount} 句都可借鉴`
                : `保存：${borrowableCount} 句可借鉴，${notBorrowableCount} 句不建议`}
          </Button>
          <Button onClick={() => { recordSample("excluded"); notify("整段聊天已排除，不参与学习"); }}>整段都不参与学习</Button>
        </>
      )}
    >
      <div style={ui.stack}>
        <div style={ui.explanation}>
          <b style={ui.title}>{sampleName}｜客户：{name}</b>
          <p style={ui.copy}>实际结果：{outcome} · 已隐去手机号和详细住址。</p>
        </div>
        <div className="champion-review-summary" aria-live="polite">
          <div>
            <b>默认可借鉴，只改少数不妥的句子</b>
            <span>客户原话只作背景，不会作为销售话术。</span>
          </div>
          <strong>{borrowableCount} 句可借鉴 · {notBorrowableCount} 句不建议</strong>
        </div>
        <div style={ui.rows}>
          {rounds.map(([speaker, copy, why], index) => {
            const lineKey = `line-${index + 1}`;
            const isSalesLine = speaker === "销售顾问";
            const lineDecision = lineDecisions[lineKey] ?? "borrowable";
            return (
              <div
                className={`chat ${isSalesLine ? "robot champion-sales-line" : "customer"} ${lineDecision === "not-borrowable" ? "not-borrowable" : ""}`}
                key={`${speaker}-${index}`}
              >
                <div className="champion-chat-head">
                  <b>{speaker} · 第 {index + 1} 句</b>
                  {!isSalesLine && <span>只作背景</span>}
                </div>
                <p>{copy}</p>
                <small style={ui.muted}>系统理解：{why}</small>
                {isSalesLine && (
                  <>
                    <div className="line-review" role="group" aria-label={`第 ${index + 1} 句是否可借鉴`}>
                      <button
                        aria-pressed={lineDecision === "borrowable"}
                        className={lineDecision === "borrowable" ? "active" : ""}
                        onClick={() => changeLineDecision(lineKey, "borrowable")}
                        type="button"
                      >
                        ✓ 可借鉴
                      </button>
                      <button
                        aria-pressed={lineDecision === "not-borrowable"}
                        className={lineDecision === "not-borrowable" ? "active exclude" : ""}
                        onClick={() => changeLineDecision(lineKey, "not-borrowable")}
                        type="button"
                      >
                        不建议借鉴
                      </button>
                    </div>
                    <small className="line-review-status">
                      {lineDecision === "borrowable" ? "这句话会作为学习示例" : "这句话不会教给机器人"}
                    </small>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DetailShell>
  );
}

function SalesSimulationDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const exerciseNumber = context?.exerciseNumber ?? "69";
  const [answer, setAnswer] = useState("568 元/㎡是基础套餐价，包含 ENF 多层板、双面 PET 门板、PUR 封边和标准五金。您把户型图发我，我会把基础项和升级项分开估算，最终以设计方案和门店核价为准。");
  const [score, setScore] = useState<"pass" | "revise" | null>(null);
  const answerReady = answer.trim().length >= 12;

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision="机器人这次回答，能不能直接用于真实客户？"
      decisionHint="要说清包含什么、哪些另算、最终价格怎么确认；不能只回一个 568 元数字。"
      checks={["先看客户到底问什么", "检查有没有乱承诺总价", "通过或改写后二选一保存"]}
      actions={(
        <>
          <Button disabled={!answerReady} kind={score === "revise" ? "primary" : "default"} onClick={() => { setScore("revise"); notify("改写后的回答已保存为正确示例"); }}>{answerReady ? score === "revise" ? "改写后的正确回答已保存" : "原回答不合格，保存我改写的答案" : "先写至少 12 个字的正确回答"}</Button>
        </>
      )}
    >
      <div style={ui.stack}>
        <div className="chat customer">
          <b>第 {exerciseNumber} 题｜模拟客户周女士</b>
          <p>你们说 568 元一平方，我家 100 平是不是 5 万多就全部做好？</p>
        </div>
        <div className="chat robot">
          <b>机器人原回答</b>
          <p>差不多，具体可以到店了解。</p>
        </div>
        <div style={ui.warning}>
          <b style={ui.title}>为什么原回答不合格</b>
          <p style={ui.copy}>把“投影面积”误当成“房屋面积”，还说“差不多”，客户会误以为 5 万多能全部做好。</p>
        </div>
        <label style={ui.field}>
          <span><b>店长改写后的正确回答</b></span>
          <textarea onChange={(event) => { setAnswer(event.target.value); setScore(null); }} style={{ ...ui.textarea, minHeight: 122 }} value={answer} />
        </label>
        {!answerReady && <p style={ui.muted}>不能保存空白答案。至少写 12 个字，并说明报价依据或下一步怎么核价。</p>}
        <div style={ui.facts}>
          <Fact label="价格准确" value={score === "revise" ? "改写后通过" : answerReady ? "等待保存确认" : "答案不足，未通过"} />
          <Fact label="没有乱承诺" value={score === "revise" ? "改写后通过" : answerReady ? "等待保存确认" : "无法判断"} />
          <Fact label="下一步明确" value={score === "revise" ? "请客户发户型图" : answerReady ? "等待保存确认" : "还没有写清"} />
        </div>
      </div>
    </DetailShell>
  );
}

function SalesConversationDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const name = context?.customerName ?? "林女士";
  const intentScore = context?.intentScore ?? "92";
  const issue = context?.issue ?? "预算明确 · 周末有空";
  const highRisk = name.includes("黄") || issue.includes("压价");
  const [decisionStatus, setDecisionStatus] = useState(context?.currentStatus || "");
  const handedOff = decisionStatus.startsWith("已交给");
  const conversation = highRisk ? [
    ["客户", "别家说还能便宜，你们最低能不能做到 500 元一平方？"],
    ["机器人", "可以，我帮您申请 500 元一平方，今天定就能保留。"],
    ["客户", "那你先把这个价格写下来。"],
    ["机器人", "好的，已经按 500 元一平方给您登记。"],
  ] : [
    ["客户", `我是${name}，我家 118㎡，预算 15 万，周末能去看看。`],
    ["机器人", "可以。您更偏原木风还是奶油风？家里有没有老人或孩子？"],
    ["客户", "原木风，有一个 5 岁小孩，比较在意环保。"],
    ["机器人", "了解。我会准备 ENF 板材样板和同面积案例。周六 15:00 还有接待时间，要先为您登记吗？"],
    ["客户", "可以，先登记。我想知道最后会不会超过预算。"],
    ["机器人", "总价要看柜体投影面积和升级项，我先让设计顾问按户型做三档估算，稍后由人工联系您。"],
  ];

  useEffect(() => {
    function receiveStatus(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail.customerName !== name) return;
      setDecisionStatus(detail.status === "等待店长决定" ? "" : detail.status || "");
    }
    window.addEventListener("demo-sales-conversation-status-response", receiveStatus);
    const requestTimer = window.setTimeout(() => {
      emitDetailEvent("demo-sales-conversation-status-request", { customerName: name });
    }, 0);
    return () => {
      window.clearTimeout(requestTimer);
      window.removeEventListener("demo-sales-conversation-status-response", receiveStatus);
    };
  }, [name]);

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={highRisk ? "机器人擅自答应了门店没有确认的低价，怎么处理？" : "机器人接待得对不对？现在是否需要销售人工接手？"}
      decisionHint={highRisk ? "这段回答不合格，必须停止自动回复并交给销售人工核价，不能点成合格。" : "本例已经问清需求并约到店，但客户追问总预算，应该由人工核价后接手。"}
      checks={["确认需求信息有没有问全", "确认机器人有没有保证未经核对的价格", highRisk ? "标记错误并立即交给真人" : "高意向且要核价就交给真人"]}
      actions={(
        <>
          <Button disabled={highRisk || handedOff} onClick={() => { setDecisionStatus("店长已检查，回答合格"); emitDetailEvent("demo-sales-conversation-decision", { action: "checked", customerName: name }); notify("已记录：机器人接待合格；返回列表会显示店长已检查"); }}>{handedOff ? "已交给真人，不再判自动回复" : highRisk ? "存在错误，不能判为合格" : decisionStatus || "机器人接待合格，保存检查结果"}</Button>
          <Button disabled={handedOff} kind="primary" onClick={() => { const due = "30 分钟内"; setDecisionStatus(`已交给王顾问 · ${due}`); emitDetailEvent("demo-sales-conversation-decision", { action: "assigned", customerName: name, due }); notify(`已给王顾问创建任务：${due}联系${name}核对预算；返回列表会显示负责人和截止时间`); }}>{handedOff ? decisionStatus : "立即安排销售接手核价"}</Button>
        </>
      )}
    >
      <div style={ui.stack}>
        <div style={ui.positive}>
          <b style={ui.title}>{name}｜到店意向 {intentScore} / 100｜{issue}</b>
          <p style={ui.copy}>{highRisk ? "系统建议：立即停止这段自动回复，让销售按最新价格表人工核价并向客户更正。" : "系统建议：机器人完成基础接待；预算核算需要人工在 30 分钟内接手。"}</p>
        </div>
        <div className="detail-conversation">
          {conversation.map(([speaker, copy], index) => (
            <div className={`chat ${speaker === "客户" ? "customer" : "robot"}`} key={`${speaker}-${index}`}>
              <b>{speaker} 14:{42 + index}</b>
              <p>{copy}</p>
            </div>
          ))}
        </div>
        <div className="knowledge-cite">
          <b>{highRisk ? "这次错误在哪里" : "本次机器人用到的门店资料"}</b>
          <p>{highRisk ? "门店价格表里没有 500 元/投影㎡，机器人却直接承诺并登记，属于未经确认的价格承诺。" : "ENF 板材说明 · 周六接待表 · 漳州龙文店案例。总价尚未核算，所以没有直接承诺。"}</p>
        </div>
      </div>
    </DetailShell>
  );
}

function SalesFaqDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const question = context?.question ?? "全屋定制怎么报价？";
  const frequency = context?.frequency ?? "82";
  const satisfaction = context?.satisfaction ?? "76%";
  const answerByQuestion: Record<string, string> = {
    "全屋定制怎么报价？": "我们按柜体投影面积、板材和五金配置报价，不是按房屋面积报价。您发户型图后，我可以先做基础、常用、升级三档估算，最终以设计方案和门店核价为准。",
    "568 元/㎡包含哪些内容？": "568 元/投影㎡是活动基础套餐价，包含 ENF 多层板、双面 PET 门板、PUR 封边和标准五金；拉篮、灯带等升级项另计。最终以门店核价为准。",
    "用什么板材？环保吗？": "基础套餐使用门店当前产品手册列明的 ENF 多层板。不同品牌和检测报告可以到店对比；如客户有指定品牌，请由销售人工确认。",
    "多久可以安装完成？": "工期要看柜体数量、复尺确认、材料和现场条件。资料齐全后由设计师给出本单排期，机器人不直接保证固定天数。",
    "可以免费量房吗？": "服务地区和当天预约名额符合时，可以申请免费上门量房和初步平面方案。请先提供小区或大致地址，我帮您查询可约时间。",
    "漳州哪些区域可以上门？": "当前可服务龙文区、芗城区及门店接待表列出的指定区域。请发小区名称，我会先核对；超出范围时交给销售确认。",
    "活动还有名额吗？": "活动名额会以门店每日接待表为准。请告诉我想来的日期和时间段，我查到剩余名额后再确认，不会先替您保证。",
  };
  const [answer, setAnswer] = useState(context?.currentAnswer || answerByQuestion[question] || answerByQuestion["全屋定制怎么报价？"]);
  const [source, setSource] = useState(context?.currentSource || "门店价格表 2026.07 · 暑期焕新季活动说明 · 套餐包含项.xlsx");
  const [boundary, setBoundary] = useState(context?.currentBoundary || (question.includes("安装") ? "不能承诺固定完工天数；现场条件、复尺和材料未确认时必须交给人工。" : "仅适用于漳州、厦门指定区域；活动截止 2026/08/31；不能承诺整屋总价。"));
  const [tested, setTested] = useState(false);
  const canTest = answer.trim().length >= 20 && source.trim().length >= 5 && boundary.trim().length >= 10;

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={`“${question}”这条标准回答，现在能不能发布？`}
      decisionHint="答案要有门店资料依据，说清不能保证的部分；需要查日期、名额或排期时，不能让机器人猜。"
      checks={["读一遍标准回答是否像人话", "核对价格来源和截止日期", "确认适用边界后再发布"]}
      actions={(
        <>
          <Button disabled={!canTest} onClick={() => { setTested(true); notify("3 种客户问法试答完成：回答一致，没有超出门店资料"); }}>{canTest ? "先用 3 种问法试答" : "先补全答案、资料来源和使用边界"}</Button>
          <Button
            disabled={!tested}
            kind="primary"
            onClick={() => {
              emitDetailEvent("demo-faq-published", {
                answer,
                boundary,
                question,
                source,
                status: "published",
              });
              notify(`“${question}”的新回答已发布；返回列表后会显示已优化`);
            }}
          >
            {tested ? "试答通过，发布标准回答" : "先完成 3 种问法试答"}
          </Button>
          <Button
            disabled={!canTest}
            onClick={() => {
              emitDetailEvent("demo-faq-published", {
                answer,
                boundary,
                question,
                source,
                status: "draft",
              });
              notify("已保存为草稿，机器人仍使用上一版");
            }}
          >
            {canTest ? "先存草稿，暂不让机器人使用" : "补全后才能保存草稿"}
          </Button>
        </>
      )}
    >
      <div className="faq-editor">
        <h3>客户常问：{question}</h3>
        <p>近 7 天问了 {frequency} 次 · 旧回答满意度 {satisfaction} · 以下内容为门店场景演示</p>
        <label>
          <span>给客户看的标准回答</span>
          <textarea onChange={(event) => { setAnswer(event.target.value); setTested(false); }} value={answer} />
        </label>
        <label>
          <span>答案根据什么写的</span>
          <input onChange={(event) => { setSource(event.target.value); setTested(false); }} value={source} />
        </label>
        <label>
          <span>哪些情况不能直接用这段话</span>
          <textarea onChange={(event) => { setBoundary(event.target.value); setTested(false); }} value={boundary} />
        </label>
        <div style={tested ? ui.positive : ui.warning}>
          <b style={ui.title}>{tested ? "3 种问法试答通过" : "还有一步：用 3 种问法试答"}</b>
          <p style={ui.copy}>{tested ? "价格有出处、活动未过期、没有承诺整屋总价、超出服务区会交给真人。" : "测试客户换一种说法时，机器人是否仍能回答正确；通过后才允许发布。"}</p>
        </div>
      </div>
    </DetailShell>
  );
}

function RecallActivityDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const activityName = context?.activityName ?? "暑期焕新季";
  const initialActivityPeriod = context?.activityPeriod ?? "2026.07.15–08.15";
  const initialActivityBenefit = context?.activityBenefit ?? "568 元/投影㎡ · 20 个到店名额";
  const [activityPeriod, setActivityPeriod] = useState(initialActivityPeriod);
  const [activityBenefit, setActivityBenefit] = useState(initialActivityBenefit);
  const [inventory, setInventory] = useState(context?.currentInventory || "18");
  const [activityStatus, setActivityStatus] = useState(context?.currentStatus || "待核对");
  const activityStopped = activityStatus === "已停用";
  const inventoryValid = /^\d+$/.test(inventory.trim()) && Number(inventory) > 0;
  const periodState = (() => {
    const value = activityPeriod.trim();
    const compactValue = value.replace(/\s+/g, "");
    if (compactValue === "长期" || compactValue === "长期有效") return "active" as const;
    if (compactValue.includes("长期")) return "invalid" as const;
    const fullDates = [...value.matchAll(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/g)];
    if (fullDates.length === 0) return "invalid" as const;
    const first = fullDates[0];
    const last = fullDates[fullDates.length - 1];
    const startYear = Number(first[1]);
    const startMonth = Number(first[2]);
    const startDay = Number(first[3]);
    let endYear = Number(last[1]);
    let endMonth = Number(last[2]);
    let endDay = Number(last[3]);
    if (fullDates.length === 1) {
      const tail = value.slice((first.index ?? 0) + first[0].length);
      const shortEnd = tail.match(/(?:–|—|至|~|-)\s*(\d{1,2})[./-](\d{1,2})/);
      if (shortEnd) {
        endMonth = Number(shortEnd[1]);
        endDay = Number(shortEnd[2]);
        endYear = endMonth < startMonth ? startYear + 1 : startYear;
      }
    }
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
    if (start.getFullYear() !== startYear || start.getMonth() !== startMonth - 1 || start.getDate() !== startDay) return "invalid" as const;
    if (end.getFullYear() !== endYear || end.getMonth() !== endMonth - 1 || end.getDate() !== endDay || end < start) return "invalid" as const;
    const today = new Date(2026, 6, 31);
    if (end < today) return "expired" as const;
    if (start > today) return "future" as const;
    return "active" as const;
  })();
  const periodCanBeConfirmed = periodState === "active" || periodState === "future";
  const activityComplete = periodCanBeConfirmed && activityBenefit.trim().length >= 8 && inventoryValid;
  const sentCount = periodState === "future" ? 0 : Math.max(0, Number(context?.activitySentCount ?? "126") || 0);
  const replyCount = sentCount === 0 ? 0 : Math.round(sentCount * 0.25);
  const appointmentCount = sentCount === 0 ? 0 : Math.round(sentCount * 0.1);
  const confirmLabel = periodState === "expired"
    ? "活动已经过期，不能继续使用"
    : periodState === "invalid"
      ? "活动日期格式不清"
    : !inventoryValid
      ? "剩余名额必须是大于 0 的整数"
      : activityBenefit.trim().length < 8
        ? "先写清客户实际可得权益"
        : periodState === "future"
          ? "保存核对结果，等开始日自动启用"
        : activityStopped
          ? "保存更新，重新核对并恢复使用"
          : "确认活动有效，继续用于客户跟进";

  function recordActivity(action: "confirmed" | "scheduled" | "stopped") {
    emitDetailEvent("demo-activity-decision", {
      action,
      activityBenefit,
      activityName,
      activityPeriod,
      inventory,
    });
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={`“${activityName}”现在是否还有效，可以继续发给客户吗？`}
      decisionHint={periodState === "future" ? "活动还没开始。现在可以核对资料，但只能等开始日再自动启用，不能提前发给客户。" : "日期、剩余名额、权益和海报四项都真实才继续；任意一项不准就先停用。"}
      checks={["核对开始和截止日期", "把剩余名额改成真实数字", "确认海报上的权益没有夸大"]}
      actions={(
        <>
          <Button disabled={!activityComplete} kind="primary" onClick={() => { const scheduled = periodState === "future"; setActivityStatus(scheduled ? "待开始" : "可使用"); recordActivity(scheduled ? "scheduled" : "confirmed"); notify(scheduled ? `${activityName}资料已核对，剩余 ${inventory} 个计划名额；到开始日才会自动启用，不会提前发送` : `${activityName}已${activityStopped ? "重新核对并恢复使用" : "确认有效"}，剩余 ${inventory} 个名额；日期和权益也已写回列表`); }}>{confirmLabel}</Button>
          <Button disabled={activityStopped} kind="danger" onClick={() => { setActivityStatus("已停用"); recordActivity("stopped"); notify(`${activityName}已立即停用，不会再生成新消息；返回列表会显示已停用`); }}>{activityStopped ? "活动已停用" : "信息不准，立即停用活动"}</Button>
        </>
      )}
    >
      <div style={ui.stack}>
        {activityStopped && <div style={ui.warning}><b style={ui.title}>这个活动已经停用</b><p style={ui.copy}>不会再用它生成新的客户消息。改好日期、权益和剩余名额后重新核对；已开始就恢复使用，尚未开始就等到开始日。</p></div>}
        {activityStatus === "待开始" && <div style={ui.explanation}><b style={ui.title}>资料已核对，正在等待开始日期</b><p style={ui.copy}>开始日前不会生成客户消息；到日期后仍会再次检查剩余名额。</p></div>}
        <div style={ui.twoColumns}>
          <div style={{ ...ui.media, background: "linear-gradient(145deg,#7b4b1e,#d09a48)", minHeight: 240 }}>
            <small>有大有小 · 漳州龙文店</small>
            <b style={{ fontSize: 24 }}>{activityName}</b>
            <span>{activityBenefit}</span>
            <strong>{activityPeriod}</strong>
            <small>到店前需预约 · 具体权益以门店确认结果为准</small>
          </div>
          <div style={ui.stack}>
            <label style={ui.field}><span>活动时间</span><input onChange={(event) => setActivityPeriod(event.target.value)} style={ui.input} value={activityPeriod} /></label>
            <label style={ui.field}><span>当前剩余名额（演示）</span><input min="0" onChange={(event) => setInventory(event.target.value)} style={ui.input} type="number" value={inventory} /></label>
            <label style={ui.field}><span>客户实际可得权益</span><textarea onChange={(event) => setActivityBenefit(event.target.value)} style={ui.textarea} value={activityBenefit} /></label>
            {periodState === "future" && <p style={ui.muted}>这个活动尚未开始。现在只能保存核对结果，到开始日后才允许用于客户消息。</p>}
            {(periodState === "expired" || periodState === "invalid") && <p style={ui.muted}>日期要写清开始日和截止日，而且截止日不能早于今天；已经过期的活动不能恢复。</p>}
            <p style={ui.muted}>本演示统一按 2026 年 7 月 31 日判断“今天”、未开始和已过期，与全站示例数据一致。</p>
            {!inventoryValid && <p style={ui.muted}>剩余 0 个名额等于暂时不可用，不能显示为“可使用”。请补充真实的正整数名额，或保持停用。</p>}
          </div>
        </div>
        <div style={ui.facts}>
          <Fact label="已发送" value={`${sentCount} 人`} />
          <Fact label="已回复" value={`${replyCount} 人`} />
          <Fact label="已预约" value={`${appointmentCount} 人`} />
        </div>
        <p style={ui.muted}>{sentCount === 0 ? periodState === "future" ? "活动尚未开始，没有发送记录。" : "目前还没有发送记录。" : "最近发送：今天 10:00；"}剩余名额会在每次发送前重新检查，不会只看这里的旧数字。</p>
      </div>
    </DetailShell>
  );
}

function RecallCustomerDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const name = context?.customerName ?? "林女士";
  const stage = context?.renovationStage ?? "设计方案比较中";
  const contactStage = context?.contactStage ?? "已报价未到店";
  const priorityScore = context?.priorityScore ?? "82";
  const nextAction = context?.nextAction ?? "1 天后发同小区收纳案例";
  const nextTime = context?.nextTime ?? "明天 10:00";
  const initiallyStopped = nextTime === "已停止" || contactStage.includes("拒绝");
  const [stopped, setStopped] = useState(initiallyStopped);
  const [selected, setSelected] = useState(2);
  const [touchUpdates, setTouchUpdates] = useState<Record<string, {
    attachment?: string;
    interval?: string;
    message?: string;
    sendReason?: string;
    status?: string;
    title?: string;
  }>>({});
  const [sourceLocks, setSourceLocks] = useState<Record<string, string>>({});
  const examples: Record<string, {
    budget: string;
    caseTitle: string;
    knowledgeTitle: string;
    requirement: string;
  }> = {
    "林女士": { budget: "预算约 15 万", caseTitle: "同小区 118㎡原木风收纳案例", knowledgeTitle: "15 万预算如何分配更合理", requirement: "118㎡，偏原木风" },
    "陈先生": { budget: "预算还没确认", caseTitle: "新房 98㎡动线布局案例", knowledgeTitle: "拿房后先确认的 7 件事", requirement: "已发户型图，风格待确认" },
    "周女士": { budget: "正在比较总价", caseTitle: "105㎡控制预算的柜体案例", knowledgeTitle: "基础项和升级项怎么区分", requirement: "关注价格，尚未到店" },
    "吴先生": { budget: "预算暂缓", caseTitle: "130㎡环保板材与施工案例", knowledgeTitle: "暂缓装修时可以先准备什么", requirement: "已量房，装修计划暂缓" },
    "张女士": { budget: "预算待细化", caseTitle: "89㎡奶油风落地案例", knowledgeTitle: "奶油风选材避坑清单", requirement: "看过案例，偏好还没确认" },
    "黄先生": { budget: "预算还没说明", caseTitle: "102㎡新房收纳布局案例", knowledgeTitle: "第一次做全屋定制先看什么", requirement: "刚加企微，尚未说清需求" },
    "王女士": { budget: "多次比较价格", caseTitle: "120㎡分阶段控制预算案例", knowledgeTitle: "预算拆分与可选项说明", requirement: "关注价格，暂不推活动" },
    "李先生": { budget: "已停止沟通", caseTitle: "原计划案例（仅保留记录）", knowledgeTitle: "原计划知识内容（仅保留记录）", requirement: "已明确选择其他品牌" },
  };
  const example = examples[name] ?? {
    budget: "预算待确认",
    caseTitle: `适合“${stage}”客户的门店案例`,
    knowledgeTitle: "当前阶段需要先确认的事项",
    requirement: `${stage}，${contactStage}`,
  };

  useEffect(() => {
    function receiveStatus(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail.customerName !== name) return;
      setStopped(detail.status === "stopped");
    }
    function receiveMessage(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail.customerName !== name || !detail.touchNumber) return;
      setTouchUpdates((current) => ({
        ...current,
        [detail.touchNumber]: {
          attachment: detail.attachment,
          interval: detail.touchTime,
          message: detail.message,
          sendReason: detail.sendReason,
          status: "已安排",
          title: detail.touchTitle,
        },
      }));
    }
    const sourceTitles = [
      example.knowledgeTitle,
      example.caseTitle,
      example.budget === "预算还没确认" ? "如何先确定适合自己的装修预算" : `${example.budget}的项目拆分说明`,
      "免费上门量房体验券",
      "ENF 板材检测与工艺细节",
      "暑期焕新季 · 周末 2 个名额",
      "礼貌询问是否还需要帮助",
    ];
    function receiveSourceStatus(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      const touchIndex = sourceTitles.findIndex((title) => title === detail.touchTitle);
      if (touchIndex < 0) return;
      setSourceLocks((current) => ({
        ...current,
        [String(touchIndex + 1)]: detail.reason || "",
      }));
    }
    function requestSourceStatuses() {
      sourceTitles.forEach((touchTitle) => {
        emitDetailEvent("demo-cadence-source-status-request", { touchTitle });
      });
    }
    window.addEventListener("demo-customer-followup-status-response", receiveStatus);
    window.addEventListener("demo-cadence-message-status-response", receiveMessage);
    window.addEventListener("demo-cadence-source-status-response", receiveSourceStatus);
    window.addEventListener("demo-workflow-status-changed", requestSourceStatuses);
    const requestTimer = window.setTimeout(() => {
      emitDetailEvent("demo-customer-followup-status-request", { customerName: name });
      for (let touchNumber = 1; touchNumber <= 7; touchNumber += 1) {
        emitDetailEvent("demo-cadence-message-status-request", {
          customerName: name,
          touchNumber: String(touchNumber),
        });
      }
      requestSourceStatuses();
    }, 0);
    return () => {
      window.clearTimeout(requestTimer);
      window.removeEventListener("demo-customer-followup-status-response", receiveStatus);
      window.removeEventListener("demo-cadence-message-status-response", receiveMessage);
      window.removeEventListener("demo-cadence-source-status-response", receiveSourceStatus);
      window.removeEventListener("demo-workflow-status-changed", requestSourceStatuses);
    };
  }, [example.budget, example.caseTitle, example.knowledgeTitle, name]);

  const history = [
    ["7/21", "加企微并开始了解装修需求", example.requirement],
    ["7/22", `机器人记录客户情况：${example.budget}`, "客户资料已更新"],
    ["7/24", `发送：${example.caseTitle}`, "客户已阅读"],
    ["7/27", `人工沟通，当前结果：${contactStage}`, stage],
    ["7/29", "客户暂未继续回复，进入自动跟进", "按客户情况等待"],
    ["7/31", stopped ? "客户明确拒绝，自动消息已停止" : nextAction, stopped ? "已停止" : `计划：${nextTime}`],
  ];
  const baseTouches = [
    ["1", "知识", example.knowledgeTitle, "加企微后 1 天", "已发送"],
    ["2", "案例", example.caseTitle, "第 1 次后 2 天", "已发送"],
    ["3", "知识", example.budget === "预算还没确认" ? "如何先确定适合自己的装修预算" : `${example.budget}的项目拆分说明`, "第 2 次后 2 天", "已安排"],
    ["4", "权益", "免费上门量房体验券", "第 3 次后 3 天", "已安排"],
    ["5", "证明", "ENF 板材检测与工艺细节", "第 4 次后 3 天", "待生成"],
    ["6", "活动", "暑期焕新季 · 周末 2 个名额", "第 5 次后 5 天", "待生成"],
    ["7", "关怀", "礼貌询问是否还需要帮助", "第 6 次后 7 天", "待生成"],
  ];
  const touches = baseTouches.map((row) => {
    const update = touchUpdates[row[0]];
    const sourceLockReason = row[4] === "已发送" ? "" : sourceLocks[row[0]];
    const status = stopped && row[4] !== "已发送"
      ? "已停止"
      : sourceLockReason
        ? "来源已暂停"
        : update?.status || row[4];
    return [
      row[0],
      row[1],
      update?.title || row[2],
      update?.interval || row[3],
      status,
      update?.message || "",
      update?.attachment || "",
      update?.sendReason || "",
      sourceLockReason || "",
    ];
  });
  const current = touches[selected];
  const alreadySent = current[4] === "已发送";
  const sourceLocked = Boolean(current[8]);
  const previewMessage = current[5] || (current[2].includes("预算")
    ? `${name}，结合您之前问过的总价，我整理了一份预算拆分说明，帮助您分清基础项和升级项。您方便时看看，不着急回复。`
    : `这条“${current[2]}”会结合${name}之前的沟通生成；发送前自动检查客户状态和资料是否仍有效。`);

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={stopped ? `${name}已经明确拒绝，查看记录并保持停止` : `结合${name}以前的沟通，安排接下来发送什么`}
      decisionHint={stopped ? "客户明确拒绝后不再自动发送；历史记录和原计划仍保留供查看。" : `客户当前是“${stage}”，跟进优先分 ${priorityScore} / 100。历史和后续消息放在同一页，避免来回切换。`}
      checks={["先看客户以前怎么交流", "再看最多 7 次的后续内容和时间", stopped ? "保持停止，不再安排新消息" : "需要修改时只编辑当前这一条"]}
      actions={(
        <Button disabled={stopped} kind="danger" onClick={() => { setStopped(true); emitDetailEvent("demo-customer-followup-decision", { action: "stopped", customerName: name }); notify(`已停止给${name}自动发送，历史和原计划仍保留`); }}>{stopped ? "自动联系已停止" : "客户明确拒绝，停止自动联系"}</Button>
      )}
    >
      <div style={ui.stack}>
        <div className="customer-profile">
          <div className="avatar-large">{name.slice(0, 1)}</div>
          <div>
            <h3>{name}｜客户跟进详情</h3>
            <p>{stage} · {contactStage} · {stopped ? "不会再自动发送" : `下一次：${nextTime}`}</p>
            <div className="chip-wrap"><Pill tone={stopped ? "neutral" : Number(priorityScore) > 70 ? "positive" : "warning"}>跟进优先分 {priorityScore} / 100</Pill><Pill>{stopped ? "已停止自动联系" : "计划进行中"}</Pill></div>
          </div>
        </div>
        <h3 style={ui.miniHeading}>以前怎么沟通</h3>
        <div className="timeline-detail">
          {history.map(([date, event, result], index) => (
            <div key={date} style={{ gridTemplateColumns: "40px minmax(0, 1fr) 120px" }}>
              <i>{index + 1}</i>
              <span><b>{date}</b>　{event}</span>
              <Pill tone={index === history.length - 1 ? stopped ? "neutral" : "warning" : "positive"}>{result}</Pill>
            </div>
          ))}
        </div>
        <h3 style={ui.miniHeading}>接下来发送什么</h3>
        <div className="cadence-layout customer-cadence">
          <Card title={`${name}｜最多 7 次的后续内容`} caption="客户回复、拒绝或成交后立即停止，不要求发满 7 次" className="touch-list">
            {touches.map((row, index) => <button className={index === selected ? "active" : ""} key={row[0]} onClick={() => setSelected(index)}><i>{row[0]}</i><div><Pill>{row[1]}</Pill><b>{row[2]}</b><span>{row[3]}</span></div><Pill tone={row[4] === "已发送" ? "positive" : row[4] === "已停止" ? "neutral" : row[4] === "已安排" ? "warning" : "neutral"}>{row[4]}</Pill></button>)}
          </Card>
          <Card title={`第 ${current[0]} 次 · ${current[2]}`} caption={`当前状态：${current[4]}`} className="touch-detail">
            <div className="message-preview"><small>给{name}的内容</small><p>{previewMessage}</p><span>{current[6] ? `附件：${current[6]}` : "附件会在编辑时确认"} · 演示数据</span></div>
            {sourceLocked && <div style={ui.warning}><b style={ui.title}>这条不会发送</b><p style={ui.copy}>原因：{current[8]}。请先到对应工具恢复资料。</p></div>}
            <div className="rule-box"><b>为什么这时发送</b><p>{current[7] || (current[2].includes("预算") ? "客户问过总价，但还没看懂基础项和升级项；先解释，不急着推活动。" : "内容与客户当前装修阶段相符，并且距离上一次联系时间足够。")}</p></div>
            <div className="button-row">
              <Button
                disabled={(stopped || sourceLocked) && !alreadySent}
                kind={alreadySent ? "default" : "primary"}
                onClick={() => goTo("recall-cadence-detail", {
                  customerName: name,
                  touchNumber: current[0],
                  touchTitle: current[2],
                  touchTime: current[3],
                  currentMessage: current[5],
                  currentAttachment: current[6],
                  currentReason: current[7],
                  currentStatus: alreadySent ? "已发送" : current[4],
                  customerLockReason: stopped ? `${name}已停止自动联系` : "",
                  sourceLockReason: current[8],
                })}
              >
                {alreadySent ? "查看当时发送的内容" : stopped ? "客户已停止，不能修改" : sourceLocked ? "资料已暂停，不能修改" : "编辑这条消息"}
              </Button>
            </div>
          </Card>
        </div>
        <div style={ui.warning}>
          <b style={ui.title}>停止条件始终有效</b>
          <p style={ui.copy}>客户回复、明确拒绝、已选其他品牌、已成交或要求不要再联系时，后面的未发送消息都会立即停止。</p>
        </div>
      </div>
    </DetailShell>
  );
}

function RecallCadenceDetail({ screen, goTo, notify, context }: DetailPageProps) {
  const customerName = context?.customerName ?? "林女士";
  const touchNumber = context?.touchNumber ?? "3";
  const touchTitle = context?.touchTitle ?? "15 万预算如何分配更合理";
  const initialTime = context?.touchTime ?? "第 2 次后 2 天";
  const sentRecord = context?.currentStatus === "已发送";
  const legacyLockReason = context?.currentStatus?.startsWith("已锁住")
    ? context.currentStatus.replace(/^已锁住：?/, "") || "客户自动计划已暂停"
    : "";
  const [customerLockReason, setCustomerLockReason] = useState(context?.customerLockReason || "");
  const [sourceLockReason, setSourceLockReason] = useState(context?.sourceLockReason || legacyLockReason);
  const workflowBlocked = !sentRecord && Boolean(customerLockReason || sourceLockReason);
  const readOnly = sentRecord || workflowBlocked;
  const blockedReason = workflowBlocked ? customerLockReason || sourceLockReason : "";
  const sourceType = sourceLockReason.includes("量房券") || touchTitle.includes("量房")
    ? "量房券"
    : sourceLockReason.includes("已停用") || touchTitle.includes("活动")
      ? "活动"
      : "内容来源";
  const blockedDecisionHint = customerLockReason
    ? `${customerName}已经停止自动联系。请回到客户详情查看记录，不能从消息详情重新启动自动计划。`
    : `这条消息使用的${sourceType}已经暂停或停用。请先回到对应的${sourceType}设置恢复，不能从消息详情绕过停止状态。`;
  const defaultMessage = touchTitle.includes("预算")
    ? `${customerName}，结合您之前问过的总价，我整理了一份预算拆分说明，帮助您分清柜体基础项和升级项。您方便时看看，不着急回复。`
    : touchTitle.includes("量房")
      ? `${customerName}，如果您还没确定房屋尺寸，可以先看免费上门量房的说明。需要时回复“量房”，我再帮您核对服务区域和可约时间。`
      : touchTitle.includes("活动")
        ? `${customerName}，这是本店当前活动说明。发送前会重新核对日期和剩余名额；您需要时再了解，不方便回复也没关系。`
        : `${customerName}，这份“${touchTitle}”与您之前咨询的问题有关，您方便时可以先看看，不着急回复。`;
  const [message, setMessage] = useState(context?.currentMessage || defaultMessage);
  const [attachment, setAttachment] = useState(context?.currentAttachment || (touchTitle.includes("海报") || touchTitle.includes("预算") ? `${touchTitle}.jpg` : touchTitle.includes("券") ? "免费上门量房券.jpg" : "不附文件"));
  const [sendTime, setSendTime] = useState(initialTime);
  const [sendReason, setSendReason] = useState(context?.currentReason || (touchTitle.includes("预算") ? "客户问过总价，但还没看懂基础项和升级项；先解释，不急着推活动。" : "内容与客户当前装修阶段相符，并且距离上一次联系时间足够。"));
  const canSubmit = message.trim().length >= 16 && attachment.trim().length > 0 && sendTime.trim().length > 0 && sendReason.trim().length >= 8;

  useEffect(() => {
    function receiveStatus(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail.customerName !== customerName) return;
      if (detail.status === "stopped") setCustomerLockReason(`${customerName}已停止自动联系`);
      else setCustomerLockReason("");
    }
    function receiveSourceStatus(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail;
      if (detail.touchTitle !== touchTitle) return;
      setSourceLockReason(detail.reason || "");
    }
    function requestStatus() {
      emitDetailEvent("demo-customer-followup-status-request", { customerName });
      emitDetailEvent("demo-cadence-source-status-request", { touchTitle });
    }
    window.addEventListener("demo-customer-followup-status-response", receiveStatus);
    window.addEventListener("demo-cadence-source-status-response", receiveSourceStatus);
    window.addEventListener("demo-workflow-status-changed", requestStatus);
    const requestTimer = window.setTimeout(requestStatus, 0);
    return () => {
      window.clearTimeout(requestTimer);
      window.removeEventListener("demo-customer-followup-status-response", receiveStatus);
      window.removeEventListener("demo-cadence-source-status-response", receiveSourceStatus);
      window.removeEventListener("demo-workflow-status-changed", requestStatus);
    };
  }, [customerName, touchTitle]);

  function recordMessage() {
    if (readOnly) return;
    emitDetailEvent("demo-cadence-message-saved", {
      action: "saved",
      attachment,
      customerName,
      message,
      sendReason,
      status: "已安排",
      touchNumber,
      touchTime: sendTime,
      touchTitle,
    });
  }

  return (
    <DetailShell
      screen={screen}
      goTo={goTo}
      decision={workflowBlocked ? `为什么${customerName}的第 ${touchNumber} 次消息已经锁住？` : sentRecord ? `查看${customerName}已发送的第 ${touchNumber} 次消息：“${touchTitle}”` : `只编辑${customerName}的第 ${touchNumber} 次消息：“${touchTitle}”`}
      decisionHint={workflowBlocked ? blockedDecisionHint : sentRecord ? "这是一条历史发送记录，只能查看，不能改写内容、附件和发送时间。" : "这里只修改当前这一条。保存后会放回客户计划，状态变为“已安排”，到设定时间自动发送。"}
      checks={readOnly ? ["确认客户和第几次联系", "查看原消息和停止原因", "锁定记录不修改、不重新保存"] : ["确认客户和第几次联系", "核对完整消息、附件和发送时间", "保存并放回客户计划"]}
      actions={(
        <Button
          disabled={readOnly || !canSubmit}
          kind="primary"
          onClick={() => {
            recordMessage();
            notify(`第 ${touchNumber} 次消息已保存到${customerName}的后续计划`);
            goTo(screen.parent ?? "recall-customer-detail");
          }}
        >
          {workflowBlocked ? "自动计划已锁住，不能保存" : sentRecord ? "已发送记录不能修改" : canSubmit ? "保存并放回客户计划" : "先补全消息、附件、时间和发送原因"}
        </Button>
      )}
    >
      <div style={ui.stack}>
        {sentRecord && <div style={ui.warning}><b style={ui.title}>这条消息已经发送</b><p style={ui.copy}>以下内容仅供查看。若需要再次联系客户，请新建后续消息，不能改写已经发生的记录。</p></div>}
        {workflowBlocked && <div style={ui.warning}><b style={ui.title}>这条消息已经锁住，不会发送</b><p style={ui.copy}>原因：{blockedReason}。请先回到相关客户、活动或量房券设置处理，不能在这里绕过停止状态。</p></div>}
        <div style={ui.facts}>
          <Fact label="客户" value={customerName} />
          <Fact label="当前编辑" value={`第 ${touchNumber} 次联系`} />
          <Fact label="原计划时间" value={initialTime} />
        </div>
        <label style={ui.field}>
          <span><b>客户将收到的完整消息</b></span>
          <textarea disabled={readOnly} onChange={(event) => setMessage(event.target.value)} style={{ ...ui.textarea, minHeight: 130 }} value={message} />
        </label>
        <div style={ui.twoColumns}>
          <label style={ui.field}>
            <span>这一条附带什么</span>
            <input disabled={readOnly} onChange={(event) => setAttachment(event.target.value)} style={ui.input} value={attachment} />
          </label>
          <label style={ui.field}>
            <span>这一条什么时候发送</span>
            <input disabled={readOnly} onChange={(event) => setSendTime(event.target.value)} style={ui.input} value={sendTime} />
          </label>
        </div>
        <label style={ui.field}>
          <span>为什么现在发这一条</span>
          <textarea disabled={readOnly} onChange={(event) => setSendReason(event.target.value)} style={ui.textarea} value={sendReason} />
        </label>
      </div>
    </DetailShell>
  );
}

const detailPages: Record<string, (props: DetailPageProps) => ReactNode> = {
  "video-label-detail": VideoLabelDetail,
  "video-slice-detail": VideoSliceDetail,
  "video-spokesperson-detail": VideoSpokespersonDetail,
  "video-competitor-detail": VideoCompetitorDetail,
  "video-log-detail": VideoLogDetail,
  "video-result-detail": VideoResultDetail,
  "sales-training-detail": SalesTrainingDetail,
  "sales-champion-detail": SalesChampionDetail,
  "sales-simulation-detail": SalesSimulationDetail,
  "sales-conversation-detail": SalesConversationDetail,
  "sales-faq-detail": SalesFaqDetail,
  "recall-activity-detail": RecallActivityDetail,
  "recall-customer-detail": RecallCustomerDetail,
  "recall-cadence-detail": RecallCadenceDetail,
};

export function PrototypeDetailContent(props: PrototypeDetailContentProps) {
  const Page = detailPages[props.screen.id];

  if (!Page) {
    return (
      <Card title="未找到对应详情内容" caption={`页面编号：${props.screen.id}`}>
        <p style={ui.copy}>请返回上一级列表，重新打开要查看的记录。</p>
        <div style={ui.actionRow}>
          <Button onClick={() => props.goTo(props.screen.parent ?? "")}>← 返回上一级列表</Button>
        </div>
      </Card>
    );
  }

  return <Page {...props} />;
}
