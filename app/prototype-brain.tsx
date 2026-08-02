/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, type ReactNode } from "react";

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
  pressed,
}: {
  children: ReactNode;
  disabled?: boolean;
  kind?: "default" | "primary" | "danger" | "ghost";
  onClick?: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      aria-pressed={pressed}
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
  return (
    <section className={`card ${className}`.trim()}>
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

type BrainDailyTaskId = "brain-gaps" | "brain-import" | "brain-trace";

const brainWorkflowMemory = {
  completedTasks: new Set<BrainDailyTaskId>(),
};
const brainWorkflowSubscribers = new Set<() => void>();

function publishBrainWorkflowChange() {
  brainWorkflowSubscribers.forEach((subscriber) => subscriber());
}

function completeBrainTask(id: BrainDailyTaskId) {
  brainWorkflowMemory.completedTasks.add(id);
  publishBrainWorkflowChange();
}

function reopenBrainTask(id: BrainDailyTaskId) {
  if (!brainWorkflowMemory.completedTasks.delete(id)) return;
  publishBrainWorkflowChange();
}

function useBrainWorkflow() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const update = () => setVersion((value) => value + 1);
    brainWorkflowSubscribers.add(update);
    return () => brainWorkflowSubscribers.delete(update);
  }, []);
  return brainWorkflowMemory;
}

export function resetBrainWorkflowDemo() {
  brainWorkflowMemory.completedTasks.clear();
  publishBrainWorkflowChange();
}

const todayTasks = [
  {
    action: "补齐这条答案",
    count: "近 7 天被问 26 次",
    detail: "缺少本店的耐温范围、安装距离和售后说明。",
    id: "brain-gaps",
    title: "PET 门板靠灶台会不会变形？",
    tone: "danger" as Tone,
  },
  {
    action: "核对这份资料",
    count: "1 份活动资料待确认",
    detail: "系统发现两句不合适的承诺，需要店长确认改法和分类。",
    id: "brain-import",
    title: "核对暑期活动资料",
    tone: "warning" as Tone,
  },
  {
    action: "检查这次回答",
    count: "今天 1 条待店长确认",
    detail: "客户继续发了户型图，请确认机器人引用的报价说明没有问题。",
    id: "brain-trace",
    title: "568 元套餐包含哪些？",
    tone: "info" as Tone,
  },
];

function BrainTodayScreen({ goTo }: BrainScreenProps) {
  const workflow = useBrainWorkflow();
  const orderedTasks = [
    ...todayTasks.filter((task) => !workflow.completedTasks.has(task.id as BrainDailyTaskId)),
    ...todayTasks.filter((task) => workflow.completedTasks.has(task.id as BrainDailyTaskId)),
  ];
  const remaining = todayTasks.length - workflow.completedTasks.size;

  return (
    <div className="stack brain-page">
      <div className="brain-overview">
        <div><span>今天还要处理</span><strong>{remaining} 项</strong><small>{remaining ? "已按影响排好顺序" : "今天的检查已完成"}</small></div>
      </div>

      <Card
        title={remaining ? "从第一条开始处理" : "今天的检查已完成"}
        caption={remaining ? "不用看技术指标。只处理系统明确指出、会影响客户回答的问题。" : "三项都已处理；资料再次变化时，系统会重新加入待办。"}
      >
        <div className="brain-task-list">
          {orderedTasks.map((task, index) => {
            const done = workflow.completedTasks.has(task.id as BrainDailyTaskId);
            const current = !done && index === 0;
            return (
            <article className={current ? "brain-task brain-task-current" : done ? "brain-task brain-task-done" : "brain-task"} key={task.id}>
              <div className="brain-task-order">{index + 1}</div>
              <div className="brain-task-copy">
                <div className="chip-wrap"><Pill tone={done ? "positive" : task.tone}>{done ? "已完成" : current ? "最先处理" : "待处理"}</Pill><span>{task.count}</span></div>
                <h3>{task.title}</h3>
                <p>{task.detail}</p>
              </div>
              <Button disabled={done} kind={current ? "primary" : "default"} onClick={() => goTo(task.id)}>
                {done ? "已经完成" : task.action}
              </Button>
            </article>
          );})}
        </div>
      </Card>
    </div>
  );
}

const importDocs = [
  {
    id: "activity",
    name: "2026 暑期焕新活动政策.pdf",
    origin: "已从沉默客户跟进自动同步，不用重复上传",
    problem: "系统整理出 36 条内容，并发现 2 处不合适的承诺。请核对修改和分类。",
    status: "待确认",
    tone: "warning" as Tone,
  },
  {
    id: "scan",
    name: "扫描版水电验收手册.pdf",
    origin: "84 页都是扫描图片",
    problem: "机器人现在只能看到文件名。请上传能复制文字的 PDF 或 Word 版本。",
    status: "读不到正文",
    tone: "danger" as Tone,
  },
  {
    id: "outdated",
    name: "厨房收纳尺寸指南旧版.pdf",
    origin: "最后更新于 2024 年",
    problem: "内容可能已经过期。请上传门店当前使用的版本，再让系统重新整理。",
    status: "内容已过期",
    tone: "warning" as Tone,
  },
];

