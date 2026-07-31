"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allScreens,
  mainScreens,
  moduleMeta,
  ModuleKey,
} from "./prototype-data";
import { ScreenContent, WorkflowEventBridge } from "./prototype-screens";

const moduleOrder: ModuleKey[] = ["video", "sales", "recall"];
const phaseLabels: Record<string, string> = {
  引导流程: "首次设置",
  每日任务: "每天使用",
  每日运营: "每天查看",
  自动能力: "按需设置",
  详情页: "详细记录",
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
    title: "上传实拍并检查拆分状态",
    duration: "12 秒",
  },
  "video-spokesperson": {
    src: "./demos/video-spokesperson.mp4",
    title: "准备照片和 3 段出镜视频",
    duration: "12 秒",
  },
  "video-result": {
    src: "./demos/video-result.mp4",
    title: "看完、核对并下载推荐版",
    duration: "12 秒",
  },
  "sales-training": {
    src: "./demos/sales-training.mp4",
    title: "上传并核对门店资料",
    duration: "12 秒",
  },
  "sales-simulation": {
    src: "./demos/sales-simulation.mp4",
    title: "评分并改正低分回答",
    duration: "12 秒",
  },
  "sales-quality": {
    src: "./demos/sales-quality.mp4",
    title: "核对一段可疑聊天",
    duration: "12 秒",
  },
  "sales-plugin-config": {
    src: "./demos/sales-plugin-config.mp4",
    title: "配置、试运行并启用一项功能",
    duration: "12 秒",
  },
  "recall-activities": {
    src: "./demos/recall-activities.mp4",
    title: "新增活动并提交审核",
    duration: "12 秒",
  },
  "recall-cadence": {
    src: "./demos/recall-cadence.mp4",
    title: "检查一位客户的跟进节奏",
    duration: "12 秒",
  },
  "recall-poster": {
    src: "./demos/recall-poster.mp4",
    title: "设置知识海报规则",
    duration: "12 秒",
  },
  "recall-coupon": {
    src: "./demos/recall-coupon.mp4",
    title: "设置量房券规则",
    duration: "12 秒",
  },
  "recall-review": {
    src: "./demos/recall-review.mp4",
    title: "核对并决定一条待发消息",
    duration: "12 秒",
  },
};

export default function PrototypeHub() {
  const [activeId, setActiveId] = useState("video-business");
  const [screenContexts, setScreenContexts] = useState<Record<string, DetailContext>>({});
  const [toast, setToast] = useState("");
  const screen = allScreens.find((item) => item.id === activeId) ?? allScreens[0];
  const pageDemo = pageDemos[screen.id];

  useEffect(() => {
    function syncPageFromAddress() {
      const id = window.location.hash.replace("#", "");
      if (allScreens.some((item) => item.id === id)) {
        setActiveId(id);
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

  function goTo(id: string, context: DetailContext = {}) {
    const target = allScreens.find((item) => item.id === id);
    if (!target) return;
    const resolvedContext =
      Object.keys(context).length > 0 ? context : (screenContexts[id] ?? {});
    setActiveId(id);
    if (Object.keys(resolvedContext).length > 0) {
      setScreenContexts((current) => ({ ...current, [id]: resolvedContext }));
    }
    window.history.pushState({ detailContext: resolvedContext }, "", `#${id}`);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
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

        <p className="nav-heading">工作区</p>
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

        <p className="nav-heading">步骤</p>
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

      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <span>
              {moduleMeta[screen.module].label} · {phaseLabels[screen.phase] ?? screen.phase}
              {!screen.detail && ` · 第 ${screen.index} 步`}
            </span>
            <h1>{screen.title}</h1>
            <p>{screen.summary}</p>
            <small>约 {screen.duration} · 完成后得到：{screen.output}</small>
          </div>
        </header>

        <div className={`content-layout ${screen.detail ? "detail-mode" : ""}`}>
          <section className="workspace">
            <div className="demo-notice" role="note">
              <b>演示模式</b>
              <span>不会联系真实客户；刷新页面可恢复初始数据。</span>
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
            <section className="help-card guide-card">
              <h3>操作要点</h3>
              <ol>
                {screen.instructions.map((item, index) => (
                  <li key={item}><i>{index + 1}</i><span>{item}</span></li>
                ))}
              </ol>
              <div className="completion-inline">
                <b>完成标准</b>
                <span>{screen.done.join(" · ")}</span>
              </div>
            </section>
            {pageDemo && (
              <section className="help-card page-demo-card">
                <h3>本页演示</h3>
                <PageDemoVideo key={pageDemo.src} demo={pageDemo} />
              </section>
            )}
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
      <span>{demo.duration} · 有字幕，无声音</span>
    </div>
  );
}
