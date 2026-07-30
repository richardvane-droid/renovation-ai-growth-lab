"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allScreens,
  detailScreens,
  mainScreens,
  moduleMeta,
  ModuleKey,
} from "./prototype-data";
import { ScreenContent, WorkflowEventBridge } from "./prototype-screens";

const moduleOrder: ModuleKey[] = ["video", "sales", "recall"];
const phaseLabels: Record<string, string> = {
  引导流程: "首次设置，通常只做一次",
  每日任务: "每天制作视频时使用",
  每日运营: "每天检查和处理",
  自动能力: "按需开启的自动功能",
  详情页: "示例与详细记录",
};

type DetailContext = Record<string, string>;

type PageDemo = {
  src: string;
  title: string;
  duration: string;
};

const pageDemos: Partial<Record<string, PageDemo>> = {
  "video-slices": {
    src: "./demos/video-slices.mp4",
    title: "演示：只在本页上传实拍并检查拆分状态",
    duration: "12 秒",
  },
  "video-spokesperson": {
    src: "./demos/video-spokesperson.mp4",
    title: "演示：只在本页准备照片和 3 段出镜视频",
    duration: "12 秒",
  },
  "video-result": {
    src: "./demos/video-result.mp4",
    title: "演示：只在本页看完、核对并下载推荐版",
    duration: "12 秒",
  },
  "sales-training": {
    src: "./demos/sales-training.mp4",
    title: "演示：只在本页上传并核对门店资料",
    duration: "12 秒",
  },
  "sales-simulation": {
    src: "./demos/sales-simulation.mp4",
    title: "演示：只在本页评分并改正低分回答",
    duration: "12 秒",
  },
  "sales-prompt": {
    src: "./demos/sales-prompt.mp4",
    title: "演示：只在本页修改、试聊并应用说话规则",
    duration: "12 秒",
  },
  "sales-quality": {
    src: "./demos/sales-quality.mp4",
    title: "演示：只在本页核对一段可疑聊天",
    duration: "12 秒",
  },
  "sales-plugin-config": {
    src: "./demos/sales-plugin-config.mp4",
    title: "演示：只在本页配置、试运行并启用一项功能",
    duration: "12 秒",
  },
  "recall-activities": {
    src: "./demos/recall-activities.mp4",
    title: "演示：只在本页新增活动并提交审核",
    duration: "12 秒",
  },
  "recall-cadence": {
    src: "./demos/recall-cadence.mp4",
    title: "演示：只在本页检查一位客户的跟进节奏",
    duration: "12 秒",
  },
  "recall-poster": {
    src: "./demos/recall-poster.mp4",
    title: "演示：只在本页设置知识海报规则",
    duration: "12 秒",
  },
  "recall-coupon": {
    src: "./demos/recall-coupon.mp4",
    title: "演示：只在本页设置量房券规则",
    duration: "12 秒",
  },
  "recall-review": {
    src: "./demos/recall-review.mp4",
    title: "演示：只在本页核对并决定一条待发消息",
    duration: "12 秒",
  },
};

