"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allScreens,
  mainScreens,
  moduleMeta,
  ModuleKey,
  Screen,
} from "./prototype-data";
import { resetWorkflowDemo, ScreenContent, WorkflowEventBridge } from "./prototype-screens";
import AccountAccess, { type AccessAccount } from "./account-access";

const moduleOrder: ModuleKey[] = ["video", "sales", "recall"];
const phaseLabels: Record<string, string> = {
  引导流程: "首次设置",
  每日任务: "今天要做",
  每日运营: "今天要做",
  自动能力: "设置与工具",
  资料设置: "设置与工具",
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
  "sales-plugins": {
    src: "./demos/sales-plugins.mp4",
    title: "配置、试运行并启用一项功能",
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
};

export default function StoreMarketingApp() {
  const [account, setAccount] = useState<AccessAccount | null>(null);

  if (!account) {
    return (
      <AccountAccess
        onAccessGranted={(nextAccount) => {
          setAccount(nextAccount);
          window.history.replaceState(null, "", "#video-top");
        }}
      />
    );
  }

  return (
    <PrototypeHub
      account={account}
      onSignOut={() => {
        resetWorkflowDemo();
        setAccount(null);
        window.history.replaceState(null, "", "#login");
      }}
    />
  );
}

function PrototypeHub({
  account,
  onSignOut,
}: {
  account: AccessAccount;
  onSignOut: () => void;
}) {
  const [activeId, setActiveId] = useState("video-top");
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
    () => mainScreens.filter((item) => item.module === screen.module && !item.parent),
    [screen.module],
  );
  const dailyScreens = useMemo(
    () => moduleScreens.filter((item) => item.cadence === "daily"),
    [moduleScreens],
  );
  const setupScreens = useMemo(
    () => moduleScreens.filter((item) => item.cadence === "setup"),
    [moduleScreens],
  );
  const activeMainId = navigationRootId(screen.id);
  const activeMainScreen = moduleScreens.find((item) => item.id === activeMainId);
  const setupIsActive = activeMainScreen?.cadence === "setup";

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

  function moduleLanding(key: ModuleKey) {
    return (
      mainScreens.find((item) => item.module === key && item.cadence === "daily") ??
      mainScreens.find((item) => item.module === key)
    );
  }

  function stepButton(item: Screen) {
    const isActive = item.id === activeMainId;
    return (
      <button
        aria-current={isActive ? "page" : undefined}
        className={isActive ? "active" : ""}
        key={item.id}
        onClick={() => goTo(item.id)}
        type="button"
      >
        <i>{isActive ? "●" : "○"}</i>
        <span>{item.index}　{item.title}</span>
      </button>
    );
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
              onClick={() => goTo(moduleLanding(key)?.id ?? "")}
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

        <div className="task-nav-groups">
          <section className="daily-nav">
            <div className="task-nav-title">
              <b>今天要做</b>
              <small>每天从这里开始</small>
            </div>
            <nav className="screen-nav" aria-label={`${moduleMeta[screen.module].label}今天要做`}>
              {dailyScreens.map(stepButton)}
            </nav>
          </section>

          <details className="setup-nav" key={screen.module} open={setupIsActive}>
            <summary>
              <span>
                <b>设置与工具</b>
                <small>首次使用或资料变化时再打开</small>
              </span>
            </summary>
            <nav className="screen-nav" aria-label={`${moduleMeta[screen.module].label}设置与工具`}>
              {setupScreens.map(stepButton)}
            </nav>
          </details>
        </div>

        <label className="mobile-step-picker">
          <span>选择要做的事</span>
          <select
            aria-label="选择要做的事"
            value={activeMainId}
            onChange={(event) => goTo(event.target.value)}
          >
            <optgroup label="今天要做">
              {dailyScreens.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="设置与工具（低频）">
              {setupScreens.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="account-summary">
          <div>
            <b>{account.storeName}</b>
            <span>{account.contact} · 已开通</span>
          </div>
          <button onClick={onSignOut} type="button">退出</button>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <span>
              {moduleMeta[screen.module].label} · {phaseLabels[screen.phase] ?? screen.phase}
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

function navigationRootId(id: string) {
  let current = allScreens.find((item) => item.id === id);
  const seen = new Set<string>();

  while (current?.parent && !seen.has(current.id)) {
    seen.add(current.id);
    current = allScreens.find((item) => item.id === current?.parent) ?? current;
  }

  return current?.id ?? id;
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
