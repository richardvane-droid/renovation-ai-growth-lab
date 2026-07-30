"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allScreens,
  detailScreens,
  mainScreens,
  moduleMeta,
  ModuleKey,
} from "./prototype-data";
import { ScreenContent } from "./prototype-screens";

const moduleOrder: ModuleKey[] = ["video", "sales", "recall"];

export default function PrototypeHub() {
  const [activeId, setActiveId] = useState("video-business");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const screen = allScreens.find((item) => item.id === activeId) ?? allScreens[0];

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (allScreens.some((item) => item.id === id)) {
      setActiveId(id);
      setDetailsOpen(Boolean(detailScreens.find((item) => item.id === id)));
    }
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

  function goTo(id: string) {
    const target = allScreens.find((item) => item.id === id);
    if (!target) return;
    setActiveId(id);
    setDetailsOpen(Boolean(target.detail));
    window.history.replaceState(null, "", `#${id}`);
    document.querySelector(".workspace-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
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
      <aside className="sidebar">
        <div className="brand">
          <i>AI</i>
          <div>
            <b>营销增长工作台</b>
            <span>单模块任务模式 · V4</span>
          </div>
        </div>

        <p className="nav-heading">增长链路</p>
        <nav className="module-nav" aria-label="增长链路">
          {moduleOrder.map((key) => (
            <button
              className={screen.module === key ? "active" : ""}
              key={key}
              onClick={() => goTo(mainScreens.find((item) => item.module === key)?.id ?? "")}
              type="button"
            >
              <i>{moduleMeta[key].index}</i>
              <span>{moduleMeta[key].label}</span>
            </button>
          ))}
        </nav>

        <p className="nav-heading">
          {moduleMeta[screen.module].label} · {moduleMeta[screen.module].caption}
        </p>
        <nav className="screen-nav" aria-label={`${moduleMeta[screen.module].label}页面`}>
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

        <button
          className="details-toggle"
          onClick={() => setDetailsOpen((value) => !value)}
          type="button"
        >
          <span>关联详情页 · {moduleDetails.length}</span>
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
          <span>原型覆盖</span>
          <b>25 个主页面 + 15 个详情页</b>
          <small>真实案例与业务模拟数据</small>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div>
            <span>
              {moduleMeta[screen.module].label} / {screen.phase} / {screen.detail ? "详情" : screen.index}
            </span>
            <h1>{screen.title}</h1>
          </div>
          <div className="header-actions">
            <button onClick={copyLink} type="button">复制此页链接</button>
            <span className={`phase phase-${screen.phase}`}>{screen.phase}</span>
            <i className="avatar">杜</i>
            <b>杜老板</b>
          </div>
        </header>

        <div className="content-layout">
          <section className="workspace">
            <div className="task-head">
              <div>
                <h2>{screen.detail ? screen.title : taskTitle(screen.id, screen.title)}</h2>
                <p>{screen.summary}</p>
              </div>
              {!screen.detail && nextScreen && (
                <button className="primary-action" onClick={() => goTo(nextScreen.id)} type="button">
                  下一步：{nextScreen.title}
                </button>
              )}
            </div>
            <div className="workspace-scroll">
              <ScreenContent screen={screen} goTo={goTo} notify={notify} />
            </div>
          </section>

          <aside className="help-column">
            <section className="help-card goal-card">
              <h3>本页目标：{goalTitle(screen.id, screen.title)}</h3>
              <p>{screen.summary}</p>
              <div>
                <span>预计 {screen.duration}</span>
                <span>产出：{screen.output}</span>
                <span>{screen.phase} {screen.detail ? "" : `${screen.index}/${moduleScreens.length}`}</span>
              </div>
            </section>
            <section className="help-card">
              <h3>操作说明</h3>
              <ol>
                {screen.instructions.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>
            <section className="help-card">
              <h3>{screen.detail ? "关联内容" : "演示视频"}</h3>
              <button
                className="demo-video"
                onClick={() => notify(screen.detail ? "关联业务资料已展开" : "演示视频将在正式产品中播放")}
                type="button"
              >
                {screen.detail ? "客户画像｜业务数据｜操作记录" : "▶　02:18　查看完整操作"}
              </button>
            </section>
            <section className="help-card done-card">
              <h3>完成标准</h3>
              <ul>
                {screen.done.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
              {screen.detail ? (
                <button onClick={() => goTo(screen.parent ?? moduleScreens[0].id)} type="button">
                  返回{moduleScreens.find((item) => item.id === screen.parent)?.title ?? "主列表"}
                </button>
              ) : nextScreen ? (
                <button onClick={() => goTo(nextScreen.id)} type="button">
                  下一步：{nextScreen.title}
                </button>
              ) : (
                <button onClick={() => goTo(moduleScreens[0].id)} type="button">
                  返回本模块第一页
                </button>
              )}
            </section>
          </aside>
        </div>
      </section>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function taskTitle(id: string, fallback: string) {
  const titles: Record<string, string> = {
    "video-business": "设置主营品类与服务区域",
    "video-label": "标注首批 10 条匹配视频",
    "video-slices": "上传并管理门店真实装修素材",
    "video-spokesperson": "建立可复用的门店代言人素材",
    "video-top": "浏览并选择今日竞品爆款",
    "video-report": "阅读爆款自然量结构拆解报告",
    "video-progress": "查看视频生成流水线与实时日志",
    "video-result": "验收今日成片并完成质量检查",
    "sales-training": "建立机器人可信销售知识库",
    "sales-champion": "提交并拆解 10 段销冠真实对话",
    "sales-simulation": "完成 100 组模拟演练标注",
    "sales-prompt": "编辑机器人整体风格与承诺边界",
    "sales-metrics": "查看从加企微到实际到店的数据",
    "sales-quality": "逐个质检机器人真实对话",
    "sales-faq": "优先优化提问最频繁的问题",
    "sales-plugins": "选择并管理自动对话插件",
    "sales-plugin-config": "配置插件触发条件与人工兜底",
    "recall-activities": "维护可安全调用的活动与海报",
    "recall-metrics": "分析过去召回效果与七次触达表现",
    "recall-pool": "管理正在召回的客户",
    "recall-cadence": "设计并审核七次个性化触达计划",
    "recall-plugins": "管理知识海报与免费量房券插件",
    "recall-poster": "配置客户阶段驱动的知识海报",
    "recall-coupon": "配置可核销的免费上门测量券",
    "recall-review": "审核待发送内容与停止规则",
  };
  return titles[id] ?? fallback;
}

function goalTitle(id: string, fallback: string) {
  const goals: Record<string, string> = {
    "video-business": "建立准确的业务画像",
    "video-label": "让系统理解什么内容真正匹配业务",
    "video-slices": "把真实视频整理成可复用片段",
    "video-spokesperson": "形成稳定可用的代言人素材",
    "video-top": "选出当天最值得参考的视频",
    "video-report": "理解爆款结构，而不是复制内容",
    "video-progress": "清楚看到视频正在完成到哪一步",
    "video-result": "得到可以直接发布的合格成片",
    "sales-training": "让机器人的回答都有可信依据",
    "sales-champion": "学习优秀销售推进客户到店的方法",
    "sales-simulation": "把人工判断变成机器人规则",
    "sales-prompt": "明确机器人怎么说、什么不能说",
    "sales-metrics": "掌握从加企微到到店的整体效率",
    "sales-quality": "判断机器人在真实聊天中的表现",
    "sales-faq": "先修正客户问得最多的问题",
    "sales-plugins": "用自动能力完成报价、量房与信息收集",
    "sales-plugin-config": "让插件在可信边界内自动运行",
    "recall-activities": "保证召回调用的是有效活动",
    "recall-metrics": "知道什么内容和节奏最有效",
    "recall-pool": "找到最值得人工关注的召回客户",
    "recall-cadence": "用七次触达逐步恢复客户信任",
    "recall-plugins": "为不同阶段匹配合适的召回工具",
    "recall-poster": "先提供有用知识，再推动客户行动",
    "recall-coupon": "安全地把高意向客户推进到量房",
    "recall-review": "阻止错误承诺与过度打扰",
  };
  return goals[id] ?? fallback;
}
