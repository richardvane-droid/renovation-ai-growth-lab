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

  assert.match(html, /页面里的客户、金额、视频和发送时间都只是示例/);
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
    "sales-prompt.mp4",
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
