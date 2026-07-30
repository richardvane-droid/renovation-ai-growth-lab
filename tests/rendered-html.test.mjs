import assert from "node:assert/strict";
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
  assert.match(html, /demos\/video-growth\.mp4/);
  assert.match(html, /还要检查 10 段/);
  assert.match(html, /保存量房券规则/);

  assert.doesNotMatch(html, /V4 交互原型/);
  assert.doesNotMatch(html, /codex-preview/i);
});
