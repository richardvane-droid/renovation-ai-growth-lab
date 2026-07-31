"use client";

import { useEffect, useRef, useState } from "react";
import {
  conversations,
  customers,
  Screen,
  videos,
} from "./prototype-data";
import { PrototypeDetailContent } from "./prototype-details";
import {
  slicePosterByFileName,
  spokespersonPosterByMaterial,
  videoPosterForTitle,
} from "./video-preview-data";

type ScreenProps = {
  screen: Screen;
  context?: Record<string, string>;
  goTo: (id: string, context?: Record<string, string>) => void;
  notify: (message: string) => void;
};

type LabelDecision = "match" | "no";
type ChampionLineDecision = "borrowable" | "not-borrowable";
type TrainingDocUpdate = { status: string; summary: string; conflictChoices?: string; parsedValues?: string };
type CadenceUpdate = {
  attachment?: string;
  customerName?: string;
  interval?: string;
  message?: string;
  sendReason?: string;
  status?: string;
  title?: string;
};
type FaqUpdate = {
  answer?: string;
  boundary?: string;
  source?: string;
  status: string;
};
type ActivityUpdate = {
  benefit?: string;
  inventory?: string;
  period?: string;
  status: "可使用" | "待开始" | "已停用";
};
type PluginStatus = "使用中" | "已暂停" | "未启用";
type PluginDraft = {
  customerMessage: string;
  priceTable: string;
  rulesChecked: boolean[];
  serviceRegion: string;
  storeName: string;
};

const workflowMemory = {
  labelWatched: new Set<string>(),
  labelDecisions: {} as Record<string, LabelDecision | undefined>,
  labelReasons: {} as Record<string, string>,
  topWatched: new Set<string>(),
  topSelected: "",
  trainingUploads: [] as string[],
  trainingDocs: {} as Record<string, TrainingDocUpdate>,
  removedTrainingDocs: new Set<string>(),
  championDecisions: {} as Record<string, "included" | "excluded">,
  championLineDecisions: {} as Record<string, Record<string, ChampionLineDecision>>,
  faqDetails: {} as Record<string, FaqUpdate>,
  cadenceUpdates: {} as Record<string, CadenceUpdate>,
  activityUpdates: {} as Record<string, ActivityUpdate>,
  stoppedCustomers: new Set<string>(),
  pluginStates: {} as Record<string, PluginStatus>,
  pluginDrafts: {} as Record<string, PluginDraft>,
  pluginDraftNeedsApply: new Set<string>(),
  salesConversationStatuses: {} as Record<string, string>,
  salesReviewNotes: {} as Record<string, string>,
  couponStatus: "使用中" as "使用中" | "已暂停",
  posterStatus: "使用中" as "使用中" | "已保存并使用",
  spokespersonReady: false,
};

const workflowSubscribers = new Set<() => void>();
let workflowBridgeReady = false;

function detailRecord(event: Event) {
  return ((event as CustomEvent<Record<string, unknown>>).detail ?? {}) as Record<string, unknown>;
}

