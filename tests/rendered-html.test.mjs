import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the store marketing assistant", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();

  assert.match(
    html,
    /<title>门店营销助手｜全屋定制店长操作演示<\/title>/,
  );
  assert.match(
    html,
    /<meta name="description" content="给全屋定制店长的操作演示，包含短视频获客、企微自动接待和沉默客户跟进。页面均为演示数据，不会向真实客户发送消息。"\s*\/?>/,
  );

  assert.match(html, />门店营销助手<\/b>/);
  assert.match(html, />短视频获客<\/b>/);
  assert.match(html, />企微自动接待<\/b>/);
  assert.match(html, />沉默客户跟进<\/b>/);

  assert.match(html, /演示模式/);
  assert.match(html, /刷新页面可恢复初始数据/);
  assert.match(html, /不会向真实客户发送消息/);
  assert.match(html, /还要检查 10 段/);
  assert.match(html, /保存量房券规则/);

  assert.doesNotMatch(html, /看一遍再操作/);
  assert.doesNotMatch(html, /本页操作演示/);
  assert.doesNotMatch(html, /demos\/video-growth\.mp4/);
  assert.doesNotMatch(html, /demos\/sales-assistant\.mp4/);
  assert.doesNotMatch(html, /demos\/customer-followup\.mp4/);
  assert.doesNotMatch(html, /V4 交互原型/);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("ships only page-specific operation demos", async () => {
  const expected = [
    "recall-activities.mp4",
    "recall-cadence.mp4",
    "recall-coupon.mp4",
    "recall-poster.mp4",
    "recall-review.mp4",
    "sales-plugin-config.mp4",
    "sales-quality.mp4",
    "sales-simulation.mp4",
    "sales-training.mp4",
    "video-result.mp4",
    "video-slices.mp4",
    "video-spokesperson.mp4",
  ];
  const demoDir = new URL("../public/demos/", import.meta.url);
  const files = (await readdir(demoDir)).filter(
    (file) => file !== "finished-kitchen-video.mp4",
  );
  assert.deepEqual(files.sort(), expected);

  const pageSource = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  for (const file of expected) {
    assert.match(pageSource, new RegExp(`\\./demos/${file.replace(".", "\\.")}`));
  }
  assert.match(pageSource, /<PageDemoVideo key=\{pageDemo\.src\}/);
  assert.doesNotMatch(pageSource, /DemoVideo module=/);
  assert.doesNotMatch(pageSource, /Record<ModuleKey,\s*\{\s*src:/);
});

test("uses one continuous page scroll instead of a boxed inner scroller", async () => {
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const productBlock = css.match(/\.product-app\s*\{[^}]+\}/s)?.[0] ?? "";
  const mainBlock = css.match(/\.app-main\s*\{[^}]+\}/s)?.[0] ?? "";
  const workspaceBlock = css.match(/\.workspace\s*\{[^}]+\}/s)?.[0] ?? "";
  const scrollBlock = css.match(/\.workspace-scroll\s*\{[^}]+\}/s)?.[0] ?? "";

  assert.doesNotMatch(productBlock, /(?:^|\n)\s*height:\s*100vh/);
  assert.doesNotMatch(mainBlock, /(?:^|\n)\s*height:\s*100vh/);
  assert.match(workspaceBlock, /border:\s*0/);
  assert.match(workspaceBlock, /overflow:\s*visible/);
  assert.match(scrollBlock, /border:\s*0/);
  assert.match(scrollBlock, /overflow:\s*visible/);
  assert.doesNotMatch(scrollBlock, /overflow:\s*auto/);
});

test("keeps the shared page structure concise", async () => {
  const pageSource = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(pageSource, />操作要点<\/h3>/);
  assert.match(pageSource, /className="completion-inline"/);
  assert.match(pageSource, />演示模式<\/b>/);
  assert.doesNotMatch(pageSource, /taskTitle\(/);
  assert.doesNotMatch(pageSource, /goal-card/);
  assert.doesNotMatch(pageSource, /done-card/);
  assert.doesNotMatch(pageSource, /details-toggle/);
  assert.doesNotMatch(pageSource, /示例与详细记录 ·/);
  assert.doesNotMatch(pageSource, /演示：只在本页/);
  assert.doesNotMatch(pageSource, /复制本页链接/);
  assert.doesNotMatch(pageSource, /杜老板/);
});

test("marks each sales reply as borrowable by default and keeps reviews per conversation", async () => {
  const [detailSource, screenSource, dataSource] = await Promise.all([
    readFile(new URL("../app/prototype-details.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(detailSource, /saved\[lineKey\] \?\? "borrowable"/);
  assert.match(detailSource, /speaker === "销售顾问"/);
  assert.match(detailSource, /aria-pressed=\{lineDecision === "borrowable"\}/);
  assert.match(detailSource, /✓ 可借鉴/);
  assert.match(detailSource, /不建议借鉴/);
  assert.match(detailSource, /客户原话只作背景，不会作为销售话术/);
  assert.match(detailSource, /整段都不参与学习/);

  assert.match(screenSource, /championLineDecisions: \{\} as Record<string, Record<string, ChampionLineDecision>>/);
  assert.match(screenSource, /\["demo-champion-line-decision"\]/);
  assert.match(screenSource, /conversationId: row\[0\]/);
  assert.match(screenSource, /lineDecisions: JSON\.stringify\(lineDecisions\)/);

  assert.match(dataSource, /销售回复默认可借鉴；不妥的句子改为“不建议借鉴”/);
  assert.match(dataSource, /逐句确认这段销售聊天/);
});

test("lets step 02-04 edit rules and submit directly", async () => {
  const [pageSource, screenSource, dataSource] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(screenSource, /直接修改机器人说话规则/);
  assert.match(screenSource, /提交并应用/);
  assert.match(screenSource, /setAppliedText\(text\)/);
  assert.doesNotMatch(screenSource, /加一条规则/);
  assert.doesNotMatch(screenSource, /先用 3 段对话试一试/);
  assert.doesNotMatch(screenSource, /3 段示例试聊已通过/);

  assert.match(dataSource, /修改完成后点“提交并应用”/);
  assert.doesNotMatch(dataSource, /先用 3 段示例对话试聊/);
  assert.doesNotMatch(pageSource, /demos\/sales-prompt\.mp4/);
});