function BrainImportScreen({ notify }: BrainScreenProps) {
  const [selectedId, setSelectedId] = useState("activity");
  const [confirmed, setConfirmed] = useState(false);
  const [riskEdits, setRiskEdits] = useState([
    "活动档 568 元/㎡起，最终以量尺清单为准",
    "排产时间以复尺和订单确认后的门店排期为准",
  ]);
  const [uploadedFile, setUploadedFile] = useState("");
  const [uploadedStatus, setUploadedStatus] = useState<"" | "正在读取" | "待核对" | "可以使用">("");
  const [replacementStatus, setReplacementStatus] = useState<Record<string, "正在读取" | "待核对" | "可以使用">>({});
  const selected = importDocs.find((doc) => doc.id === selectedId) ?? importDocs[0];
  const riskEditsReady = riskEdits.every((value) => value.trim().length >= 8);
  const selectedReplacementStatus = replacementStatus[selected.id];
  const selectedProblem = selected.id === "activity"
    ? confirmed
      ? "36 条内容已经核对并开始使用。以后资料有变化时，再回到这里更新。"
      : selected.problem
    : selectedReplacementStatus === "正在读取"
      ? "新文件正在读取，不用重复上传。"
      : selectedReplacementStatus === "待核对"
        ? "新文件已经读完，请核对页数、版本和用途。"
        : selectedReplacementStatus === "可以使用"
          ? "新文件已经确认，机器人会优先使用这个版本。"
          : selected.problem;

  function confirmContent() {
    setConfirmed(true);
    completeBrainTask("brain-import");
    notify("36 条内容已确认；以后的视频、企微回复和客户跟进会使用它们");
  }

  function replaceFile(id: string, fileName: string) {
    if (!fileName) return;
    setReplacementStatus((current) => ({ ...current, [id]: "正在读取" }));
    notify(`已选择“${fileName}”，正在读取内容（演示）`);
    window.setTimeout(() => {
      setReplacementStatus((current) => ({ ...current, [id]: "待核对" }));
      notify("新文件已经读完，请核对读取结果");
    }, 700);
  }

  function uploadSupplement(fileName: string) {
    if (!fileName) return;
    setUploadedFile(fileName);
    setUploadedStatus("正在读取");
    notify(`已加入“${fileName}”，正在读取内容（演示）`);
    window.setTimeout(() => {
      setUploadedStatus("待核对");
      notify("补充资料已经读完，请确认后使用");
    }, 700);
  }

  return (
    <div className="stack brain-page">
      <div className="brain-sync-note">
        <b>以前三个功能上传过的资料会自动到这里</b>
        <span>价格、活动、聊天和客户资料不用重复提交；只有新增的企业资料需要上传。</span>
      </div>

      <Card
        title="需要处理的资料"
        caption="只看黄色或红色项目；显示“可以使用”的资料不用逐份检查。"
        action={(
          <label className="ui-button brain-upload-button">
            上传补充资料
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(event) => uploadSupplement(event.target.files?.[0]?.name ?? "")}
              type="file"
            />
          </label>
        )}
      >
        {uploadedFile && (
          <div className="brain-upload-result" role="status">
            <span>新上传：{uploadedFile} · {uploadedStatus}</span>
            {uploadedStatus === "待核对" && <Button kind="primary" onClick={() => { setUploadedStatus("可以使用"); notify("补充资料已确认并开始使用"); }}>确认资料可以使用</Button>}
          </div>
        )}
        <div className="brain-document-list">
          {importDocs.map((doc) => {
            const dynamicStatus = replacementStatus[doc.id];
            const status = confirmed && doc.id === "activity" ? "可以使用" : dynamicStatus ?? doc.status;
            const tone: Tone = status === "可以使用" ? "positive" : status === "正在读取" ? "info" : status === "待核对" ? "warning" : doc.tone;
            return (
            <button
              aria-pressed={selectedId === doc.id}
              className={selectedId === doc.id ? "active" : ""}
              key={doc.id}
              onClick={() => setSelectedId(doc.id)}
              type="button"
            >
              <div><b>{doc.name}</b><span>{doc.origin}</span></div>
              <Pill tone={tone}>{status}</Pill>
            </button>
          );})}
        </div>
      </Card>

      <Card title={selected.name} caption={selectedProblem}>
        {selected.id === "activity" ? (
          <div className="stack">
            <div className="brain-three-steps" aria-label="资料处理步骤">
              <div className="done"><i>1</i><b>系统已读完文件</b><span>整理出 36 条内容</span></div>
              <div className={confirmed ? "done" : "current"}><i>2</i><b>店长核对</b><span>{confirmed ? "已确认" : "现在只需要做这一步"}</span></div>
              <div className={confirmed ? "done" : "waiting"}><i>3</i><b>自动供各功能使用</b><span>{confirmed ? "已经生效" : "确认后自动完成"}</span></div>
            </div>

            <div className="brain-review-grid">
              <section>
                <b>系统改了 2 句风险说法</b>
                <p className="brain-before">原句：全城最低价，绝不加价</p>
                <label className="brain-field"><span>店长确认后的说法</span><textarea disabled={confirmed} onChange={(event) => setRiskEdits((current) => current.map((value, index) => index === 0 ? event.target.value : value))} value={riskEdits[0]} /></label>
                <p className="brain-before">原句：交完定金一定 30 天装完</p>
                <label className="brain-field"><span>店长确认后的说法</span><textarea disabled={confirmed} onChange={(event) => setRiskEdits((current) => current.map((value, index) => index === 1 ? event.target.value : value))} value={riskEdits[1]} /></label>
              </section>
              <section>
                <b>确认分到哪一类</b>
                {[
                  "价格与包含项（20 条）",
                  "不能乱承诺的规则（9 条）",
                  "客户常问答案（7 条）",
                ].map((item) => (
                  <div
                    className="brain-check-line brain-check-line-readonly"
                    key={item}
                  >
                    <span aria-hidden="true" className="brain-check-box">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </section>
            </div>

            <details className="brain-history">
              <summary>查看 36 条分类汇总</summary>
              <p>价格与包含项 20 条 · 不能乱承诺的规则 9 条 · 客户常问答案 7 条。系统只改了上面 2 句，其余内容保持原意。</p>
            </details>

            <div className="button-row">
              <Button disabled={confirmed || !riskEditsReady} kind="primary" onClick={confirmContent}>
                {confirmed ? "36 条内容已确认并使用" : "确认这 36 条内容并使用"}
              </Button>
            </div>
          </div>
        ) : replacementStatus[selected.id] === "正在读取" ? (
          <div className="brain-replace-file" role="status">
            <div><b>正在读取新文件</b><p>通常只需等待一会儿，不用重复上传。</p></div>
            <Pill tone="info">正在读取</Pill>
          </div>
        ) : replacementStatus[selected.id] === "待核对" ? (
          <div className="brain-replace-file" role="status">
            <div>
              <b>新文件已经读完</b>
              <p>{selected.id === "scan" ? "已读到 84 页正文和 126 条验收说明；请确认页数与文件相符。" : "已识别为门店当前版本；请确认这是正在使用的文件。"}</p>
            </div>
            <Button kind="primary" onClick={() => { setReplacementStatus((current) => ({ ...current, [selected.id]: "可以使用" })); notify("新文件已确认并开始使用"); }}>确认新文件可以使用</Button>
          </div>
        ) : replacementStatus[selected.id] === "可以使用" ? (
          <div className="brain-replace-file" role="status">
            <div><b>新文件可以使用</b><p>机器人会优先使用这个版本，旧版本仅保留在修改记录中。</p></div>
            <Pill tone="positive">已完成</Pill>
          </div>
        ) : (
          <div className="brain-replace-file">
            <div>
              <b>下一步只有一件事</b>
              <p>{selected.id === "scan" ? "上传文字版 PDF 或 Word。没有文字版时，请向资料负责人索取可复制版本。" : "上传最新版本；旧文件会保留在修改记录中，不会直接删除。"}</p>
            </div>
            <label className="ui-button ui-button-primary brain-upload-button">
              {selected.id === "scan" ? "上传文字版文件" : "上传最新版本"}
              <input
                accept=".pdf,.doc,.docx"
                onChange={(event) => replaceFile(selected.id, event.target.files?.[0]?.name ?? "")}
                type="file"
              />
            </label>
          </div>
        )}
      </Card>
    </div>
  );
}

function BrainFactsScreen({ notify }: BrainScreenProps) {
  const [storeIntro, setStoreIntro] = useState("主营衣柜、橱柜、榻榻米和全屋柜体，服务漳州与厦门，提供设计、安装和售后服务。");
  const [boundaries, setBoundaries] = useState("不承诺最低价、零增项；不承接油工、乳胶漆和商铺全案。");
  const [fact, setFact] = useState("活动基础档 568 元/投影㎡起，包含指定板材、门板和基础五金。");
  const [conditions, setConditions] = useState("活动有效期内；指定系列；漳州或厦门。");
  const [notIncluded, setNotIncluded] = useState("特殊拉篮、岩板台面、超高门板等升级项。");
  const [source, setSource] = useState("《2026 暑期焕新活动政策》v3，第 12–18 页");
  const [saved, setSaved] = useState(true);
  const factsReady = [storeIntro, boundaries, fact, conditions, notIncluded, source].every((value) => value.trim().length >= 4);

  function markChanged(setter: (value: string) => void, value: string) {
    setter(value);
    setSaved(false);
  }

  function saveFacts() {
    setSaved(true);
    notify("门店事实已保存；新的视频、企微回复和客户跟进会使用这些内容");
  }

  return (
    <div className="stack brain-page">
      <div className="brain-sync-note">
        <b>主营品类和服务城市已从“短视频获客”的门店信息同步</b>
        <span>这里不重复填写。只维护长期门店介绍，以及能够找到资料依据的产品、价格和服务事实。</span>
      </div>

      <Card title="门店基本信息" caption="决定机器人如何介绍门店；只写长期不常变的内容。">
        <div className="brain-form-grid">
          <label className="brain-field brain-field-wide">
            <span>客户会听到的门店介绍</span>
            <textarea onChange={(event) => markChanged(setStoreIntro, event.target.value)} value={storeIntro} />
          </label>
          <label className="brain-field brain-field-wide">
            <span>哪些话不能承诺、哪些业务不承接</span>
            <textarea onChange={(event) => markChanged(setBoundaries, event.target.value)} value={boundaries} />
          </label>
        </div>
        <div className="brain-answer-preview">
          <b>客户会听到</b>
          <p>{storeIntro}</p>
        </div>
      </Card>

      <Card
        title="产品、报价和服务说明"
        caption="当前核对：568 元套餐包含什么。每条只说明一个事实，并写清适用条件和来源。"
        action={<Pill tone={!factsReady ? "danger" : saved ? "positive" : "warning"}>{!factsReady ? "请补齐必填内容" : saved ? "当前示例已核对" : "有修改待保存"}</Pill>}
      >
        <div className="brain-form-grid">
          <label className="brain-field brain-field-wide"><span>准确说法</span><textarea onChange={(event) => markChanged(setFact, event.target.value)} value={fact} /></label>
          <label className="brain-field"><span>什么情况下适用</span><textarea onChange={(event) => markChanged(setConditions, event.target.value)} value={conditions} /></label>
          <label className="brain-field"><span>不包含什么</span><textarea onChange={(event) => markChanged(setNotIncluded, event.target.value)} value={notIncluded} /></label>
          <label className="brain-field brain-field-wide"><span>依据哪份有效资料</span><input onChange={(event) => markChanged(setSource, event.target.value)} value={source} /></label>
        </div>
        <div className="brain-answer-preview">
          <b>客户问“568 元包含什么”时会听到</b>
          <p>{fact} 适用于：{conditions} 不包含：{notIncluded} 如需确认最终价格，请以量尺后的正式清单为准。</p>
          <small>回答依据：{source}</small>
        </div>
        <div className="button-row brain-save-row">
          <Pill tone={!factsReady ? "danger" : saved ? "positive" : "warning"}>{!factsReady ? "关键内容不能留空" : saved ? "当前内容已保存" : "有修改尚未保存"}</Pill>
          <Button disabled={saved || !factsReady} kind="primary" onClick={saveFacts}>保存门店事实</Button>
        </div>
      </Card>

      <details className="brain-history">
        <summary>查看最近修改记录</summary>
        <p>7 月 31 日：新增厦门服务区域；更新 568 元活动的适用条件。旧版本仍可追溯。</p>
      </details>
    </div>
  );
}

function BrainGuidanceScreen({ notify }: BrainScreenProps) {
  const sourceAnswer = "先确认您看的是否是当前 568 元活动档。这个档位包含基础铰链和标准抽屉配置；拉篮、特殊抽屉或升级五金会按清单单列。您把户型和想做的柜体发我，我可以先给您拆一份大致配置。";
  const [answer, setAnswer] = useState(sourceAnswer);
  const [answerDecision, setAnswerDecision] = useState<"" | "adopted" | "rejected">("");
  const [answerReviewed, setAnswerReviewed] = useState(false);
  const [ruleTested, setRuleTested] = useState(false);
  const [ruleSaved, setRuleSaved] = useState(false);
  const answerHasRisk = /最低价|零增项|绝不加价|保证名额|保证工期/.test(answer);
  const answerReady = answerReviewed && answer.trim().length >= 20 && !answerHasRisk;

  return (
    <div className="stack brain-page">
      <div className="brain-sync-note">
        <b>不用重复审核销售聊天</b>
        <span>在 02-02 标为“可借鉴”的销售回复会自动到这里；这里只确认机器人是否可以照着回答。</span>
      </div>

      <Card
        title="这条回答可以作为参考吗？"
        caption="来自一段已标为可借鉴的销售回复。原回复保持不变；你可以在下方调整机器人采用的版本。"
        action={<Pill tone={answerDecision ? answerDecision === "adopted" ? "positive" : "neutral" : "warning"}>{answerDecision === "adopted" ? "已经采用" : answerDecision === "rejected" ? "不采用" : "待确认"}</Pill>}
      >
        <div className="brain-conversation">
          <div className="customer"><b>客户</b><p>你们现在说 568 一平方，五金和抽屉都包含吗？</p></div>
          <div className="assistant"><b>销售回复（已在 02-02 标为可借鉴）</b><p>{sourceAnswer}</p></div>
        </div>
        <div className="brain-answer-checks">
          <span>请确认：说清当前活动和包含项</span>
          <span>请确认：没有承诺最低价或零增项</span>
          <span>请确认：给了客户明确的下一步</span>
        </div>
        <label className="brain-field">
          <span>机器人可以采用的回答</span>
          <textarea onChange={(event) => { setAnswer(event.target.value); setAnswerDecision(""); setAnswerReviewed(false); }} value={answer} />
        </label>
        {answerHasRisk && <p className="brain-form-reminder">这段话含有不能直接承诺的说法，请先修改。</p>}
        <button
          aria-pressed={answerReviewed}
          className="brain-check-line"
          disabled={answerHasRisk || answer.trim().length < 20}
          onClick={() => setAnswerReviewed((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="brain-check-box">{answerReviewed ? "✓" : ""}</span>
          <span>我已核对上面 3 点</span>
        </button>
        <div className="button-row">
          <Button disabled={answerDecision === "rejected"} pressed={answerDecision === "rejected"} onClick={() => { setAnswerDecision("rejected"); notify("已标记为不采用，不会成为机器人参考回答"); }}>
            {answerDecision === "rejected" ? "已标记为不采用" : "不采用这条回答"}
          </Button>
          <Button disabled={!answerReady || answerDecision === "adopted"} kind="primary" pressed={answerDecision === "adopted"} onClick={() => { setAnswerDecision("adopted"); notify("这条回答已保存，机器人可以在相似问题中参考"); }}>
            {answerDecision === "adopted" ? "已保存为参考回答" : "保存为参考回答"}
          </Button>
        </div>
      </Card>

      <Card title="确认系统建议的回答边界" caption="系统根据当前门店资料整理了这条建议。先看试答；不合适时，请回到“门店事实”修改来源内容。">
        <div className="brain-rule-grid">
          <div><b>客户问到这些时使用</b><p>活动、优惠、价格、名额、赠品或截止时间。</p></div>
          <div><b>机器人要做</b><p>确认活动仍有效并且还有名额，再回答客户。</p></div>
          <div><b>机器人不能做</b><p>不能引用过期海报、历史聊天里的旧价格，也不能猜名额。</p></div>
          <div><b>找不到可靠资料时</b><p>告诉客户需要门店确认，不编价格、不报库存。</p></div>
        </div>
        <div className="brain-rule-test">
          <b>用客户问题试答一次</b>
          <p>“昨天海报上的 498 元还有名额吗？”</p>
          {ruleTested && (
            <div className="brain-test-result" role="status">
              <b>客户会收到</b>
              <p>您看到的 498 元海报已经过期，我现在不能确认还有名额。门店当前使用的是 568 元活动档；如果您愿意，我可以先按户型帮您确认包含项和当前名额。</p>
              <span>✓ 没有引用过期价格，也没有猜测名额。</span>
            </div>
          )}
        </div>
        <div className="button-row">
          <Button onClick={() => { setRuleTested(true); setRuleSaved(false); notify("试答完成：没有引用过期活动"); }}>用示例问题试答</Button>
          <Button disabled={!ruleTested || ruleSaved} kind="primary" onClick={() => { setRuleSaved(true); notify("规则已保存并开始使用"); }}>
            {ruleSaved ? "规则正在使用" : "保存并使用这条规则"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

const customerAssets = [
  {
    avoid: "只问价格、投诉、售后，或还没有确认橱柜安装需求。",
    id: "kitchen",
    image: "./video-previews/stock/kitchen-installation.jpg",
    label: "橱柜安装现场",
    recipients: "已发户型，或主动询问橱柜安装过程的客户。",
    sendWhen: "“橱柜怎么安装”“安装现场是什么样”“要多久装好”。",
    state: "待替换图片",
    text: "这是橱柜安装中的现场示例，可以先了解柜体落位和调整过程。实际工期与现场条件有关，要等量尺和排期后再确认。",
  },
  {
    avoid: "客户只问价格、没有询问花色，或图片中的样板已经停产。",
    id: "board",
    image: "./video-previews/stock/wood-samples.jpg",
    label: "门板花色样板",
    recipients: "正在比较门板颜色、纹理或触感的客户。",
    sendWhen: "“有哪些木纹色”“这几种花色有什么区别”。",
    state: "正在使用",
    text: "这是几款门板花色的示例，可以先对比颜色和纹理。正式选样请以到店看到的实物与当前批次为准。",
  },
  {
    avoid: "客户没有儿童房需求，或还没有确认床边收纳需求。",
    id: "child",
    image: "./video-previews/stock/child-bedroom.jpg",
    label: "儿童房床边收纳",
    recipients: "已经说明儿童年龄，并在咨询玩具或床边收纳的客户。",
    sendWhen: "“玩具放哪里”“床边怎么加收纳”“孩子自己怎么取东西”。",
    state: "待替换图片",
    text: "这是一个儿童房床边收纳示例，可以让孩子自己取放常用玩具。您把床和过道尺寸发我，我再帮您判断能否照这个思路做。",
  },
];

type AssetReplacement = { name: string; url: string };

function BrainAssetsScreen({ notify }: BrainScreenProps) {
  const [selectedId, setSelectedId] = useState("kitchen");
  const [previewed, setPreviewed] = useState(false);
  const [enabledIds, setEnabledIds] = useState(["board"]);
  const [replacementImages, setReplacementImages] = useState<Record<string, AssetReplacement>>({
    board: { name: "门店花色样板-2026-07.jpg（演示）", url: "./video-previews/stock/wood-samples.jpg" },
  });
  const selected = customerAssets.find((asset) => asset.id === selectedId) ?? customerAssets[0];
  const enabled = enabledIds.includes(selected.id);
  const selectedReplacement = replacementImages[selected.id];
  const remainingCount = customerAssets.filter((asset) => !enabledIds.includes(asset.id)).length;

  function selectAsset(id: string) {
    setSelectedId(id);
    setPreviewed(false);
  }

  function replaceAsset(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      setReplacementImages((current) => ({ ...current, [selected.id]: { name: file.name, url: reader.result as string } }));
      setEnabledIds((current) => current.filter((id) => id !== selected.id));
      setPreviewed(false);
      notify(`已选择“${file.name}”；请预览后再开始使用（演示）`);
    });
    reader.readAsDataURL(file);
  }

  return (
    <div className="stack brain-page">
      <Card
        title="客户图片"
        caption="示例图只用于原型演示。正式使用时，必须换成门店有权发送的真实图片；行业参考图不能直接发给客户。"
        action={<Pill tone={remainingCount ? "warning" : "positive"}>{remainingCount} 张待处理</Pill>}
      >
        <div className="brain-asset-grid">
          {customerAssets.map((asset) => (
            <button aria-pressed={selectedId === asset.id} className={selectedId === asset.id ? "active" : ""} key={asset.id} onClick={() => selectAsset(asset.id)} type="button">
              <img alt={asset.label} src={replacementImages[asset.id]?.url ?? asset.image} />
              <div>
                <b>{asset.label}</b>
                <Pill tone={enabledIds.includes(asset.id) ? "positive" : "warning"}>
                  {enabledIds.includes(asset.id) ? "正在使用" : replacementImages[asset.id] ? "待预览" : asset.state}
                </Pill>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="brain-asset-review">
        <Card title={`检查“${selected.label}”什么时候可以发`} caption="先换成门店有权使用的图片，再确认系统建议的对象、时机和禁止场景。">
          <dl className="brain-condition-list">
            <div><dt>发给哪些客户</dt><dd>{selected.recipients}</dd></div>
            <div><dt>客户这样问时可以发</dt><dd>{selected.sendWhen}</dd></div>
            <div><dt>这些情况不要发</dt><dd>{selected.avoid}</dd></div>
            <div><dt>随图发送的话</dt><dd>{selected.text}</dd></div>
          </dl>
          <div className="brain-asset-source">
            <label className="ui-button brain-upload-button">
              {selectedReplacement ? "更换门店图片" : "上传门店图片"}
              <input accept="image/*" onChange={(event) => replaceAsset(event.target.files?.[0])} type="file" />
            </label>
            <span>{selectedReplacement ? `当前图片：${selectedReplacement.name}` : "尚未替换原型示例图"}</span>
          </div>
          <div className="button-row">
            <Button onClick={() => { setPreviewed(true); notify("已在右侧显示客户实际会收到的内容"); }}>预览客户看到的内容</Button>
            {enabled ? (
              <Button kind="danger" onClick={() => { setEnabledIds((current) => current.filter((id) => id !== selected.id)); notify("图片已停止使用"); }}>停止使用</Button>
            ) : (
              <Button disabled={!previewed || !selectedReplacement} kind="primary" onClick={() => { setEnabledIds((current) => [...new Set([...current, selected.id])]); notify("图片已确认并开始使用"); }}>确认并开始使用</Button>
            )}
          </div>
          {!selectedReplacement && <p className="brain-form-reminder">先上传门店有权发送的图片，才能开始使用。</p>}
        </Card>

        <Card title="客户实际会收到">
          {previewed ? (
            <div className="brain-chat-preview">
              <p>{selected.text}</p>
              <img alt={`${selected.label}发送预览`} src={selectedReplacement?.url ?? selected.image} />
              <small>演示预览 · 不会真实发送</small>
            </div>
          ) : (
            <div className="brain-preview-empty">先点“预览客户看到的内容”</div>
          )}
        </Card>
      </div>
    </div>
  );
}

type GapStage = "facts" | "draft" | "done";

function BrainGapsScreen({ notify }: BrainScreenProps) {
  const [stage, setStage] = useState<GapStage>("facts");
  const [heat, setHeat] = useState("");
  const [distance, setDistance] = useState("");
  const [craft, setCraft] = useState("");
  const [afterSales, setAfterSales] = useState("");
  const [source, setSource] = useState("");
  const [draft, setDraft] = useState("");
  const complete = [heat, distance, craft, afterSales, source].every((value) => value.trim().length >= 4 && !value.includes("待确认"));

  function generateDraft() {
    setDraft(`按本店当前产品说明和安装要求：这款 PET 门板${heat}；安装时${distance}。${craft}。如果出现变形，${afterSales}。您把灶台类型和柜体尺寸发我，我再按现场情况确认。`);
    setStage("draft");
    notify("回答草稿已生成；请检查后再让机器人使用");
  }

  return (
    <div className="stack brain-page">
      <div className="brain-gap-heading">
        <div><Pill tone="danger">最常被问</Pill><span>近 7 天出现 26 次</span></div>
        <h2>PET 门板靠灶台会不会变形？</h2>
        <p>机器人缺少本店自己的产品参数，最近 9 次回答都不够可靠。先确认事实，再生成回答。</p>
      </div>

      <Card title="客户常见问法" caption="系统已经把意思相同的问法合并，不需要逐段聊天查看。">
        <div className="chip-wrap">
          <Pill>灶台旁能用 PET 吗？</Pill>
          <Pill>高温会不会鼓包？</Pill>
          <Pill>厨房柜门多久会变形？</Pill>
        </div>
      </Card>

      <Card
        title="请确认 4 项门店事实"
        caption="必须以产品说明、供应商确认记录或门店售后规则为准；不确定时不要猜。"
        action={<Pill tone={stage === "done" ? "positive" : "warning"}>{stage === "done" ? "已可用于新回复" : "等待店长补充"}</Pill>}
      >
        <div className="brain-form-grid">
          <label className="brain-field"><span>门板耐温范围</span><input onChange={(event) => { setHeat(event.target.value); setStage("facts"); reopenBrainTask("brain-gaps"); }} placeholder="按供应商参数填写" value={heat} /></label>
          <label className="brain-field"><span>距离灶台的安装要求</span><input onChange={(event) => { setDistance(event.target.value); setStage("facts"); reopenBrainTask("brain-gaps"); }} placeholder="按设计和电器要求填写" value={distance} /></label>
          <label className="brain-field"><span>封边和高温环境说明</span><textarea onChange={(event) => { setCraft(event.target.value); setStage("facts"); reopenBrainTask("brain-gaps"); }} placeholder="写门店实际采用的工艺和限制" value={craft} /></label>
          <label className="brain-field"><span>出现变形后的售后处理</span><textarea onChange={(event) => { setAfterSales(event.target.value); setStage("facts"); reopenBrainTask("brain-gaps"); }} placeholder="写清检查、责任判断和处理边界" value={afterSales} /></label>
          <label className="brain-field brain-field-wide"><span>依据哪份资料</span><input onChange={(event) => { setSource(event.target.value); setStage("facts"); reopenBrainTask("brain-gaps"); }} placeholder="例如：供应商参数表 2026-07 + 门店售后规则" value={source} /></label>
        </div>
        {!complete && <p className="brain-form-reminder">五项都填写清楚并写明来源后，才能生成回答草稿。</p>}
        <div className="button-row">
          <Button disabled={!complete} kind="primary" onClick={generateDraft}>资料齐全，生成回答草稿</Button>
        </div>
      </Card>

      {(stage === "draft" || stage === "done") && (
        <Card title="检查回答草稿" caption="草稿只整理上方已确认事实；审核前不会用于真实客户。">
          <label className="brain-field"><span>机器人准备这样回答</span><textarea onChange={(event) => { setDraft(event.target.value); if (stage === "done") setStage("draft"); reopenBrainTask("brain-gaps"); }} value={draft} /></label>
          <div className="button-row">
            <Button disabled={stage === "done"} kind="primary" onClick={() => { setStage("done"); completeBrainTask("brain-gaps"); notify("回答已审核，可以用于新的相似问题"); }}>
              {stage === "done" ? "已审核并开始使用" : "确认无误，开始使用"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function BrainTraceScreen({ notify }: BrainScreenProps) {
  const [decision, setDecision] = useState<"" | "good" | "problem">("");
  const [issue, setIssue] = useState("");
  const [recorded, setRecorded] = useState(false);

  return (
    <div className="stack brain-page">
      <div className="brain-trace-heading">
        <div><Pill tone="info">企微回答</Pill><span>王女士 · 7 月 31 日 14:32</span></div>
        <p>先读客户问题和最终回复，再核对机器人用了哪些门店资料。无需看模型分数或技术记录。</p>
      </div>

      <div className="brain-trace-grid">
        <Card title="客户问了什么、机器人怎么回答">
          <div className="brain-conversation">
            <div className="customer"><b>客户</b><p>你们现在 568 元一平方都包含哪些？五金和抽屉是不是另外算？</p></div>
            <div className="assistant"><b>机器人</b><p>当前 568 元活动档包含指定 ENF 板材、双面 PET 门板和基础五金；特殊拉篮和升级五金会按清单单列。您把户型发我，我先帮您拆一份配置。</p></div>
            <div className="result"><b>客户后来做了什么</b><p>2 分钟后发送了三房户型图，继续咨询配置。</p></div>
          </div>
        </Card>

        <Card title="这条回答用了这些依据">
          <div className="brain-evidence-list">
            <div><b>门店基本信息</b><span>7 月 30 日确认 · 当前有效</span><q>主营衣柜、橱柜及全屋柜体，服务漳州与厦门。</q></div>
            <div><b>2026 暑期活动政策 v3</b><span>有效至 2026 年 8 月 31 日</span><q>568 元活动档包含指定 ENF 板材、双面 PET 门板和基础五金。</q></div>
            <div><b>02-02 已标为可借鉴的销售回复</b><span>7 月 30 日确认 · 当前有效</span><q>特殊拉篮和升级五金按清单单列；邀请客户发送户型。</q></div>
            <div><b>活动价格回答边界</b><span>7 月 31 日试答通过 · 当前有效</span><q>不能引用过期海报，不能猜活动名额。</q></div>
          </div>
        </Card>
      </div>

      <Card title="这条回答可以继续使用吗？" caption="只判断三件事：有没有答到客户问题、资料是否正确、有没有乱承诺。">
        <div className="brain-decision-row">
          <Button kind={decision === "good" ? "primary" : "default"} pressed={decision === "good"} onClick={() => { setDecision("good"); setRecorded(true); completeBrainTask("brain-trace"); notify("已记录：这条回答可以继续使用"); }}>回答可以使用</Button>
          <Button kind={decision === "problem" ? "danger" : "default"} pressed={decision === "problem"} onClick={() => { setDecision("problem"); setRecorded(false); reopenBrainTask("brain-trace"); }}>回答有问题</Button>
        </div>
        {decision === "problem" && (
          <div className="brain-problem-form">
            <label className="brain-field"><span>问题在哪里</span><textarea onChange={(event) => { setIssue(event.target.value); setRecorded(false); reopenBrainTask("brain-trace"); }} placeholder="例如：活动已经过期，不能继续引用" value={issue} /></label>
            <Button disabled={issue.trim().length < 6 || recorded} kind="primary" onClick={() => { setRecorded(true); completeBrainTask("brain-trace"); notify("问题已记录，等待资料补充"); }}>
              {recorded ? "问题已记录" : "记录这个问题"}
            </Button>
          </div>
        )}
        {recorded && <div className="brain-test-pass">✓ 本条回答已完成评价</div>}
      </Card>
    </div>
  );
}

export function BrainScreenContent({
  id,
  goTo,
  notify,
}: BrainScreenProps & { id: string }) {
  switch (id) {
    case "brain-today": return <BrainTodayScreen goTo={goTo} notify={notify} />;
    case "brain-import": return <BrainImportScreen goTo={goTo} notify={notify} />;
    case "brain-facts": return <BrainFactsScreen goTo={goTo} notify={notify} />;
    case "brain-guidance": return <BrainGuidanceScreen goTo={goTo} notify={notify} />;
    case "brain-assets": return <BrainAssetsScreen goTo={goTo} notify={notify} />;
    case "brain-gaps": return <BrainGapsScreen goTo={goTo} notify={notify} />;
    case "brain-trace": return <BrainTraceScreen goTo={goTo} notify={notify} />;
    default: return <div>企业大脑页面准备中</div>;
  }
}