function detailString(detail: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = detail[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseChampionLineDecisions(value: string) {
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

function championLineCounts(conversationId: string) {
  const decisions = Object.values(workflowMemory.championLineDecisions[conversationId] ?? {});
  return {
    borrowable: decisions.filter((decision) => decision === "borrowable").length,
    notBorrowable: decisions.filter((decision) => decision === "not-borrowable").length,
  };
}

function stoppedActivityForMessage(messageType: string) {
  return Object.entries(workflowMemory.activityUpdates).find(([activityName, update]) => {
    if (update.status !== "已停用") return false;
    const identifyingPrefix = activityName.replace(/活动|季|周|公开课/g, "").slice(0, 2);
    return messageType.includes(activityName)
      || identifyingPrefix.length >= 2 && messageType.includes(identifyingPrefix);
  })?.[0] || "";
}

function cadenceSourceLockReason(messageTitle: string) {
  if (workflowMemory.couponStatus === "已暂停" && messageTitle.includes("量房") && messageTitle.includes("券")) {
    return "量房券功能已暂停";
  }
  const stoppedActivity = stoppedActivityForMessage(messageTitle);
  return stoppedActivity ? `“${stoppedActivity}”已停用` : "";
}

function publishWorkflowChange() {
  workflowSubscribers.forEach((subscriber) => subscriber());
  if (typeof window !== "undefined") window.dispatchEvent(new Event("demo-workflow-status-changed"));
}

export function resetWorkflowDemo() {
  workflowMemory.labelWatched.clear();
  workflowMemory.labelDecisions = {};
  workflowMemory.labelReasons = {};
  workflowMemory.topWatched.clear();
  workflowMemory.topSelected = "";
  workflowMemory.trainingUploads = [];
  workflowMemory.trainingDocs = {};
  workflowMemory.removedTrainingDocs.clear();
  workflowMemory.championDecisions = {};
  workflowMemory.championLineDecisions = {};
  workflowMemory.faqDetails = {};
  workflowMemory.cadenceUpdates = {};
  workflowMemory.activityUpdates = {};
  workflowMemory.stoppedCustomers.clear();
  workflowMemory.pluginStates = {};
  workflowMemory.pluginDrafts = {};
  workflowMemory.pluginDraftNeedsApply.clear();
  workflowMemory.salesConversationStatuses = {};
  workflowMemory.salesReviewNotes = {};
  workflowMemory.couponStatus = "使用中";
  workflowMemory.posterStatus = "使用中";
  workflowMemory.spokespersonReady = false;
  publishWorkflowChange();
}

function dispatchSalesConversationStatus(customerName: string) {
  window.dispatchEvent(new CustomEvent("demo-sales-conversation-status-response", {
    detail: {
      customerName,
      status: workflowMemory.salesConversationStatuses[customerName] || "等待店长决定",
    },
  }));
}

function customerFollowupIsStopped(customerName: string) {
  const original = customers.find((row) => row[0] === customerName);
  return workflowMemory.stoppedCustomers.has(customerName)
    || original?.[5] === "已停止"
    || Boolean(original?.[2].includes("明确拒绝"));
}

function dispatchCustomerFollowupStatus(customerName: string) {
  const stopped = customerFollowupIsStopped(customerName);
  window.dispatchEvent(new CustomEvent("demo-customer-followup-status-response", {
    detail: {
      customerName,
      status: stopped ? "stopped" : "active",
    },
  }));
}

function cadenceUpdateKey(customerName: string, touchNumber: string) {
  return `${customerName}::${touchNumber}`;
}

function dispatchCadenceUpdate(customerName: string, touchNumber: string) {
  const update = workflowMemory.cadenceUpdates[cadenceUpdateKey(customerName, touchNumber)];
  if (!update) return;
  window.dispatchEvent(new CustomEvent("demo-cadence-message-status-response", {
    detail: {
      ...update,
      customerName,
      touchNumber,
      touchTime: update.interval,
      touchTitle: update.title,
    },
  }));
}

function listenWorkflowEvents(
  names: string[],
  handler: (event: Event) => void,
) {
  names.forEach((name) => window.addEventListener(name, handler));
}

function ensureWorkflowEventBridge() {
  if (typeof window === "undefined" || workflowBridgeReady) return;
  workflowBridgeReady = true;

  listenWorkflowEvents(
    ["demo-video-watched", "demo-video-label-watched", "demo-label-video-watched", "prototype:video-watched"],
    (event) => {
      const detail = detailRecord(event);
      const title = detailString(detail, "videoTitle", "title");
      if (!title) return;
      const purpose = detailString(detail, "purpose", "source");
      const onLabelDetail = window.location.hash.includes("video-label-detail");
      const onReferenceDetail = window.location.hash.includes("video-competitor-detail");
      if (purpose === "label" || onLabelDetail) workflowMemory.labelWatched.add(title);
      if (purpose === "reference" || purpose === "top" || onReferenceDetail) workflowMemory.topWatched.add(title);
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-label-saved", "demo-video-label-saved", "prototype:video-label-saved"],
    (event) => {
      const detail = detailRecord(event);
      const title = detailString(detail, "videoTitle", "title");
      const rawDecision = detailString(detail, "decision", "result", "status");
      const decision: LabelDecision | "" =
        rawDecision === "match" || rawDecision.includes("适合") && !rawDecision.includes("不适合")
          ? "match"
          : rawDecision === "no" || rawDecision.includes("不适合")
            ? "no"
            : "";
      if (!title || !decision) return;
      workflowMemory.labelWatched.add(title);
      workflowMemory.labelDecisions[title] = decision;
      workflowMemory.labelReasons[title] = detailString(detail, "reason");
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-reference-selected", "demo-video-selected", "demo-top-video-selected", "prototype:reference-selected"],
    (event) => {
      const detail = detailRecord(event);
      const title = detailString(detail, "videoTitle", "title");
      if (!title) return;
      const decision = detailString(detail, "decision", "status");
      if (decision === "skipped") {
        if (workflowMemory.topSelected === title) workflowMemory.topSelected = "";
      } else {
        workflowMemory.topWatched.add(title);
        workflowMemory.topSelected = title;
      }
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-training-file-decision", "demo-training-updated", "demo-training-file-status", "demo-training-document-updated", "prototype:training-updated"],
    (event) => {
      const detail = detailRecord(event);
      const fileName = detailString(detail, "sourceFileName", "fileName", "name");
      if (!fileName) return;
      const decision = detailString(detail, "decision", "action");
      workflowMemory.trainingDocs[fileName] = {
        conflictChoices: detailString(detail, "conflictChoices"),
        parsedValues: detailString(detail, "parsedValues"),
        status: decision === "paused" ? "已停用" : decision === "confirmed" ? "可用" : detailString(detail, "status", "sourceStatus") || "可用",
        summary: decision === "paused" ? "内容有误，机器人不会使用" : decision === "confirmed" ? "关键内容已由店长核对" : detailString(detail, "summary", "sourceSummary", "count") || "已核对关键内容",
      };
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-champion-line-decision"],
    (event) => {
      const detail = detailRecord(event);
      const conversationId = detailString(detail, "conversationId");
      const lineKey = detailString(detail, "lineKey");
      const decision = detailString(detail, "decision");
      if (!conversationId || !lineKey || (decision !== "borrowable" && decision !== "not-borrowable")) return;
      workflowMemory.championLineDecisions[conversationId] = {
        ...(workflowMemory.championLineDecisions[conversationId] ?? {}),
        [lineKey]: decision,
      };
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-champion-sample-decision", "prototype:champion-sample-decision"],
    (event) => {
      const detail = detailRecord(event);
      const sampleName = detailString(detail, "sampleName", "name");
      const conversationId = detailString(detail, "conversationId") || sampleName;
      const decision = detailString(detail, "decision");
      if (!sampleName || (decision !== "included" && decision !== "excluded")) return;
      workflowMemory.championDecisions[sampleName] = decision;
      const lineDecisions = parseChampionLineDecisions(detailString(detail, "lineDecisions"));
      if (Object.keys(lineDecisions).length > 0) {
        workflowMemory.championLineDecisions[conversationId] = lineDecisions;
      }
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-spokesperson-material-confirmed"],
    (event) => {
      const detail = detailRecord(event);
      if (detailString(detail, "materialType") !== "不同语气示范" || detailString(detail, "sourceReady") !== "yes") return;
      workflowMemory.spokespersonReady = true;
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-faq-published", "demo-faq-updated", "prototype:faq-published"],
    (event) => {
      const detail = detailRecord(event);
      const question = detailString(detail, "question", "title");
      if (!question) return;
      const status = detailString(detail, "status");
      workflowMemory.faqDetails[question] = {
        answer: detailString(detail, "answer"),
        boundary: detailString(detail, "boundary"),
        source: detailString(detail, "source"),
        status: status === "draft" ? "草稿已保存，仍用上一版" : status === "published" ? "已优化" : status || "已优化",
      };
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-activity-decision"],
    (event) => {
      const detail = detailRecord(event);
      const activityName = detailString(detail, "activityName", "name");
      if (!activityName) return;
      workflowMemory.activityUpdates[activityName] = {
        benefit: detailString(detail, "activityBenefit", "benefit"),
        inventory: detailString(detail, "inventory"),
        period: detailString(detail, "activityPeriod", "period"),
        status: detailString(detail, "action") === "stopped"
          ? "已停用"
          : detailString(detail, "action") === "scheduled"
            ? "待开始"
            : "可使用",
      };
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-customer-followup-decision"],
    (event) => {
      const detail = detailRecord(event);
      const customerName = detailString(detail, "customerName", "name");
      if (!customerName) return;
      const action = detailString(detail, "action");
      if (action === "stopped") {
        workflowMemory.stoppedCustomers.add(customerName);
      }
      dispatchCustomerFollowupStatus(customerName);
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-customer-followup-status-request"],
    (event) => {
      const detail = detailRecord(event);
      const customerName = detailString(detail, "customerName", "name");
      if (!customerName) return;
      dispatchCustomerFollowupStatus(customerName);
    },
  );

  listenWorkflowEvents(
    ["demo-cadence-source-status-request"],
    (event) => {
      const detail = detailRecord(event);
      const touchTitle = detailString(detail, "touchTitle", "messageType", "title");
      if (!touchTitle) return;
      window.dispatchEvent(new CustomEvent("demo-cadence-source-status-response", {
        detail: {
          reason: cadenceSourceLockReason(touchTitle),
          touchTitle,
        },
      }));
    },
  );

  listenWorkflowEvents(
    ["demo-sales-conversation-decision"],
    (event) => {
      const detail = detailRecord(event);
      const customerName = detailString(detail, "customerName", "name");
      if (!customerName) return;
      const action = detailString(detail, "action");
      const currentStatus = workflowMemory.salesConversationStatuses[customerName] || "";
      if (currentStatus.startsWith("已交给") && action !== "assigned") {
        dispatchSalesConversationStatus(customerName);
        publishWorkflowChange();
        return;
      }
      workflowMemory.salesConversationStatuses[customerName] = action === "assigned"
        ? `已交给王顾问 · ${detailString(detail, "due") || "今天 18:00 前"}`
        : "店长已检查，回答合格";
      dispatchSalesConversationStatus(customerName);
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-sales-conversation-status-request"],
    (event) => {
      const detail = detailRecord(event);
      const customerName = detailString(detail, "customerName", "name");
      if (!customerName) return;
      dispatchSalesConversationStatus(customerName);
    },
  );

  listenWorkflowEvents(
    ["demo-cadence-message-saved", "demo-cadence-updated", "demo-followup-message-saved", "demo-cadence-saved", "prototype:cadence-updated"],
    (event) => {
      const detail = detailRecord(event);
      const customerName = detailString(detail, "customerName", "name");
      const touchNumber = detailString(detail, "touchNumber", "step", "number");
      if (!customerName || !touchNumber) return;
      workflowMemory.cadenceUpdates[cadenceUpdateKey(customerName, touchNumber)] = {
        attachment: detailString(detail, "attachment"),
        customerName,
        interval: detailString(detail, "interval", "touchTime"),
        message: detailString(detail, "message", "content"),
        sendReason: detailString(detail, "sendReason", "reason"),
        status: detailString(detail, "status") || "已安排",
        title: detailString(detail, "title", "touchTitle"),
      };
      dispatchCadenceUpdate(customerName, touchNumber);
      publishWorkflowChange();
    },
  );

  listenWorkflowEvents(
    ["demo-cadence-message-status-request"],
    (event) => {
      const detail = detailRecord(event);
      const customerName = detailString(detail, "customerName", "name");
      const touchNumber = detailString(detail, "touchNumber", "step", "number");
      if (!customerName || !touchNumber) return;
      dispatchCadenceUpdate(customerName, touchNumber);
    },
  );
}

function useWorkflowBridge() {
  const [, setRevision] = useState(0);
  useEffect(() => {
    ensureWorkflowEventBridge();
    const refresh = () => setRevision((value) => value + 1);
    workflowSubscribers.add(refresh);
    return () => {
      workflowSubscribers.delete(refresh);
    };
  }, []);
}

export function WorkflowEventBridge() {
  useEffect(() => {
    ensureWorkflowEventBridge();
  }, []);
  return null;
}

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

function VideoCover({
  alt,
  label,
  portrait = false,
  src,
  unavailableMessage,
}: {
  alt: string;
  label: string;
  portrait?: boolean;
  src?: string;
  unavailableMessage?: string;
}) {
  return (
    <div
      aria-label={src ? undefined : `${alt}：${unavailableMessage || "暂时无法提取预览"}`}
      className={`media-cover ${portrait ? "portrait" : ""} ${src ? "" : "preview-unavailable"}`}
      role={src ? undefined : "img"}
    >
      {src ? (
        <>
          {/* The prototype intentionally displays the exact frame, without image optimisation altering it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={alt} src={src} />
          <span aria-hidden="true" className="media-cover-play">▶</span>
        </>
      ) : (
        <span className="media-cover-error">{unavailableMessage || "暂时无法提取预览"}</span>
      )}
      <small className="media-cover-duration">{label}</small>
    </div>
  );
}

type FileUploadPreview = {
  duration?: string;
  error?: string;
  poster?: string;
};

type SliceFile = {
  count: string;
  duration: string;
  name: string;
  poster?: string;
  previewError?: string;
  status: string;
};

function formatVideoDuration(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return undefined;
  const wholeSeconds = Math.max(1, Math.round(duration));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function extractVideoPreview(file: File): Promise<FileUploadPreview> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    let duration: string | undefined;

    const finish = (result: FileUploadPreview) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve({ duration, ...result });
    };

    const capture = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        if (!canvas.width || !canvas.height) {
          finish({ error: "暂时无法提取预览" });
          return;
        }
        const context = canvas.getContext("2d");
        if (!context) {
          finish({ error: "暂时无法提取预览" });
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish({ poster: canvas.toDataURL("image/jpeg", 0.84) });
      } catch {
        finish({ error: "暂时无法提取预览" });
      }
    };

    const timeout = window.setTimeout(
      () => finish({ error: "暂时无法提取预览" }),
      10000,
    );

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("loadedmetadata", () => {
      duration = formatVideoDuration(video.duration);
    });
    video.addEventListener("loadeddata", () => {
      const finiteDuration = Number.isFinite(video.duration) ? video.duration : 0;
      const targetTime = finiteDuration > 0.2
        ? Math.min(Math.max(finiteDuration * 0.18, 0.1), finiteDuration - 0.1)
        : 0;
      if (targetTime === 0 || Math.abs(video.currentTime - targetTime) < 0.02) {
        capture();
      } else {
        video.currentTime = targetTime;
      }
    }, { once: true });
    video.addEventListener("seeked", capture, { once: true });
    video.addEventListener("error", () => finish({ error: "暂时无法提取预览" }), { once: true });
    video.src = objectUrl;
  });
}

function FileUpload({
  accept,
  label,
  onUpload,
}: {
  accept: string;
  label: string;
  onUpload: (name: string, preview?: FileUploadPreview) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        className="visually-hidden"
        type="file"
        accept={accept}
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.type.startsWith("video/") || accept.includes("video")) {
            const preview = await extractVideoPreview(file);
            onUpload(file.name, preview);
          } else {
            onUpload(file.name);
          }
          input.value = "";
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
        title="选择门店实际经营范围"
        caption="品类和服务城市都要选；这里的设置只用于筛选内容，不会修改公开门店资料"
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
          <b>已选 {selectedCategories.length} 个品类、{selectedRegions.length} 个服务城市</b>
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
            保存并匹配视频
          </Button>
        </div>
      </Card>
      <Card
        title="当前门店设置（示例）"
        caption="演示保存时间：今天 14:32"
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
          <div className="link-actions"><button onClick={() => notify("请直接在左侧重新勾选")}>重新选择</button><button onClick={() => { setSelectedCategories([]); setSaved(false); notify("演示：主营品类已清空，可重新选择"); }}>清空</button></div>
        </div>
        <div className="saved-block">
          <div><b>服务区域</b><span>{selectedRegions.length} 项</span></div>
          <div className="chip-wrap">{selectedRegions.map((item) => <Pill key={item}>{item}</Pill>)}</div>
          <div className="link-actions"><button onClick={() => notify("请直接在左侧重新勾选")}>重新选择</button><button onClick={() => { setSelectedRegions([]); setSaved(false); notify("演示：服务城市已清空，可重新选择"); }}>清空</button></div>
        </div>
        <Button onClick={() => notify("已准备另一家门店的空白设置表")}>有多个门店？添加另一家门店</Button>
      </Card>
    </div>
  );
}

function LabelScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const firstVideos = videos.slice(0, 10);
  const completed = firstVideos.filter((video) => workflowMemory.labelDecisions[video.title]).length;

  function undoDecision(videoTitle: string) {
    delete workflowMemory.labelDecisions[videoTitle];
    delete workflowMemory.labelReasons[videoTitle];
    publishWorkflowChange();
    notify("这条判断已撤销，可以重新选择");
  }

  return (
    <div className="stack">
      <div className="filter-bar">
        <div>
          <b>首批示例：全屋定制 · 漳州 / 厦门</b>
          <span>只判断“这种内容是否值得发给本店客户看”</span>
        </div>
        <strong>已完成 {completed} / 10</strong>
        <Button
          disabled={completed < 10}
          onClick={() => notify("首批已完成，已加载下一批候选视频")}
        >
          {completed < 10 ? `还差 ${10 - completed} 条` : "首批完成，继续更多"}
        </Button>
      </div>
      <div className="video-list">
        {firstVideos.map((video) => {
          const decision = workflowMemory.labelDecisions[video.title];
          const watched = workflowMemory.labelWatched.has(video.title);
          return (
          <article className="video-row" key={video.title}>
            <button
              className="cover-button"
              onClick={() => goTo("video-label-detail", { videoTitle: video.title, account: video.account, duration: video.duration })}
              type="button"
              aria-label={`播放并判断：${video.title}`}
            >
              <VideoCover
                alt={`${video.title}的视频预览帧`}
                label={video.duration}
                src={videoPosterForTitle(video.title)}
              />
            </button>
            <div className="video-copy">
              <b>{video.title}</b>
              <span>{video.account} · {video.views} 播放</span>
              <small>
                {decision
                  ? `已保存的判断理由：${workflowMemory.labelReasons[video.title] || "没有保存理由，请撤销后重新判断"}`
                  : watched
                    ? "已看完，现在请判断是否适合本店"
                    : "还没看完；点左侧视频，播放结束后才能判断"}
              </small>
            </div>
            <div className="label-actions">
              <button
                className={decision === "match" ? "selected positive" : ""}
                disabled={!watched}
                onClick={() => goTo("video-label-detail", { videoTitle: video.title, account: video.account, duration: video.duration })}
                type="button"
              >
                {watched ? "填写理由并选“适合”" : "看完后才能选“适合”"}
              </button>
              <button
                className={decision === "no" ? "selected negative" : ""}
                disabled={!watched}
                onClick={() => goTo("video-label-detail", { videoTitle: video.title, account: video.account, duration: video.duration })}
                type="button"
              >
                {watched ? "填写理由并选“不适合”" : "看完后才能选“不适合”"}
              </button>
              {decision && <button className="text-button" onClick={() => undoDecision(video.title)}>撤销</button>}
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}

function SliceScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [files, setFiles] = useState<SliceFile[]>([
    { name: "龙文店厨房安装实拍.mp4", status: "已完成", count: "12", duration: "00:42", poster: slicePosterByFileName["龙文店厨房安装实拍.mp4"] },
    { name: "衣柜封边细节.mov", status: "分析中", count: "—", duration: "00:36", poster: slicePosterByFileName["衣柜封边细节.mov"] },
    { name: "118㎡完工全景.mp4", status: "已完成", count: "9", duration: "00:42", poster: slicePosterByFileName["118㎡完工全景.mp4"] },
    { name: "儿童房收纳改造.mp4", status: "已完成", count: "7", duration: "00:36", poster: slicePosterByFileName["儿童房收纳改造.mp4"] },
  ]);
  return (
    <div className="stack">
      <div className="filter-bar">
        <div>
          <b>门店实拍素材库</b>
          <span>支持工地、安装、展厅和完工视频；原视频不会自动公开</span>
        </div>
        <FileUpload
          accept="video/*"
          label="＋ 上传门店视频"
          onUpload={(name, preview) => {
            setFiles((current) => [{
              count: "—",
              duration: preview?.duration || "已上传",
              name,
              poster: preview?.poster,
              previewError: preview?.error,
              status: "分析中",
            }, ...current]);
            notify(`${name} 已上传，正在分析`);
          }}
        />
      </div>
      <div className="asset-table">
        <div className="asset-table-head"><span>预览</span><span>视频</span><span>处理状态</span><span>可用片段数</span><span>画面内容</span><span>操作</span></div>
        {files.map((file, index) => (
          <div className="asset-table-row" key={`${file.name}-${index}`}>
            <VideoCover
              alt={`${file.name}的视频预览帧`}
              label={file.duration}
              src={file.poster}
              unavailableMessage={file.previewError}
            />
            <div><b>{file.name}</b><small>{index % 2 ? "门店实拍 · 竖屏" : "工地现场 · 横屏"}</small></div>
            <Pill tone={file.status === "已完成" ? "positive" : "warning"}>{file.status === "已完成" ? "分析完成" : "正在拆分画面"}</Pill>
            <strong>{file.count}</strong>
            <span>{file.status === "已完成" ? "安装工艺、空间全景、柜体细节、客户动线" : "约需 2 分钟，请勿重复上传"}</span>
            <div className="row-actions">
              <button
                disabled={file.status !== "已完成"}
                onClick={() => goTo("video-slice-detail", { sourceFileName: file.name, segmentCount: file.count })}
              >
                {file.status === "已完成" ? `检查 ${file.count} 个片段` : "分析完成后可检查"}
              </button>
              <button onClick={() => { setFiles((current) => current.filter((_, i) => i !== index)); notify(`演示：${file.name} 已移出素材库`); }}>移出</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpokespersonScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [thirdVideo, setThirdVideo] = useState<({ name: string } & FileUploadPreview) | null>(null);
  const specs = [
    ["正面讲话", "竖屏 · 30–60 秒", "镜头与眼睛同高，照着页面台词说一段门店介绍", "已完成"],
    ["自然动作", "竖屏 · 15–30 秒", "腰部以上入镜，左右转身并做自然手势", "已完成"],
    ["不同语气示范", "横屏 · 60 秒", "分别用平静、热情、解释、邀约四种语气读示例台词", workflowMemory.spokespersonReady ? "已完成" : thirdVideo ? "已上传，等待检查" : "待上传"],
  ];
  return (
    <div className="spokesperson-layout">
      <Card title="出镜人信息" caption="示例：门店店长 · 杜海鹏" className="profile-card">
        <div className="portrait-placeholder">杜</div>
        <div className="profile-meta">
          <b>杜店长｜漳州龙文店</b>
          <span>角色：专业顾问型店长</span>
          <span>适合：工艺讲解、门店介绍、方案邀约</span>
          <Pill tone="positive">本人授权已确认 · 可随时撤回</Pill>
        </div>
        <FileUpload accept="image/*" label="替换正面照片" onUpload={(name) => notify(`${name} 已设为店长正面照片`)} />
      </Card>
      <Card title="照着示范拍 3 段视频" caption="每一项都写明怎么拍、拍多久；不合格会给出重拍原因" className="spec-card">
        {specs.map(([title, spec, description, status], index) => (
          <div className="spec-row" key={title}>
            <VideoCover
              alt={`${title}的视频预览帧`}
              label={index === 2 && thirdVideo ? thirdVideo.duration || "已上传" : index === 2 ? "待上传" : "00:42"}
              portrait
              src={index === 2 && thirdVideo ? thirdVideo.poster : spokespersonPosterByMaterial[title]}
              unavailableMessage={index === 2 && thirdVideo ? thirdVideo.error : undefined}
            />
            <div><b>{title}</b><span>{spec}</span><small>{description}</small></div>
            <Pill tone={status === "已完成" ? "positive" : "warning"}>{status}</Pill>
            {status === "已完成" ? (
              <Button onClick={() => goTo("video-spokesperson-detail", { spokespersonName: "杜海鹏", materialType: title, sourceReady: index === 2 && thirdVideo ? "yes" : "no" })}>检查这项</Button>
            ) : thirdVideo ? (
              <Button onClick={() => goTo("video-spokesperson-detail", { spokespersonName: "杜海鹏", materialType: title, sourceReady: "yes" })}>检查刚上传的视频</Button>
            ) : (
              <FileUpload accept="video/*" label="上传视频" onUpload={(name, preview) => { setThirdVideo({ name, ...(preview ?? {}) }); notify(`${name} 已上传，下一步请检查画面和声音`); }} />
            )}
          </div>
        ))}
      </Card>
      <Card title="合格示例" caption="演示：杜店长介绍门店活动和板材配置" className="demo-card">
        <VideoCover
          alt="合格出镜示例的视频预览帧"
          label="00:38 · 查看示例"
          portrait
          src={spokespersonPosterByMaterial["合格示例"]}
        />
        <p>镜头平视、安静环境、人物腰部以上入镜；开头停顿 1 秒，结尾保持自然表情 2 秒。</p>
      </Card>
    </div>
  );
}

function TopVideosScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [day, setDay] = useState("今天 7/31");
  const selected = videos.findIndex((video) => video.title === workflowMemory.topSelected);
  const watchedCount = videos.filter((video) => workflowMemory.topWatched.has(video.title)).length;
  const enoughWatched = watchedCount >= 3;

  function selectVideo(videoTitle: string) {
    if (!workflowMemory.topWatched.has(videoTitle)) {
      notify("请先打开并完整播放这条视频，再选择");
      return;
    }
    workflowMemory.topSelected = videoTitle;
    publishWorkflowChange();
    notify(`已选中「${videoTitle}」，完整看满 3 条后可确认`);
  }

  return (
    <div className="stack">
      <div className="filter-bar">
        <div className="segmented">
          {["今天 7/31", "昨天 7/30", "前天 7/29"].map((item) => (
            <button className={day === item ? "active" : ""} key={item} onClick={() => setDay(item)}>{item}</button>
          ))}
        </div>
        <span>已完整看过 {watchedCount} / 3 条 · 只有播放到结尾的演示才会计数</span>
        <Button
          disabled={selected < 0 || !enoughWatched}
          kind="primary"
          onClick={() => selected >= 0 && notify(`已把「${videos[selected].title}」设为今天的参考视频`)}
        >
          {!enoughWatched ? "先完整看 3 条" : selected < 0 ? "请先选 1 条" : "用这条做今天的参考"}
        </Button>
      </div>
      <div className="top-video-grid">
        {videos.map((video, index) => (
          <article className={selected === index ? "top-video-card selected" : "top-video-card"} key={video.title}>
            <button
              aria-label={`播放并查看：${video.title}`}
              onClick={() => goTo("video-competitor-detail", { videoTitle: video.title, account: video.account, rank: String(index + 1), duration: video.duration })}
              type="button"
            >
              <VideoCover
                alt={`${video.title}的视频预览帧`}
                label={video.duration}
                portrait
                src={videoPosterForTitle(video.title)}
              />
            </button>
            <div className="rank-badge">#{index + 1}</div>
            <b>{video.title}</b>
            <span>{video.account}</span>
            <div className="metric-row"><small>点赞 {video.likes}</small><small>评论 {video.comments}</small><small>收藏 {video.saves}</small><small>转发 {video.shares}</small></div>
            <div className="card-actions">
              <button disabled={!workflowMemory.topWatched.has(video.title)} onClick={() => selectVideo(video.title)}>{selected === index ? "✓ 已选为参考" : workflowMemory.topWatched.has(video.title) ? "选这条" : "看完后才能选"}</button>
              <button onClick={() => goTo("video-competitor-detail", { videoTitle: video.title, account: video.account, rank: String(index + 1), duration: video.duration })}>看完整视频</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReportScreen({ notify }: Pick<ScreenProps, "notify">) {
  const [ready, setReady] = useState(true);
  const report = [
    ["00:00–00:03", "先让人停下来", "“33㎡钻石厨房，台面竟多出 1.8 米”", "镜头快速靠近，数字用大字幕"],
    ["00:03–00:10", "说清客户痛点", "原户型转角浪费、两人操作拥挤", "绕着厨房拍，并标出浪费位置"],
    ["00:10–00:24", "展示解决办法", "高低台、钻石转角与电器高柜", "连续展示 3 个真实细节"],
    ["00:24–00:34", "用实拍证明", "安装前后从同一位置对比", "前后画面平滑切换"],
    ["00:34–00:42", "邀请客户下一步", "回复“厨房”，领取同户型规划清单", "店长正面讲话"],
  ];
  if (!ready) {
    return (
      <div className="analysis-state">
        <div className="spinner" />
        <h3>正在看这条视频为什么有效</h3>
        <p>已经拆好画面，正在判断每段话和画面的作用。</p>
        <Progress value={63} />
        <span>预计剩余 1 分 40 秒</span>
        <Button onClick={() => setReady(true)}>演示：立即完成</Button>
      </div>
    );
  }
  return (
    <article className="report">
      <div className="report-title">
        <div><Pill tone="positive">已经看完</Pill><h2>《33㎡钻石厨房》为什么没花钱推广也有人看</h2><p>42 秒 · 没花钱推广获得 8.6 万播放 · 从头看到结尾 41.8% · 收藏 1,486 次</p></div>
        <Button onClick={() => setReady(false)}>看看等待时会显示什么</Button>
      </div>
      <div className="report-summary">
        <strong>店长先看这句结论</strong>
        <p>开头 3 秒用“面积反差 + 明确好处”吸引注意；中间用真实前后对比证明方案；结尾只邀请客户回复关键词领清单，不强迫到店。</p>
      </div>
      <div className="report-table">
        <div><b>时间</b><b>这段在做什么</b><b>说什么</b><b>画面怎么拍</b></div>
        {report.map((row) => <div key={row[0]}>{row.map((item) => <span key={item}>{item}</span>)}</div>)}
      </div>
      <div className="insight-grid">
        <Card title="谁来讲更合适"><p>35–45 岁店长形象；语速自然；不夸张表演；始终在真实门店或工地。</p></Card>
        <Card title="本店可以借鉴"><p>数字反差开场 → 客户痛点 → 方案细节 → 真实前后对比 → 邀请领取清单。</p></Card>
        <Card title="这些不能照搬"><p>不能复制对方户型、画面和文案；必须换成本店真实案例、价格和服务区域。</p></Card>
      </div>
      <Button kind="primary" onClick={() => notify("已确认本店替换内容，开始制作今天的视频")}>确认替换内容，开始制作本店视频</Button>
    </article>
  );
}

function ProgressScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const pipeline = [
    ["改写开头和讲解文案", "已完成", "positive"],
    ["安排每个镜头内容", "已完成", "positive"],
    ["选用本店实拍素材", "已完成", "positive"],
    ["生成店长口播", completed ? "已完成" : paused ? "已暂停" : "正在做第 6/8 段", completed ? "positive" : "warning"],
    ["合成字幕和画面", completed ? "已完成" : "还没开始", completed ? "positive" : "neutral"],
    ["自动检查并生成文件", completed ? "已完成" : "还没开始", completed ? "positive" : "neutral"],
  ];
  const logs = [
    ["14:32:01", "写开头", "把开头改成先说客户能得到什么", "完成"],
    ["14:32:18", "安排镜头", "把视频安排成 12 个短镜头", "完成"],
    ["14:32:45", "挑本店画面", "找到厨房安装和完工画面", "完成"],
    ["14:33:02", "替换画面", "第 7 段换成更清楚的钻石台面特写", "完成"],
    ["14:33:38", "生成店长讲话", "第一次缺少门店角标，系统正在重做", "已处理"],
    ["14:33:52", "生成店长讲话", "门店角标已补上", "完成"],
    ["14:34:05", "生成店长讲话", completed ? "8 段讲话都已完成" : paused ? "已由店长暂停" : "正在制作第 6/8 段…", completed ? "完成" : paused ? "暂停" : "进行中"],
  ];
  const progress = completed ? 100 : paused ? 73 : 76;
  return (
    <div className="stack">
      <Card title="今天的视频正在制作" caption="参考：33㎡钻石厨房案例｜预计成片 42 秒">
        <div className="task-progress"><b>总进度 {progress}%</b><Progress value={progress} /><span>{completed ? "制作完成，可以进入下一步检查成片" : paused ? "任务已暂停" : "预计剩余 1 分 40 秒"}</span></div>
      </Card>
      <Card title="制作步骤">
        <div className="pipeline">
          {pipeline.map(([title, status, tone]) => <div key={title}><b>{title}</b><Pill tone={tone as "neutral" | "positive" | "warning"}>{status}</Pill></div>)}
        </div>
      </Card>
      <Card title="详细制作记录（通常不用看）" action={<button className="text-link" onClick={() => goTo("video-log-detail")}>有问题时查看 ›</button>} className="log-card">
        <div className="log-table">
          <div><b>时间</b><b>模块</b><b>事件描述</b><b>状态</b></div>
          {logs.map((row) => <div key={`${row[0]}${row[2]}`}>{row.map((item, index) => <span className={index === 3 ? `status-${item}` : ""} key={item}>{item}</span>)}</div>)}
        </div>
      </Card>
      <div className="button-row">
        <Button disabled={completed} onClick={() => { setPaused((value) => !value); notify(paused ? "任务已继续" : "任务已暂停"); }}>{paused ? "继续制作" : "暂停制作"}</Button>
        <Button disabled={completed || paused} kind="primary" onClick={() => { setCompleted(true); notify("演示：剩余步骤已完成，现在可以检查成片"); }}>演示：完成剩余制作</Button>
        <Button kind="danger" onClick={() => notify("取消操作需要二次确认，演示版未执行")}>取消生成</Button>
        <Button onClick={() => notify("已打开本任务的全部输入素材")}>查看输入素材</Button>
      </div>
    </div>
  );
}

function ResultScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const manualChecks = ["人物和声音自然", "产品与材料说明正确", "价格和活动条件正确", "服务地区与联系方式正确", "画面没有客户隐私"];
  const [watched, setWatched] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean[]>(manualChecks.map(() => false));
  const readyToDownload = watched && confirmed.every(Boolean);
  return (
    <div className="result-layout">
      <Card title="今天的成片（演示）" caption="42 秒 · 必须播放到结尾，再完成右侧人工确认" className="result-player">
        <video controls onEnded={() => { setWatched(true); notify("已记录：店长把成片从头播放到结尾"); }} playsInline poster="./video-previews/finished-kitchen.jpg" preload="metadata">
          <source src="./demos/finished-kitchen-video.mp4" type="video/mp4" />
          当前浏览器无法播放，可下载后查看。
        </video>
        <div className="version-tabs"><button className="active">第 3 版（建议发布）</button><button>大字幕版</button><button>第 1 版（只用于对比）</button></div>
        <Pill tone={watched ? "positive" : "warning"}>{watched ? "已播放到结尾" : "还没有播放到结尾"}</Pill>
      </Card>
      <Card title="系统自动检查" caption="绿色检查不能代替店长人工看完" className="qa-list">
        {[
          ["画面清晰", "97 / 100", "positive"],
          ["字幕没有被平台按钮挡住", "通过", "positive"],
          ["人物说话与字幕基本一致", "99%", "positive"],
          ["门店标识已显示", "通过", "positive"],
          ["价格和活动表述", "没有发现明显问题", "positive"],
          ["背景音乐允许商用", "通过", "positive"],
          ["平台敏感词", "未发现", "positive"],
          ["视频从头到尾完整", "通过", "positive"],
        ].map(([label, value, tone]) => <div className="qa-item" key={label}><span>{label}</span><Pill tone={tone as "positive"}>{value}</Pill></div>)}
        <div className="manual-check-note"><b>店长还要亲自确认</b><span>全部打勾且视频播放到结尾后，下载按钮才会出现。</span></div>
        <div className="manual-check-list">
          {manualChecks.map((item, index) => <label key={item}><input checked={confirmed[index]} onChange={() => setConfirmed((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))} type="checkbox" />{item}</label>)}
        </div>
        {readyToDownload ? (
          <a className="ui-button ui-button-primary" download="今日成片-第3版.mp4" href="./demos/finished-kitchen-video.mp4" onClick={() => notify("正在下载演示成片：今日成片-第3版.mp4")}>人工检查完成，下载第 3 版</a>
        ) : (
          <Button disabled kind="primary">先看完视频并完成 5 项人工确认</Button>
        )}
        <Button onClick={() => goTo("video-result-detail", { version: "推荐版" })}>查看版本、检查证据和下载记录</Button>
      </Card>
      <Card title="发布建议" caption="依据本账号近 30 天粉丝在线时间">
        <div className="publish-suggestion"><strong>今天 19:40–20:10</strong><span>标题建议：33㎡钻石厨房，台面多出 1.8 米是怎么做到的？</span><span>首评建议：回复“厨房”，领取同户型动线规划清单。</span></div>
      </Card>
    </div>
  );
}

function TrainingScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const baseDocs = [
    ["销售培训手册 2026.pdf", "可用", "读出 126 条内容"],
    ["568 元套餐与包含项.xlsx", "可用", "读出 48 条价格规则"],
    ["暑期焕新季活动规则.docx", "可用", "读出 12 条活动规则"],
    ["门店地址与接待名额.xlsx", "可用", "3 家门店"],
    ["板材配置说明.pdf", "有冲突", "2 处说法不一致"],
  ];
  const docs = [
    ...workflowMemory.trainingUploads.map((name) => [
      name,
      workflowMemory.trainingDocs[name]?.status ?? "读取中",
      workflowMemory.trainingDocs[name]?.summary ?? "正在读取文件",
    ]),
    ...baseDocs
      .filter(([name]) => !workflowMemory.removedTrainingDocs.has(name))
      .map(([name, status, summary]) => [
        name,
        workflowMemory.trainingDocs[name]?.status ?? status,
        workflowMemory.trainingDocs[name]?.summary ?? summary,
      ]),
  ].filter(([name]) => !workflowMemory.removedTrainingDocs.has(name));

  function uploadDocument(name: string) {
    workflowMemory.removedTrainingDocs.delete(name);
    if (!workflowMemory.trainingUploads.includes(name) && !baseDocs.some(([fileName]) => fileName === name)) {
      workflowMemory.trainingUploads.unshift(name);
    }
    workflowMemory.trainingDocs[name] = { status: "读取中", summary: "正在读取文件，请稍候" };
    publishWorkflowChange();
    notify(`${name} 已上传，正在读取文件内容`);
    window.setTimeout(() => {
      if (workflowMemory.removedTrainingDocs.has(name)) return;
      workflowMemory.trainingDocs[name] = {
        status: "待核对",
        summary: "已读出 5 条关键内容，等待店长核对",
      };
      publishWorkflowChange();
    }, 900);
  }

  function removeDocument(name: string) {
    workflowMemory.removedTrainingDocs.add(name);
    workflowMemory.trainingUploads = workflowMemory.trainingUploads.filter((fileName) => fileName !== name);
    delete workflowMemory.trainingDocs[name];
    publishWorkflowChange();
    notify(`演示：${name} 已移出资料库`);
  }

  return (
    <div className="stack">
      <div className="filter-bar">
        <div><b>机器人回答时可以使用的门店资料</b><span>只有标为“可用”的价格、活动、区域和售后内容可以对客户说</span></div>
        <FileUpload accept=".pdf,.doc,.docx,.xlsx" label="＋ 上传最新门店资料" onUpload={uploadDocument} />
      </div>
      <div className="doc-grid">
        {docs.map(([name, status, count], index) => (
          <Card key={name} className="doc-card">
            <div className="doc-icon">{name.split(".").pop()?.toUpperCase()}</div>
            <div><b>{name}</b><span>{count}</span></div>
            <Pill tone={status === "可用" ? "positive" : status === "有冲突" || status === "待核对" ? "warning" : "info"}>
              {status === "有冲突" ? "需要你确认" : status === "待核对" ? "读取完成，待核对" : status}
            </Pill>
            <button
              disabled={status === "读取中"}
              onClick={() => goTo("sales-training-detail", {
                conflictChoices: workflowMemory.trainingDocs[name]?.conflictChoices ?? "",
                parsedValues: workflowMemory.trainingDocs[name]?.parsedValues ?? "",
                sourceFileName: name,
                sourceStatus: status,
                sourceSummary: count,
                sourceOrigin: index < workflowMemory.trainingUploads.length ? "刚上传的文件" : "已有门店资料",
              })}
            >
              {status === "读取中" ? "读取完成后可核对" : status === "有冲突" ? "处理 2 处说法不一致 ›" : "核对读出的内容 ›"}
            </button>
            <button onClick={() => removeDocument(name)}>移出</button>
          </Card>
        ))}
      </div>
      <Card title="必需资料是否齐全">
        <div className="coverage-grid">{[["价格与包含项", 96], ["活动与名额", 100], ["材料与工艺", 88], ["门店与服务区域", 100], ["售后与工期", 72]].map(([label, value]) => <div key={String(label)}><span>{label}</span><b>{value}%</b><Progress value={Number(value)} /></div>)}</div>
      </Card>
    </div>
  );
}

function ChampionScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [uploadedSamples, setUploadedSamples] = useState<string[][]>([]);
  const baseSamples = [
    ["CASE-001", "林女士｜118㎡原木风", "到店", "先确认风格，再用活动名额完成邀约"],
    ["CASE-002", "陈先生｜预算 15 万", "到店", "分档解释价格，邀请带户型到店"],
    ["CASE-003", "周女士｜关注环保", "到店", "使用 ENF 板材配置与检测报告"],
    ["CASE-004", "吴先生｜地址偏远", "量房", "确认区域后预约免费上门测量"],
    ["CASE-005", "张女士｜只看效果图", "继续沟通", "用风格选择题补齐基础信息"],
    ["CASE-006", "黄先生｜多次压价", "未成交", "坚持承诺边界，未虚构优惠"],
    ["CASE-007", "赵女士｜旧房翻新", "到店", "先问改造范围，再推荐真实案例"],
    ["CASE-008", "王先生｜新房未交付", "已留下联系方式", "隔几天提供一次有用信息"],
    ["CASE-009", "李女士｜板材对比", "到店", "说明品牌差异，不贬低别家"],
    ["CASE-010", "郭先生｜周末有空", "到店", "核实剩余接待名额后确认时间"],
  ];
  const samples = [...uploadedSamples, ...baseSamples];
  const decisions = samples.map((row) => workflowMemory.championDecisions[row[0]]);
  const excludedCount = decisions.filter((decision) => decision === "excluded").length;
  const confirmedCount = decisions.filter((decision) => decision === "included").length;
  const decidedCount = confirmedCount + excludedCount;
  const allDecided = decidedCount === samples.length;
  const includedLineCounts = samples.reduce(
    (totals, row) => {
      if (workflowMemory.championDecisions[row[0]] !== "included") return totals;
      const counts = championLineCounts(row[0]);
      return {
        borrowable: totals.borrowable + counts.borrowable,
        notBorrowable: totals.notBorrowable + counts.notBorrowable,
      };
    },
    { borrowable: 0, notBorrowable: 0 },
  );
  return (
    <div className="stack">
      <div className="filter-bar">
        <div>
          <b>已检查 {decidedCount} / {samples.length} 段聊天</b>
          <span>
            {confirmedCount} 段参与学习 · {excludedCount} 段排除 ·
            可借鉴 {includedLineCounts.borrowable} 句 · 不建议 {includedLineCounts.notBorrowable} 句 ·
            还需检查 {samples.length - decidedCount} 段
          </span>
        </div>
        <FileUpload
          accept=".csv,.xlsx,.json"
          label="＋ 放入企微聊天"
          onUpload={(name) => {
            const nextId = `UPLOAD-${String(uploadedSamples.length + 1).padStart(3, "0")}`;
            setUploadedSamples((current) => [[nextId, `${name}｜刚上传`, "到店（随文件读出）", "客户隐私已自动遮住，等待逐句检查"], ...current]);
            notify(`${name} 已放入；客户隐私已遮挡，实际结果已从文件读出，新记录在列表第一条`);
          }}
        />
        <Button disabled={!allDecided || confirmedCount === 0} kind="primary" onClick={() => notify(`已确认学习 ${includedLineCounts.borrowable} 句销售回复；${includedLineCounts.notBorrowable} 句不参与学习`)}>{!allDecided ? `还要检查 ${samples.length - decidedCount} 段` : confirmedCount === 0 ? "没有可学习的聊天，请重新检查" : `确认学习 ${includedLineCounts.borrowable} 句回复`}</Button>
      </div>
      <p className="champion-default-note">打开聊天后，销售回复默认“可借鉴”；只需把不妥的句子改为“不建议借鉴”。客户原话不会作为销售话术。</p>
      <div className="sample-table">
        <div><b>编号</b><b>客户情况</b><b>实际结果</b><b>标注结果</b><b>操作</b></div>
        {samples.map((row) => {
          const sampleName = row[0];
          const decision = workflowMemory.championDecisions[sampleName];
          const lineCounts = championLineCounts(row[0]);
          const lineDecisions = workflowMemory.championLineDecisions[row[0]] ?? {};
          return (
            <div key={row[0]}>
              <span>{sampleName}</span>
              <span>{row[1]}</span>
              <Pill tone={row[2].startsWith("到店") ? "positive" : "neutral"}>{row[2]}</Pill>
              <span>
                {decision === "included"
                  ? `${lineCounts.borrowable} 句可借鉴 · ${lineCounts.notBorrowable} 句不建议`
                  : decision === "excluded"
                    ? "整段已排除"
                    : row[3]}
              </span>
              <button
                onClick={() => goTo("sales-champion-detail", {
                  conversationId: row[0],
                  customerName: row[1],
                  lineDecisions: JSON.stringify(lineDecisions),
                  outcome: row[2],
                  sampleName,
                })}
              >
                {decision === "included" ? "已标注 · 查看 ›" : decision === "excluded" ? "已排除 · 查看 ›" : "逐句检查 ›"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimulationScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [current, setCurrent] = useState(68);
  const criteria = ["有没有听懂客户", "回答是否符合门店资料", "有没有乱承诺", "有没有自然推进下一步"];
  const [scores, setScores] = useState<Record<string, number>>({});
  const [rewrite, setRewrite] = useState("");
  const allScored = criteria.every((item) => Boolean(scores[item]));
  const hasLowScore = criteria.some((item) => (scores[item] ?? 5) < 3);
  const canSave = allScored && (!hasLowScore || rewrite.trim().length >= 12);
  const finished = current >= 100;
  return (
    <div className="simulation-layout">
      <Card title={finished ? "100 题练习已完成" : `当前练习：第 ${current + 1} 题`} caption={finished ? "可以返回检查机器人的说话规则" : "客户询问报价，并希望周末到店"} className="simulation-chat">
        <div className="chat customer"><b>客户</b><p>我家 118㎡，预算 15 万，周末能过去看看。你们 568 元/㎡活动还在吗？</p></div>
        <div className="chat robot"><b>机器人准备发送</b><p>活动仍在有效期。为了给您安排更合适的设计师，想先确认您更偏奶油风还是原木风？周六下午目前还有 2 个接待名额。</p></div>
        <div className="score-legend"><b>怎么打分</b><span>1 分＝明显有问题　3 分＝基本可用　5 分＝可以直接发给客户</span></div>
        <div className="score-grid">
          {criteria.map((item) => <label key={item}><span>{item}</span><div>{[1,2,3,4,5].map((n) => <button aria-label={`${item} ${n} 分`} className={n === scores[item] ? "active" : ""} disabled={finished} key={n} onClick={() => setScores((currentScores) => ({ ...currentScores, [item]: n }))}>{n}</button>)}</div></label>)}
        </div>
        <label className="rewrite-answer">
          <span>{hasLowScore ? "有 2 分或以下：请写出正确回答（必填）" : "如果有低分，请写出你希望机器人怎么说"}</span>
          <textarea aria-label="正确回答" disabled={finished} onChange={(event) => setRewrite(event.target.value)} placeholder="例如：活动还在。周六下午龙文店还有 2 个接待名额……" value={rewrite} />
        </label>
        {!canSave && !finished && <p className="form-hint">先给四项都打分；如有 2 分或以下，还要写出正确回答。</p>}
        <div className="button-row"><Button onClick={() => goTo("sales-simulation-detail", { exerciseNumber: String(Math.min(100, current + 1)) })}>查看评分理由和正确写法</Button><Button disabled={!canSave || finished} onClick={() => notify(`当前进度已保存，下次从第 ${current + 1} 题继续`)}>保存，稍后继续</Button><Button disabled={!canSave || finished} kind="primary" onClick={() => { setCurrent((value) => Math.min(100, value + 1)); setScores({}); setRewrite(""); notify(current === 99 ? "第 100 题已保存，练习全部完成" : "四项评分和正确回答已保存，进入下一题"); }}>保存并下一题</Button></div>
      </Card>
      <Card title="练习进度" caption="可随时保存，分几次完成" className="simulation-progress">
        <strong>{current} / 100</strong><Progress value={current} />
        <div className="mini-stats"><span><b>{current}</b> 已完成</span><span><b>17</b> 已改正</span><span><b>{100 - current}</b> 还剩</span></div>
        <Pill tone={finished ? "positive" : "warning"}>{finished ? "全部完成" : "先完成容易乱报价格和名额的练习"}</Pill>
      </Card>
    </div>
  );
}

function PromptScreen({ notify }: Pick<ScreenProps, "notify">) {
  const initialText = `角色：你是“有大有小｜漳州全屋定制”的专业销售顾问。

目标：自然地帮助客户说清需求，再邀请合适的客户到店。

说话和做事规则：
1. 先确认户型、地址、预算和风格，再提供建议。
2. 价格、活动名额和门店地址只有在已确认资料里找到时才能说。
3. 报价按“基础 / 品质 / 高配”三档解释，不能编造折扣。
4. 客户明确拒绝、投诉或提出复杂施工问题时，立即交给真人销售。
5. 表达专业、简洁、不压迫；每次只问一个关键问题。
6. 只收集服务所需信息，不询问与装修无关的客户隐私。`;
  const [appliedText, setAppliedText] = useState(initialText);
  const [text, setText] = useState(initialText);
  const hasEnoughContent = text.trim().length >= 40;
  const checks = [
    {
      label: "价格只能使用已确认资料",
      passed: /价格|报价/.test(text) && /资料|价格表/.test(text) && /才能|不能|不得|只/.test(text),
    },
    {
      label: "活动名额只能使用门店资料",
      passed: /活动/.test(text) && /名额/.test(text) && /资料|接待表/.test(text),
    },
    {
      label: "不会强迫客户到店",
      passed: /不压迫|不强迫|尊重客户|客户自愿/.test(text),
    },
    {
      label: "写清楚什么时候交给真人",
      passed: /真人|人工/.test(text) && /拒绝|投诉|复杂|不确定/.test(text),
    },
    {
      label: "不会多收集客户隐私",
      passed: /隐私/.test(text) && /不询问|不收集|只收集必要|服务所需/.test(text),
    },
  ];
  const missingChecks = checks.filter((item) => !item.passed);
  const allChecksPassed = missingChecks.length === 0;
  const hasChanges = text !== appliedText;
  const canSubmit = hasEnoughContent && allChecksPassed && hasChanges;
  return (
    <div className="prompt-layout">
      <Card title="直接修改机器人说话规则" caption="在输入框里改好后，直接提交；不需要先加规则或试聊" className="prompt-editor">
        <div className="prompt-toolbar"><Pill tone={hasChanges ? "warning" : "positive"}>{hasChanges ? "有修改，尚未提交" : "当前规则已应用"}</Pill><span>只影响提交后的新客户回复</span></div>
        <textarea value={text} onChange={(event) => setText(event.target.value)} aria-label="机器人说话规则" />
        <div className="button-row">
          <Button
            disabled={!canSubmit}
            kind="primary"
            onClick={() => {
              setAppliedText(text);
              notify("规则已提交；将用于之后的新客户回复");
            }}
          >
            {!hasEnoughContent ? "规则至少保留 40 个字" : !allChecksPassed ? `先补齐 ${missingChecks.length} 项安全规则` : hasChanges ? "提交并应用" : "当前规则已提交"}
          </Button>
        </div>
        {!hasEnoughContent && <p className="form-hint">规则不能为空。至少写清“能做什么、不能承诺什么、什么时候交给真人”。</p>}
      </Card>
      <Card title="提交前检查" caption="缺少任何一项都会直接指出，不会只按字数判定" className="rule-checks">
        {checks.map((item) => <div key={item.label}><span>{item.passed ? "✓" : "—"}</span>{item.label}</div>)}
        <div className="rule-warning"><b>{allChecksPassed ? "检查通过" : `还缺 ${missingChecks.length} 项`}</b><p>{allChecksPassed ? "可以直接提交并应用。" : `请在左侧补充：${missingChecks.map((item) => item.label).join("、")}。`}</p></div>
      </Card>
    </div>
  );
}

function MetricsScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  const [day, setDay] = useState("今天 7/31");
  const cards = [["新增企微", "128", "比昨天多 14 人"], ["有效对话", "96", "75% 有效"], ["明确需求", "74", "58% 已说清"], ["预约到店", "18", "7 人尚未到店"], ["实际到店", "11", "比昨天多 3 人"]];
  return (
    <div className="stack">
      <div className="filter-bar"><div className="segmented">{["今天 7/31", "昨天 7/30", "近 7 天"].map((item) => <button className={day === item ? "active" : ""} key={item} onClick={() => setDay(item)}>{item}</button>)}</div><span>数据更新至今天 15:20</span><Button onClick={() => notify(`${day}接待结果链接已复制`)}>分享给店员</Button></div>
      <div className="metric-cards">{cards.map(([label,value,change]) => <Card key={label} className="metric-card"><span>{label}</span><strong>{value}</strong><small>{change}</small></Card>)}</div>
      <div className="action-alert"><div><b>今天最值得先处理</b><span>有 23 条机器人聊天等待店长检查，其中 3 条回复可能有错误。</span></div><Button kind="primary" onClick={() => goTo("sales-quality")}>检查这 23 条聊天</Button></div>
      <div className="dashboard-grid">
        <Card title="从新增企微到实际到店" caption="每一步人数使用同一统计时间">
          <div className="funnel">{[["新增企微",128,100],["有效对话",96,75],["明确需求",74,58],["预约到店",18,14],["实际到店",11,9]].map(([label,value,width]) => <div key={String(label)} style={{width:`${width}%`}}><span>{label}</span><b>{value}</b></div>)}</div>
        </Card>
        <Card title="机器人今天答得怎么样" caption="演示今天聊天的统计结果；下一页可查看问题聊天">
          <div className="quality-bars">{[["回答符合门店资料",94],["听懂客户需求",91],["没有乱承诺",98],["自然推进下一步",76],["说话像真人顾问",87]].map(([label,value]) => <div key={String(label)}><span>{label}</span><b>{value}%</b><Progress value={Number(value)} /></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

function QualityScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [selected, setSelected] = useState(0);
  const customer = conversations[selected];
  const isHighRisk = customer[4] === "回复可能有错误";
  const currentDecision = workflowMemory.salesConversationStatuses[customer[0]] || "";
  const handedOff = currentDecision.startsWith("已交给");
  const defaultReviewNote = isHighRisk
    ? "错误：门店资料里没有 500 元价格，不能承诺折扣；应转给销售人工核价。"
    : "建议始终使用“登记到店意向”，不要说“临时保留名额”。";
  const reviewNote = workflowMemory.salesReviewNotes[customer[0]] ?? defaultReviewNote;
  const reviewNoteReady = reviewNote.trim().length >= 6;
  const conversation = isHighRisk
    ? [
      ["客户", "别家说还能便宜，你们最低能不能做到 500 元一平方？"],
      ["机器人", "可以，我帮您申请 500 元一平方，今天定就能保留。"],
      ["店长提示", "这句话没有价格表依据，还擅自保证折扣，不能判为合格。"],
    ]
    : customer[0] === "张女士"
      ? [
        ["客户", "我在漳浦，能免费上门量房吗？"],
        ["机器人", "这个地址不在当前自动确认范围内，我先让销售核对是否能安排，不先向您保证。"],
        ["店长提示", "没有越过服务地区作承诺，处理正确。"],
      ]
      : [
        ["客户", `我家 118㎡，预算 15 万，周末能过去看看。我是${customer[0]}。`],
        ["机器人", "可以。为了安排更合适的设计师，您更偏奶油风还是原木风？"],
        ["客户", "原木风。活动 568 元/㎡，周末还有名额吗？"],
        ["机器人", "活动仍在有效期，周六下午还有 2 个接待名额。我先为您登记 15:00 到店意向。"],
      ];
  return (
    <div className="quality-layout">
      <Card title="先看最需要店长处理的聊天" caption="待检查 23 · 机器人回复可能有错误 3" className="conversation-list">
        {conversations.map((row, index) => (
          <button className={selected === index ? "conversation-item selected" : "conversation-item"} onClick={() => setSelected(index)} key={row[0]}>
            <div><b>{row[0]}　到店意向 {Number(row[1]) >= 85 ? "高" : "中"}（{row[1]}/100）</b><small>{row[3]}</small></div><span>{row[2]}</span><em>{workflowMemory.salesConversationStatuses[row[0]] || row[4]}　点击查看</em>
          </button>
        ))}
      </Card>
      <Card title={`${customer[0]}｜到店意向 ${customer[1]}/100`} action={<Pill tone={handedOff ? "info" : isHighRisk ? "warning" : "positive"}>{currentDecision || customer[4]}</Pill>} className="quality-detail">
        {conversation.map(([speaker, copy], index) => <div className={`chat ${speaker === "客户" ? "customer" : speaker === "机器人" ? "robot" : "review-tip"}`} key={`${speaker}-${index}`}><b>{speaker}</b><p>{copy}</p></div>)}
        <div className="review-box"><b>店长检查</b><span>{isHighRisk ? "听懂客户 4/5　回答有依据 1/5　没有乱承诺 1/5　自然推进 2/5" : "听懂客户 5/5　回答有依据 5/5　没有乱承诺 5/5　自然推进 4/5"}</span><textarea aria-label="检查意见" onChange={(event) => { workflowMemory.salesReviewNotes[customer[0]] = event.target.value; publishWorkflowChange(); }} value={reviewNote} /><small>{reviewNoteReady ? "检查意见已写清，可以保存处理结果。" : "请写至少 6 个字，说明哪里正确或哪里需要改。"}</small></div>
        <div className="button-row">
          <Button disabled={isHighRisk || handedOff || !reviewNoteReady} kind="primary" onClick={() => { workflowMemory.salesReviewNotes[customer[0]] = reviewNote.trim(); workflowMemory.salesConversationStatuses[customer[0]] = "店长已检查，回答合格"; dispatchSalesConversationStatus(customer[0]); publishWorkflowChange(); setSelected((value) => (value + 1) % conversations.length); notify("已标为合格，检查意见已保存，现已切换到下一条聊天"); }}>{handedOff ? "已交给真人，不再判自动回复" : isHighRisk ? "这条有明显错误，不能判为合格" : !reviewNoteReady ? "先写至少 6 个字的检查意见" : "合格，查看下一条"}</Button>
          <Button disabled={!reviewNoteReady} onClick={() => goTo("sales-conversation-detail", { customerName: customer[0], intentScore: customer[1], issue: customer[2], currentStatus: currentDecision })}>{reviewNoteReady ? "标记问题并查看完整聊天" : "写清检查意见后再标记问题"}</Button>
          <Button disabled={handedOff || !reviewNoteReady} onClick={() => { workflowMemory.salesReviewNotes[customer[0]] = reviewNote.trim(); workflowMemory.salesConversationStatuses[customer[0]] = "已交给王顾问 · 今天 18:00 前"; dispatchSalesConversationStatus(customer[0]); publishWorkflowChange(); notify(`已创建任务：由王顾问今天 18:00 前跟进${customer[0]}；店长检查意见已一起保存`); }}>{handedOff ? currentDecision : !reviewNoteReady ? "先写检查意见，再交给真人" : "交给真人销售"}</Button>
        </div>
      </Card>
    </div>
  );
}

function FaqScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const faqs = [
    ["全屋定制怎么报价？", "82", "76%", "待优化", "价格"],
    ["568 元/㎡包含哪些内容？", "74", "91%", "已优化", "活动"],
    ["用什么板材？环保吗？", "67", "84%", "待优化", "材料"],
    ["多久可以安装完成？", "51", "72%", "待优化", "工期"],
    ["可以免费量房吗？", "46", "95%", "已优化", "服务"],
    ["漳州哪些区域可以上门？", "39", "98%", "已优化", "区域"],
    ["活动还有名额吗？", "34", "88%", "需连接每日接待表", "活动"],
  ];
  return (
    <div className="stack">
      <div className="filter-bar"><b>近 7 天客户常问问题</b><span>默认先显示“问得多、客户满意度又低”的问题</span><Button onClick={() => notify("已按最值得先处理排序")}>按最值得先处理排序</Button></div>
      <div className="faq-table">
        <div><b>问题</b><b>提问次数</b><b>满意度</b><b>分类</b><b>状态</b><b>操作</b></div>
        {faqs.map((row) => {
          const saved = workflowMemory.faqDetails[row[0]];
          const status = saved?.status ?? row[3];
          return <div key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><span>{row[2]}</span><Pill>{row[4]}</Pill><Pill tone={status === "已优化" || status.includes("发布") ? "positive" : "warning"}>{status}</Pill><button onClick={() => goTo("sales-faq-detail", { question: row[0], frequency: row[1], satisfaction: row[2], currentAnswer: saved?.answer ?? "", currentBoundary: saved?.boundary ?? "", currentSource: saved?.source ?? "", currentStatus: status })}>修改并试答 ›</button></div>;
        })}
      </div>
    </div>
  );
}

const plugins = [
  ["1", "户型图 + 风格方案", "客户发送户型图与风格后，自动返回同户型案例与初步布局", "使用中", "1,284"],
  ["2", "自动报价详细方案", "识别面积与户型，使用门店价格表生成三档报价明细", "未启用", "628"],
  ["3", "免费上门量房", "收集预算与地址，确认服务范围后预约免费量房和方案", "使用中", "416"],
  ["4", "风格选择题", "信息不足时发送效果图选择题，帮助客户说清风格偏好", "未启用", "—"],
];

function pluginStatusLabel(status: string, hasUnappliedDraft: boolean) {
  if (!hasUnappliedDraft) return status;
  if (status === "使用中") return "使用中 · 有未应用草稿";
  if (status === "未启用") return "未启用 · 草稿已保存";
  if (status === "已暂停") return "已暂停 · 草稿已保存";
  return `${status} · 草稿已保存`;
}

function PluginCenterScreen({ notify }: Pick<ScreenProps, "notify">) {
  useWorkflowBridge();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [configIndex, setConfigIndex] = useState<number | null>(null);
  const customerPreviews = [
    "客户上传户型图并选“原木风”后，会先收到同户型案例和一份初步布局说明；资料不够时只追问，不直接报价。",
    "客户给出面积和户型后，会看到基础、常用、升级三档估算，并清楚区分包含项和另计项；最终价格仍需门店核价。",
    "客户留下小区和预算后，会先核对服务区域与当天剩余名额，再给出 3 个可选量房时间；不会先保证一定有名额。",
    "客户说不清风格时，会收到 6 张效果图选择题；选完后机器人只总结偏好，不把效果图当成本店真实案例。",
  ];

  function openSettings(index: number) {
    setPreviewIndex(null);
    setConfigIndex(index);
    notify(`已在本页下方打开“${plugins[index][1]}”设置表`);
  }

  return (
    <div className="stack">
      <div className="plugin-grid">
        {plugins.map(([letter,title,description,status,count], index) => {
          const currentStatus = workflowMemory.pluginStates[title] ?? status;
          const hasUnappliedDraft = workflowMemory.pluginDraftNeedsApply.has(title);
          const statusLabel = pluginStatusLabel(currentStatus, hasUnappliedDraft);
          return (
          <Card className="plugin-card" key={letter}>
            <div className="plugin-letter">{letter}</div><Pill tone={hasUnappliedDraft || currentStatus.includes("还差") ? "warning" : currentStatus === "使用中" ? "positive" : "neutral"}>{statusLabel}</Pill>
            <h3>{title}</h3><p>{description}</p>
            <div className="plugin-stats"><span>近 30 天自动处理</span><strong>{count} 次</strong></div>
            <div className="button-row">
              <Button onClick={() => { setConfigIndex(null); setPreviewIndex((current) => current === index ? null : index); notify(previewIndex === index ? "客户预览已收起" : `已在下方打开“${title}”的客户预览`); }}>{previewIndex === index ? "收起客户预览" : "看客户会收到什么"}</Button>
              <Button
                kind={configIndex === index || index === 3 ? "primary" : "default"}
                onClick={() => openSettings(index)}
              >
                {configIndex === index ? "设置表已打开" : index === 3 ? "设置并启用" : "设置此功能"}
              </Button>
            </div>
          </Card>
          );
        })}
      </div>
      {previewIndex !== null && (
        <Card title={`客户预览｜${plugins[previewIndex][1]}`} caption="模拟客户看到的内容；不会发送给真实客户">
          <div className="message-preview">
            <small>机器人准备发送给客户的说明</small>
            <p>{customerPreviews[previewIndex]}</p>
            <span>演示预览 · 发送前仍按门店资料和安全规则检查</span>
          </div>
          <div className="button-row"><Button kind="primary" onClick={() => openSettings(previewIndex)}>这个预览可以，打开设置表</Button><Button onClick={() => setPreviewIndex(null)}>收起预览</Button></div>
        </Card>
      )}
      {configIndex !== null && (
        <PluginConfigScreen
          key={plugins[configIndex][1]}
          notify={notify}
          onClose={() => {
            setConfigIndex(null);
            notify("设置表已收起；已保存或已启用的内容会继续保留");
          }}
          pluginIndex={configIndex}
        />
      )}
    </div>
  );
}

function PluginConfigScreen({
  notify,
  onClose,
  pluginIndex,
}: {
  notify: (message: string) => void;
  onClose: () => void;
  pluginIndex: number;
}) {
  useWorkflowBridge();
  const plugin = plugins[pluginIndex];
  const setup = [
    {
      missingInfo: "缺少户型图或风格时：继续追问，不自动生成方案。",
      needsPriceTable: false,
      needsServiceRegion: false,
      rules: ["客户已经发送户型图", "客户已经说明或选择喜欢的风格"],
      tests: ["户型图和风格齐全：正确启动", "缺少户型图：继续追问", "风格还不明确：先发选择题", "资料互相矛盾：交给真人"],
    },
    {
      missingInfo: "信息不全时：继续追问，不自动报价。",
      needsPriceTable: true,
      needsServiceRegion: false,
      rules: ["客户已经提供面积", "客户已经提供户型", "客户主动询问价格"],
      tests: ["资料齐全：正确报价", "缺少面积：继续追问", "价格表失效：停止报价", "客户要求最终价：交给真人"],
    },
    {
      missingInfo: "地址或名额不清楚时：继续追问，不承诺上门时间。",
      needsPriceTable: false,
      needsServiceRegion: true,
      rules: ["客户已经提供所在小区或地址", "地址位于门店服务范围", "当天仍有可预约时间"],
      tests: ["地址和名额都符合：给出可约时间", "缺少地址：继续追问", "地址超出范围：说明服务范围", "当天没有名额：不承诺并交给真人"],
    },
    {
      missingInfo: "客户偏好还不清楚时：继续让客户选择，不猜测风格。",
      needsPriceTable: false,
      needsServiceRegion: false,
      rules: ["客户还没有说清喜欢的风格", "只总结客户选择，不把示例图当成本店案例"],
      tests: ["偏好不清：发送选择题", "选择完成：总结风格偏好", "示例图被当作真实案例：已阻止", "客户已有明确风格：不重复发送"],
    },
  ][pluginIndex];
  const safetyRules = setup.rules;
  const initialPluginName = plugin[1];
  const initialDraft = workflowMemory.pluginDrafts[initialPluginName];
  const [rulesChecked, setRulesChecked] = useState<boolean[]>(initialDraft?.rulesChecked ?? safetyRules.map(() => true));
  const [testAttempted, setTestAttempted] = useState(false);
  const initialStatus = workflowMemory.pluginStates[initialPluginName] ?? plugin[3];
  const [enabled, setEnabled] = useState(initialStatus === "使用中");
  const [draftDirty, setDraftDirty] = useState(workflowMemory.pluginDraftNeedsApply.has(initialPluginName));
  const draftReady = useRef(false);
  const [storeName, setStoreName] = useState(initialDraft?.storeName ?? "漳州龙文店");
  const [serviceRegion, setServiceRegion] = useState(initialDraft?.serviceRegion ?? (setup.needsServiceRegion ? "漳州龙文区、芗城区" : "不适用"));
  const [priceTable, setPriceTable] = useState(initialDraft?.priceTable ?? (setup.needsPriceTable ? "价格表 2026.07" : "不适用"));
  const [customerMessage, setCustomerMessage] = useState(initialDraft?.customerMessage ?? messageForPlugin(pluginIndex));
  const allSafetyRulesOn = rulesChecked.every(Boolean);
  const storeAndRegionMatch = (storeName.includes("漳州") && serviceRegion.includes("漳州"))
    || (storeName.includes("厦门") && serviceRegion.includes("厦门"));
  const testFailures = [
    !allSafetyRulesOn ? "有安全规则被关闭" : "",
    !storeName ? "还没有选择门店" : "",
    setup.needsServiceRegion && !serviceRegion ? "还没有选择服务区域" : "",
    setup.needsServiceRegion && storeName && serviceRegion && !storeAndRegionMatch ? "所选门店与服务区域不一致" : "",
    setup.needsPriceTable && !priceTable ? "还没有选择价格表" : "",
    customerMessage.trim().length < 20 ? "客户看到的说明太短，请写清楚会回答什么和什么时候交给真人" : "",
  ].filter(Boolean);
  const tested = testAttempted && testFailures.length === 0;

  useEffect(() => {
    if (!draftReady.current) {
      draftReady.current = true;
      return;
    }
    workflowMemory.pluginDrafts[plugin[1]] = {
      customerMessage,
      priceTable,
      rulesChecked: [...rulesChecked],
      serviceRegion,
      storeName,
    };
    workflowMemory.pluginDraftNeedsApply.add(plugin[1]);
    publishWorkflowChange();
  }, [customerMessage, plugin, priceTable, rulesChecked, serviceRegion, storeName]);

  function resetTest() {
    setTestAttempted(false);
    setDraftDirty(true);
  }

  function messageForPlugin(index: number) {
    return index === 1
      ? "根据最新价格表生成基础 / 品质 / 高配三档估算，列清包含项和可选项；资料不足时先追问。"
      : index === 2
        ? "先检查客户地址和可预约人数，再给出 3 个可选上门时间；不确定时交给真人。"
        : plugins[index][2];
  }

  return (
      <Card
        title={`设置：${plugin[1]}`}
        caption="修改会自动保存为草稿；用 4 个示例试运行，通过后即可启用或更新"
        className="config-form"
        action={<Button onClick={onClose}>收起设置表</Button>}
      >
        {draftDirty && <div className="rule-box"><b>这份草稿还没有应用</b><p>{enabled ? "真实客户仍使用上一版。先用 4 个示例试运行，通过后再点“确认结果后更新设置”。" : "这个功能目前没有使用这份草稿。先试运行，通过后才能启用。"}</p></div>}
        <fieldset className="condition-list">
          <legend>什么时候可以启动</legend>
          {safetyRules.map((item, index) => <label className="toggle-line" key={item}><input checked={rulesChecked[index]} onChange={() => { setRulesChecked((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value)); resetTest(); }} type="checkbox" />{item}</label>)}
        </fieldset>
        <div className="rule-box"><b>信息不够时怎么办</b><p>{setup.missingInfo}</p></div>
        <div className="source-selects">
          <label><span>使用哪家门店</span><select value={storeName} onChange={(event) => { setStoreName(event.target.value); resetTest(); }}><option value="">请选择门店</option><option>漳州龙文店</option><option>厦门湖里店</option></select></label>
          {setup.needsServiceRegion && <label><span>服务哪些区域</span><select value={serviceRegion} onChange={(event) => { setServiceRegion(event.target.value); resetTest(); }}><option value="">请选择服务区域</option><option>漳州龙文区、芗城区</option><option>厦门湖里区、思明区</option></select></label>}
          {setup.needsPriceTable && <label><span>使用哪份价格表</span><select value={priceTable} onChange={(event) => { setPriceTable(event.target.value); resetTest(); }}><option value="">请选择价格表</option><option>价格表 2026.07</option></select></label>}
        </div>
        <label><span>客户会看到什么</span><textarea onChange={(event) => { setCustomerMessage(event.target.value); resetTest(); }} value={customerMessage} /></label>
        {testAttempted && <div className={`test-results ${tested ? "" : "has-failure"}`}>{tested
          ? setup.tests.map((item) => <span key={item}>✓ {item}</span>)
          : testFailures.map((item) => <span key={item}>× {item}</span>)}
        </div>}
        <div className="button-row">
          <Button onClick={() => { setTestAttempted(true); notify(testFailures.length === 0 ? "4 个示例已试运行，结果全部符合预期" : `试运行未通过：${testFailures[0]}`); }}>用 4 个示例试运行</Button>
          {enabled && <Button kind="danger" onClick={() => { setEnabled(false); setDraftDirty(true); setTestAttempted(false); workflowMemory.pluginStates[plugin[1]] = "已暂停"; workflowMemory.pluginDraftNeedsApply.add(plugin[1]); publishWorkflowChange(); notify(`${plugin[1]}已暂停；新的客户会话不会再自动使用，重新启用前需再次试运行`); }}>暂停这个自动接待功能</Button>}
          {(!enabled || draftDirty) && <Button disabled={!tested} kind="primary" onClick={() => { const wasLive = (workflowMemory.pluginStates[plugin[1]] ?? plugin[3]) === "使用中"; workflowMemory.pluginDrafts[plugin[1]] = { customerMessage, priceTable, rulesChecked: [...rulesChecked], serviceRegion, storeName }; setEnabled(true); setDraftDirty(false); workflowMemory.pluginStates[plugin[1]] = "使用中"; workflowMemory.pluginDraftNeedsApply.delete(plugin[1]); publishWorkflowChange(); notify(`${plugin[1]}已${wasLive ? "更新" : "启用"}；只影响新的客户会话，可随时暂停`); }}>{enabled ? "确认结果后更新设置" : "确认结果后启用"}</Button>}
        </div>
      </Card>
  );
}

function ActivitiesScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [posterName, setPosterName] = useState("尚未上传");
  const [saved, setSaved] = useState(false);
  const [draftName, setDraftName] = useState("周末量房体验日");
  const [draftPeriod, setDraftPeriod] = useState("2026.08.08 — 2026.08.09");
  const [draftBenefit, setDraftBenefit] = useState("免费上门测量 + 初步平面方案；两天合计最多服务 10 户。");
  const [draftInventory, setDraftInventory] = useState("10");
  const [draftAudience, setDraftAudience] = useState("已发户型图、预算 10 万以上、还未到店");
  const [submittedActivity, setSubmittedActivity] = useState<string[] | null>(null);
  const baseActivities = [
    ["暑期焕新季", "2026.07.15–08.15", "568 元/投影㎡ · 20 个到店名额", "可使用（8 月 15 日结束）", "128", "18"],
    ["免费量房周", "2026.08.01–08.07", "免费上门量房 + 初步方案", "8 月 1 日开始", "0", "6"],
    ["ENF 板材公开课", "2026.07.18–07.31", "到店看样 + 环保检测讲解", "今天结束", "74", "12"],
    ["老客户转介绍", "长期", "成功到店赠保养服务", "可使用（长期）", "53", "20"],
  ];
  const activities = submittedActivity ? [submittedActivity, ...baseActivities] : baseActivities;
  const duplicateName = baseActivities.some((row) => row[0] === draftName.trim());
  const draftInventoryValid = /^\d+$/.test(draftInventory.trim()) && Number(draftInventory) > 0;
  const draftComplete = !duplicateName && draftInventoryValid && draftName.trim().length >= 4 && draftPeriod.trim().length >= 8 && draftBenefit.trim().length >= 10 && draftAudience.trim().length >= 6;
  return (
    <div className="activities-layout">
      <Card title="把一个真实活动加进来" caption="补全时间、权益、名额和海报后，保存为可用活动" className="activity-form">
        <label><span>活动名称</span><input onChange={(event) => { setDraftName(event.target.value); setSaved(false); }} value={draftName} /></label>
        <label><span>客户在哪段时间可以参加</span><input onChange={(event) => { setDraftPeriod(event.target.value); setSaved(false); }} value={draftPeriod} /></label>
        <label><span>客户实际能得到什么</span><textarea onChange={(event) => { setDraftBenefit(event.target.value); setSaved(false); }} value={draftBenefit} /></label>
        <label><span>当前还剩多少个名额</span><input min="1" onChange={(event) => { setDraftInventory(event.target.value); setSaved(false); }} type="number" value={draftInventory} /></label>
        <label><span>哪些客户可以收到</span><input onChange={(event) => { setDraftAudience(event.target.value); setSaved(false); }} value={draftAudience} /></label>
        <div className="upload-row">
          <FileUpload accept="image/*" label="上传活动海报" onUpload={(name) => { setPosterName(name); setSaved(false); notify(`${name} 已上传；提交前请核对海报文字`); }} />
          <span>当前海报：{posterName}</span>
        </div>
        <div className="poster-mini"><span>{draftName || "活动名称待填写"}</span><b>{draftBenefit || "活动权益待填写"}</b><small>演示海报预览 · 以页面保存的时间、权益和名额为准</small></div>
        <div className="button-row">
          <Button disabled={!draftComplete} onClick={() => { setSaved(true); notify("活动已保存为草稿，不会发给真实客户"); }}>{draftComplete ? "保存草稿" : duplicateName ? "名称已存在，请换一个" : !draftInventoryValid ? "剩余名额要填大于 0 的整数" : "先补全名称、时间、权益和客户范围"}</Button>
          <Button disabled={!saved || posterName === "尚未上传"} kind="primary" onClick={() => { setSubmittedActivity([draftName.trim(), draftPeriod.trim(), draftBenefit.trim(), "可使用", "0", draftInventory.trim()]); notify("活动已保存为可使用；每次生成消息前仍会检查日期和剩余名额"); }}>保存并设为可使用</Button>
        </div>
        {duplicateName && <p className="form-hint">“{draftName.trim()}”已经在右侧列表里。请直接核对原活动，或换一个不会混淆的新名称。</p>}
      </Card>
      <Card title="已经录入的活动" caption="点详情可核对日期、权益和剩余名额，也可以立即停用" className="activity-list">
        {activities.map((row) => {
          const update = workflowMemory.activityUpdates[row[0]];
          const period = update?.period || row[1];
          const benefit = update?.benefit || row[2];
          const status = update?.status === "已停用"
            ? "已停用，不会再生成消息"
            : update?.status === "可使用"
              ? `已核对，可使用${update.inventory ? `（剩余 ${update.inventory} 个名额）` : ""}`
              : update?.status === "待开始"
                ? `已核对，等待开始日期${update.inventory ? `（计划名额 ${update.inventory} 个）` : ""}`
              : row[3];
          return <article key={row[0]}><div><b>{row[0]}</b><span>{period}</span><small>{benefit}</small></div><Pill tone={status.startsWith("已核对") || status.startsWith("可使用") ? "positive" : status.startsWith("已停用") ? "danger" : "warning"}>{status}</Pill><strong>已发 {row[4]} 人</strong><button onClick={() => goTo("recall-activity-detail", { activityName: row[0], activityPeriod: period, activityBenefit: benefit, activitySentCount: row[4], currentInventory: update?.inventory ?? row[5] ?? "", currentStatus: update?.status ?? "" })}>核对详情 ›</button></article>;
        })}
      </Card>
    </div>
  );
}

function RecallMetricsScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [period, setPeriod] = useState("近 30 天");
  const poorContentCustomer = customers.find((row) => row[0] === "王女士") ?? customers[0];

  function openPoorContentCustomer() {
    const customerName = poorContentCustomer[0];
    const stopped = workflowMemory.stoppedCustomers.has(customerName);
    goTo("recall-customer-detail", {
      customerName,
      renovationStage: poorContentCustomer[1],
      contactStage: poorContentCustomer[2],
      priorityScore: poorContentCustomer[3],
      nextAction: stopped
        ? "自动联系已停止，保留客户记录"
        : poorContentCustomer[4],
      nextTime: stopped ? "已停止" : poorContentCustomer[5],
      currentStatus: stopped ? "stopped" : "active",
    });
  }

  return (
    <div className="stack">
      <div className="filter-bar"><div className="segmented">{["近 7 天", "近 30 天"].map((item) => <button className={period === item ? "active" : ""} key={item} onClick={() => setPeriod(item)}>{item}</button>)}</div><span>{period} · 数据更新至今天 15:20</span><Button onClick={() => notify(`${period}沉默客户跟进结果链接已复制`)}>分享给店员</Button></div>
      <div className="metric-cards">{[["正在自动跟进","386","比上期多 28 人"],["消息成功送达","98.7%","每 100 条约 99 条送达"],["客户有回复","30.9%","每 100 人约 31 人回复"],["预约量房","28","其中 16 人已到店"],["实际到店","16","比上期多 5 人"]].map(([l,v,c]) => <Card className="metric-card" key={l}><span>{l}</span><strong>{v}</strong><small>{c}</small></Card>)}</div>
      <div className="dashboard-grid">
        <Card title="第几次联系最容易收到回复" caption="不是要求发满 7 次；客户一回复、拒绝或成交就会停止">
          <div className="touch-chart">{[18,26,43,38,27,19,11].map((value,index) => <div key={index}><span style={{height:`${value*3}px`}} /><b>第{index+1}次</b><small>{value}%</small></div>)}</div>
        </Card>
        <Card title="发什么内容更容易收到回复" caption={`${period}内，收到内容后 3 天内回复的客户比例`}>
          <div className="content-ranking">{[["同小区案例","42.6%","positive"],["预算怎么分","36.8%","info"],["免费量房券","34.1%","warning"],["板材环保知识","29.7%","info"],["活动海报","18.2%","danger"]].map(([label,value,tone],index) => <div key={label}><i>{index+1}</i><span>{label}</span><b>{value}</b><Pill tone={tone as "positive"}>{index < 2 ? "优先使用" : index === 4 ? "减少使用" : "继续观察"}</Pill></div>)}</div>
          <div className="button-row"><Button kind="primary" onClick={() => goTo("recall-pool")}>查看正在跟进的客户</Button><Button onClick={openPoorContentCustomer}>查看收到“活动海报”的客户示例</Button></div>
        </Card>
      </div>
    </div>
  );
}

function RecallPoolScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [sort, setSort] = useState("优先分从高到低");
  const [query, setQuery] = useState("");
  const scheduleRank = (value: string) => value.startsWith("今天") ? 0 : value.startsWith("明天") ? 1 : value.startsWith("8/01") ? 2 : value.startsWith("8/02") ? 3 : value.startsWith("8/03") ? 4 : 99;
  const sorted = customers
    .map((row) => workflowMemory.stoppedCustomers.has(row[0])
      ? [row[0], row[1], row[2], row[3], "自动联系已停止，保留客户记录", "已停止"]
      : [...row])
    .filter((row) => row[0].includes(query.trim()))
    .sort((a,b) => sort === "优先分从高到低" ? Number(b[3])-Number(a[3]) : scheduleRank(a[5])-scheduleRank(b[5]));
  const active = sorted.filter((row) => row[5] !== "已停止");
  const stopped = sorted.filter((row) => row[5] === "已停止");
  return (
    <div className="stack">
      <div className="filter-bar"><div><b>正在自动跟进的客户</b><span>这里显示 8 位演示客户；实际使用时只显示本店客户</span></div><select value={sort} onChange={(e) => setSort(e.target.value)}><option>优先分从高到低</option><option>下一次联系从近到远</option></select><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入客户姓名" aria-label="搜索跟进客户" /><Button onClick={() => notify("当前演示客户列表已导出；没有读取真实手机号")}>导出当前列表</Button></div>
      <div className="customer-table">
        <div><b>客户</b><b>客户现在到哪一步</b><b>上次沟通结果</b><b>优先分</b><b>下一步做什么</b><b>什么时候做</b></div>
        {active.map((row,index) => <button className={index===0 ? "selected" : ""} key={row[0]} onClick={() => goTo("recall-customer-detail", { customerName: row[0], renovationStage: row[1], contactStage: row[2], priorityScore: row[3], nextAction: row[4], nextTime: row[5], currentStatus: "active" })}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><strong className={Number(row[3]) > 70 ? "good" : Number(row[3]) < 30 ? "bad" : ""}>{row[3]} / 100</strong><span>{row[4]}</span><em>{row[5]}<small>查看并安排 ›</small></em></button>)}
        {stopped.length > 0 && <p className="stopped-heading">已停止自动发送（保留记录，不会再联系）</p>}
        {stopped.map((row) => <button className="stopped-row" key={row[0]} onClick={() => goTo("recall-customer-detail", { customerName: row[0], renovationStage: row[1], contactStage: row[2], priorityScore: row[3], nextAction: row[4], nextTime: row[5], currentStatus: "stopped" })}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><strong>{row[3]} / 100</strong><span>{row[4]}</span><em>{row[5]}<small>查看记录 ›</small></em></button>)}
        {sorted.length === 0 && <p className="empty-result">没有找到这个姓名。请检查输入，或清空搜索后重试。</p>}
      </div>
    </div>
  );
}

function RecallPluginScreen({ goTo }: Pick<ScreenProps, "goTo">) {
  useWorkflowBridge();
  const couponPaused = workflowMemory.couponStatus === "已暂停";
  return (
    <div className="plugin-grid recall-plugin-cards">
      <Card className="plugin-card"><div className="plugin-letter">图</div><Pill tone="positive">{workflowMemory.posterStatus}</Pill><h3>按客户情况生成知识海报</h3><p>例如客户拿不准预算时，生成预算拆分说明；发送前自动检查客户状态和资料有效期。</p><div className="plugin-stats"><span>近 30 天已发</span><strong>1,842 张</strong></div><Button kind="primary" onClick={() => goTo("recall-poster")}>设置海报内容</Button></Card>
      <Card className="plugin-card"><div className="plugin-letter">券</div><Pill tone={couponPaused ? "danger" : "positive"}>{couponPaused ? "已暂停，不会发券" : "正在使用"}</Pill><h3>生成免费上门量房券</h3><p>{couponPaused ? "预约数量来源已停用；恢复并保存完整规则前，不会再生成新券。" : "只有客户地址能服务、当天还有预约名额时才生成；条件不符就不发送。"}</p><div className="plugin-stats"><span>近 30 天已使用</span><strong>86 张</strong></div><Button kind="primary" onClick={() => goTo("recall-coupon")}>{couponPaused ? "检查规则并恢复" : "设置量房券规则"}</Button></Card>
    </div>
  );
}

function PosterScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [topic, setTopic] = useState("预算拆分");
  const [stage, setStage] = useState("已经报价，但还没到店");
  const [storeName, setStoreName] = useState("有大有小｜漳州龙文店");
  const [includeCustomerDetails, setIncludeCustomerDetails] = useState(true);
  const previews: Record<string, { title: string; keyword: string; rows: [string, string, number][] }> = {
    "预算拆分": {
      title: "15 万预算，怎么分更合理？",
      keyword: "预算清单",
      rows: [["柜体", "28%", 28], ["硬装", "42%", 42], ["软装", "30%", 30]],
    },
    "板材环保": {
      title: "家里有孩子，板材环保先看这 3 点",
      keyword: "板材清单",
      rows: [["环保等级", "ENF", 92], ["封边工艺", "PUR", 78], ["检测报告", "到店可看", 64]],
    },
    "收纳规划": {
      title: "同样的柜子，先规划这 3 个收纳区",
      keyword: "收纳清单",
      rows: [["高频区", "随手拿", 88], ["转角区", "少浪费", 76], ["换季区", "分类收好", 66]],
    },
    "装修流程": {
      title: "全屋定制从咨询到安装，要走这 3 步",
      keyword: "流程清单",
      rows: [["先确认", "户型和预算", 25], ["再设计", "布局与配置", 60], ["后施工", "复尺后排期", 90]],
    },
  };
  const preview = previews[topic];
  const customerDetailsAvailable = stage !== "刚加企微，还没说需求";
  const showCustomerDetails = customerDetailsAvailable && includeCustomerDetails;
  return (
    <div className="stack">
      <div className="subpage-back"><Button onClick={() => goTo("recall-plugins")}>← 返回自动跟进工具</Button></div>
      <div className="poster-layout">
      <Card title="什么情况下生成哪种知识海报" caption="这是演示设置；保存后也不会立即发给客户">
        <label><span>客户现在到哪一步</span><select value={stage} onChange={(event) => { const nextStage = event.target.value; setStage(nextStage); if (nextStage === "刚加企微，还没说需求") setIncludeCustomerDetails(false); }}><option>刚加企微，还没说需求</option><option>已经发户型图</option><option>已经报价，但还没到店</option><option>已经量房，还没签约</option></select></label>
        <label><span>这时给客户讲什么</span><select value={topic} onChange={(e)=>setTopic(e.target.value)}><option>预算拆分</option><option>板材环保</option><option>收纳规划</option><option>装修流程</option></select></label>
        <label><span>海报底部显示的门店</span><input onChange={(event) => setStoreName(event.target.value)} value={storeName} /></label>
        <label className="toggle-line"><input checked={showCustomerDetails} disabled={!customerDetailsAvailable} onChange={(event) => setIncludeCustomerDetails(event.target.checked)} type="checkbox" />{customerDetailsAvailable ? "在海报中使用客户已提供的面积和风格" : "客户还没提供面积和风格，使用通用海报"}</label>
        <div className="rule-box"><b>发送前自动检查</b><p>系统会检查客户未拒绝、资料仍有效，内容也符合当前阶段。</p></div>
        {storeName.trim().length < 4 && <p className="form-hint">先填写客户能认出的门店名称，预览和实际海报才不会落款错误。</p>}
        <Button disabled={storeName.trim().length < 4} kind="primary" onClick={() => { workflowMemory.posterStatus = "已保存并使用"; publishWorkflowChange(); notify(`海报规则已保存：${stage} → ${topic} → ${storeName.trim()}；以后生成海报时使用，不会立即发送`); }}>{storeName.trim().length < 4 ? "先填写门店名称" : "保存海报规则"}</Button>
      </Card>
      <div className="knowledge-poster">
        <small>演示预览 · 不会真实发送</small>
        <h2>{preview.title}</h2>
        <p>{stage} · {showCustomerDetails ? "根据客户已提供的 118㎡原木风需求生成" : "不写客户面积和风格，只显示通用内容"}</p>
        {preview.rows.map(([label, value, progress]) => <div key={label}><span>{label}</span><b>{value}</b><Progress value={progress}/></div>)}
        <em>{storeName.trim() || "门店名称待填写"}｜需要时回复“{preview.keyword}”</em>
      </div>
      </div>
    </div>
  );
}

function CouponScreen({ goTo, notify }: Pick<ScreenProps, "goTo" | "notify">) {
  useWorkflowBridge();
  const [benefit, setBenefit] = useState("免费上门量房 + 初步平面方案");
  const [serviceRegion, setServiceRegion] = useState("漳州市龙文区、芗城区；厦门市指定区域");
  const [validity, setValidity] = useState("7 天内");
  const [dailyCapacity, setDailyCapacity] = useState("6");
  const [capacitySource, setCapacitySource] = useState("门店每日接待表");
  const validityOptions = ["3 天内", "7 天内", "14 天内", "30 天内"];
  const stopping = capacitySource === "暂不读取，停止发券";
  const couponPaused = workflowMemory.couponStatus === "已暂停";
  const preparingToStop = stopping && !couponPaused;
  const capacityValid = /^\d+$/.test(dailyCapacity) && Number(dailyCapacity) > 0;
  const dailyCapacityLabel = `${dailyCapacity || "待填"} 户 / 天`;
  const complete = benefit.trim().length >= 4
    && serviceRegion.trim().length >= 4
    && validityOptions.includes(validity)
    && capacityValid;
  const canSave = stopping || complete;

  function saveCouponRule() {
    workflowMemory.couponStatus = stopping ? "已暂停" : "使用中";
    publishWorkflowChange();
    notify(stopping
      ? "量房券已暂停；不会再生成新券，已生成的演示记录仍保留"
      : "量房券规则已保存并可继续使用；每次发送前仍要核对地区和当天名额");
  }

  return (
    <div className="stack">
      <div className="subpage-back"><Button onClick={() => goTo("recall-plugins")}>← 返回自动跟进工具</Button></div>
      <div className="coupon-layout">
      <Card title="量房券必须遵守的规则" caption="地址和当天可预约数量都符合，系统才允许生成">
        <label><span>券上写给客户的权益</span><input onChange={(event) => setBenefit(event.target.value)} value={benefit} /></label>
        <label><span>哪些地区可以服务</span><input onChange={(event) => setServiceRegion(event.target.value)} value={serviceRegion} /></label>
        <label><span>客户领取后多久要预约</span><select onChange={(event) => setValidity(event.target.value)} value={validity}>{validityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span>本店每天最多可预约多少户</span><input min="1" onChange={(event) => setDailyCapacity(event.target.value)} step="1" type="number" value={dailyCapacity} /></label>
        <label><span>预约数量从哪里读取</span><select onChange={(event) => setCapacitySource(event.target.value)} value={capacitySource}><option>门店每日接待表</option><option>暂不读取，停止发券</option></select></label>
        <div className="rule-box"><b>发送前自动检查</b><p>系统会重新检查服务地区和当天剩余名额；不符合就不生成量房券。</p></div>
        {!stopping && !complete && <p className="form-hint">先补全权益、服务地区、预约期限和大于 0 的每日名额，才可以继续使用。</p>}
        {preparingToStop && <div className="rule-box"><b>保存后会立即暂停发券</b><p>客户不会再收到新券；以后重新选择“门店每日接待表”并补全规则，才能恢复。</p></div>}
        {stopping && couponPaused && <div className="rule-box"><b>发券已经暂停</b><p>不会再生成新券。要恢复，请先把上方来源改回“门店每日接待表”，核对完整规则后再保存。</p></div>}
        <Button disabled={!canSave || (stopping && couponPaused)} kind={stopping ? "danger" : "primary"} onClick={saveCouponRule}>{stopping ? couponPaused ? "发券已暂停；改回接待表后可恢复" : "确认暂停，不再生成新券" : couponPaused ? "保存完整规则并恢复使用" : "保存量房券规则"}</Button>
      </Card>
      <div className="coupon-card">
        <small>{stopping ? couponPaused ? "发券已暂停 · 不会再生成新券" : "准备暂停 · 保存后不再生成新券" : couponPaused ? "发券已暂停 · 以下只用于核对旧规则" : "演示预览 · 不是真实券码"}</small><h2>{benefit.trim() || "权益待填写"}</h2><p>{dailyCapacityLabel}</p><div className="coupon-code">领取后 {validity.trim() || "预约期限待填写"}预约 · 示例券 HZ0286</div><span>适用：{serviceRegion.trim() || "服务地区待填写"}</span><em>需预约 · 每户限用 1 次 · 以门店确认时间为准</em>
      </div>
      </div>
    </div>
  );
}

export function ScreenContent({ screen, context, goTo, notify }: ScreenProps) {
  if (screen.detail) return <PrototypeDetailContent screen={screen} context={context} goTo={goTo} notify={notify} />;
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
    case "sales-metrics": return <MetricsScreen goTo={goTo} notify={notify} />;
    case "sales-quality": return <QualityScreen goTo={goTo} notify={notify} />;
    case "sales-faq": return <FaqScreen goTo={goTo} notify={notify} />;
    case "sales-plugins": return <PluginCenterScreen notify={notify} />;
    case "recall-activities": return <ActivitiesScreen goTo={goTo} notify={notify} />;
    case "recall-metrics": return <RecallMetricsScreen goTo={goTo} notify={notify} />;
    case "recall-pool": return <RecallPoolScreen goTo={goTo} notify={notify} />;
    case "recall-plugins": return <RecallPluginScreen goTo={goTo} />;
    case "recall-poster": return <PosterScreen goTo={goTo} notify={notify} />;
    case "recall-coupon": return <CouponScreen goTo={goTo} notify={notify} />;
    default: return <div>页面内容准备中</div>;
  }
}