export default function PrototypeHub() {
  const [activeId, setActiveId] = useState("video-business");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [screenContexts, setScreenContexts] = useState<Record<string, DetailContext>>({});
  const [toast, setToast] = useState("");
  const screen = allScreens.find((item) => item.id === activeId) ?? allScreens[0];
  const pageDemo = pageDemos[screen.id];

  useEffect(() => {
    function syncPageFromAddress() {
      const id = window.location.hash.replace("#", "");
      if (allScreens.some((item) => item.id === id)) {
        setActiveId(id);
        setDetailsOpen(Boolean(detailScreens.find((item) => item.id === id)));
        const state = window.history.state as { detailContext?: DetailContext } | null;
        if (state?.detailContext && Object.keys(state.detailContext).length > 0) {
          setScreenContexts((current) => ({ ...current, [id]: state.detailContext ?? {} }));
        }
      }
    }

    const initialSync = window.setTimeout(syncPageFromAddress, 0);
    window.addEventListener("hashchange", syncPageFromAddress);
    window.addEventListener("popstate", syncPageFromAddress);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("hashchange", syncPageFromAddress);
      window.removeEventListener("popstate", syncPageFromAddress);
    };
  }, []);

  const moduleScreens = useMemo(
    () => mainScreens.filter((item) => item.module === screen.module),
    [screen.module],
  );
  const moduleDetails = useMemo(
    () => detailScreens.filter((item) => item.module === screen.module),
    [screen.module],
  );
  const currentMainIndex = Math.max(
    0,
    moduleScreens.findIndex((item) => item.id === (screen.detail ? screen.parent : screen.id)),
  );
  const nextScreen = moduleScreens[currentMainIndex + 1];

  function goTo(id: string, context: DetailContext = {}) {
    const target = allScreens.find((item) => item.id === id);
    if (!target) return;
    const resolvedContext =
      Object.keys(context).length > 0 ? context : (screenContexts[id] ?? {});
    setActiveId(id);
    if (Object.keys(resolvedContext).length > 0) {
      setScreenContexts((current) => ({ ...current, [id]: resolvedContext }));
    }
    setDetailsOpen(Boolean(target.detail));
    window.history.pushState({ detailContext: resolvedContext }, "", `#${id}`);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    notify("当前页面链接已复制，可直接发给团队");
  }

  return (
    <main className={`product-app module-${screen.module}`}>
      <WorkflowEventBridge />
      <aside className="sidebar">
        <div className="brand">
          <i>店</i>
          <div>
            <b>门店营销助手</b>
            <span>给全屋定制店长的操作演示</span>
          </div>
        </div>

        <p className="nav-heading">先选择今天要做的工作</p>
        <nav className="module-nav" aria-label="工作区">
          {moduleOrder.map((key) => (
            <button
              className={screen.module === key ? "active" : ""}
              key={key}
              onClick={() => goTo(mainScreens.find((item) => item.module === key)?.id ?? "")}
              type="button"
            >
              <i>{moduleMeta[key].index}</i>
              <span>
                <b>{moduleMeta[key].label}</b>
                <small>{moduleMeta[key].caption}</small>
              </span>
            </button>
          ))}
        </nav>

        <p className="nav-heading">{moduleMeta[screen.module].label} · 操作步骤</p>
        <nav className="screen-nav" aria-label={`${moduleMeta[screen.module].label}操作步骤`}>
          {moduleScreens.map((item) => (
            <button
              className={item.id === screen.id || item.id === screen.parent ? "active" : ""}
              key={item.id}
              onClick={() => goTo(item.id)}
              type="button"
            >
              <i>{item.id === screen.id || item.id === screen.parent ? "●" : "○"}</i>
              <span>{item.index}　{item.title}</span>
            </button>
          ))}
        </nav>

        <label className="mobile-step-picker">
          <span>选择本模块的操作步骤</span>
          <select
            aria-label="选择操作步骤"
            value={screen.detail ? screen.parent : screen.id}
            onChange={(event) => goTo(event.target.value)}
          >
            {moduleScreens.map((item) => (
              <option key={item.id} value={item.id}>
                第 {item.index} 步　{item.title}
              </option>
            ))}
          </select>
        </label>

        <button
          className="details-toggle"
          onClick={() => setDetailsOpen((value) => !value)}
          type="button"
        >
          <span>示例与详细记录 · {moduleDetails.length}</span>
          <i>{detailsOpen ? "−" : "+"}</i>
        </button>
        {detailsOpen && (
          <nav className="detail-nav" aria-label="关联详情页">
            {moduleDetails.map((item) => (
              <button
                className={item.id === screen.id ? "active" : ""}
                key={item.id}
                onClick={() => goTo(item.id)}
                type="button"
              >
                <i>{item.index}</i>
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
        )}

        <div className="sidebar-foot">
          <span>当前是可点击的演示页面</span>
          <b>放心试操作，不会联系真实客户</b>
          <small>姓名、金额、视频和数据均为示例</small>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <span>
              {moduleMeta[screen.module].label} / {phaseLabels[screen.phase] ?? screen.phase}
              {!screen.detail && ` / 第 ${screen.index} 步`}
            </span>
            <h1>{screen.title}</h1>
          </div>
          <div className="header-actions">
            <button onClick={copyLink} type="button">分享本页给同事</button>
            <span className={`phase phase-${screen.phase}`}>{phaseLabels[screen.phase] ?? screen.phase}</span>
            <i className="avatar">杜</i>
            <b>杜老板</b>
          </div>
        </header>

        <div className={`content-layout ${screen.detail ? "detail-mode" : ""}`}>
          <section className="workspace">
            {!screen.detail && <div className="task-head">
              <div>
                <h2>{taskTitle(screen.id, screen.title)}</h2>
                <p>{screen.summary}</p>
              </div>
              {nextScreen && (
                <button className="primary-action" onClick={() => goTo(nextScreen.id)} title="只切换到下一页示例，不会把当前步骤标为完成" type="button">
                  只看下一步示例：第 {nextScreen.index} 步
                </button>
              )}
            </div>}
            <div className="demo-notice" role="note">
              <b>演示数据</b>
              <span>页面里的客户、金额、视频和发送时间都只是示例。你可以放心点击，不会向真实客户发送消息；刷新页面会恢复初始演示状态。</span>
            </div>
            <div className="workspace-scroll">
              {allScreens.map((item) => {
                const context = screenContexts[item.id] ?? {};
                return (
                  <div
                    className="screen-content-cache"
                    hidden={item.id !== screen.id}
                    key={`${item.id}:${JSON.stringify(context)}`}
                  >
                    <ScreenContent
                      context={context}
                      screen={item}
                      goTo={goTo}
                      notify={notify}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {!screen.detail && <aside className="help-column">
            <section className="help-card goal-card">
              <h3>这一步做什么</h3>
              <p>{screen.summary}</p>
              <div>
                <span>大约用时：{screen.duration}</span>
                <span>完成后得到：{screen.output}</span>
                <span>{screen.detail ? "详细记录" : `第 ${Number(screen.index)} 步 / 共 ${moduleScreens.length} 步`}</span>
              </div>
            </section>
            <section className="help-card">
              <h3>照着这几步做</h3>
              <ol>
                {screen.instructions.map((item, index) => (
                  <li key={item}><i>{index + 1}</i><span>{item}</span></li>
                ))}
              </ol>
            </section>
            {pageDemo && (
              <section className="help-card page-demo-card">
                <h3>本页操作演示</h3>
                <p>只演示当前功能区：从哪里点、按什么顺序、看到什么表示完成。</p>
                <PageDemoVideo key={pageDemo.src} demo={pageDemo} />
              </section>
            )}
            <section className="help-card done-card">
              <h3>完成时应符合</h3>
              <ul>
                {screen.done.map((item) => <li key={item}><i>•</i><span>{item}</span></li>)}
              </ul>
            </section>
          </aside>}
        </div>
      </section>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function PageDemoVideo({ demo }: { demo: PageDemo }) {
  return (
    <div className="demo-player">
      <video controls playsInline preload="metadata" aria-label={demo.title}>
        <source src={demo.src} type="video/mp4" />
        你的浏览器暂时不能播放这段演示，可继续阅读上方图文步骤。
      </video>
      <b>{demo.title}</b>
      <span>约 {demo.duration}｜有字幕、无声音｜演示数据，不会真实发送</span>
    </div>
  );
}

function taskTitle(id: string, fallback: string) {
  const titles: Record<string, string> = {
    "video-business": "选好门店品类和能上门的城市",
    "video-label": "完成首批 10 条视频判断",
    "video-slices": "上传实拍并检查自动拆出的片段",
    "video-spokesperson": "按示范准备店长照片和 3 段视频",
    "video-top": "从最近 3 天视频里选 1 条参考",
    "video-report": "确认哪些拍法可以换成本店内容",
    "video-progress": "看制作是否正常，红色问题才需处理",
    "video-result": "从头验收推荐版，再下载发布",
    "sales-training": "放入价格、活动、区域和售后资料",
    "sales-champion": "放入并确认 10 段优秀销售聊天",
    "sales-simulation": "分别给 4 项打分，改正低分回答",
    "sales-prompt": "试聊后再应用机器人的说话规则",
    "sales-metrics": "看今天从新增企微到实际到店的结果",
    "sales-quality": "处理可能答错和到店意向高的聊天",
    "sales-faq": "先改问得多、客户满意度低的问题",
    "sales-plugins": "选择需要开启的自动接待功能",
    "sales-plugin-config": "用 4 个示例试运行，通过后再启用",
    "recall-activities": "新增活动，或检查已有活动还能不能用",
    "recall-metrics": "看哪些内容更容易让客户回复和到店",
    "recall-pool": "先处理今天到期和需要人工关注的客户",
    "recall-cadence": "检查发什么、隔多久、什么时候停止",
    "recall-plugins": "选择系统可以帮你生成的跟进内容",
    "recall-poster": "设置哪些客户收到哪类装修知识",
    "recall-coupon": "设置区域、有效期和每天可预约人数",
    "recall-review": "逐条确认今天准备发给客户的消息",
  };
  return titles[id] ?? fallback;
}
