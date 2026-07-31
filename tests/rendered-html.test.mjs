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

test("server-renders the paid account entrance", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();

  assert.match(
    html,
    /<title>AKKE｜门店营销助手｜V4\.1 交互原型<\/title>/,
  );
  assert.match(
    html,
    /<meta name="description" content="AKKE 全屋定制门店营销助手的操作演示，包含短视频获客、企微自动接待和沉默客户跟进。页面均为演示数据，不会向真实客户发送消息。"\s*\/?>/,
  );

  assert.match(html, /门店营销助手/);
  assert.match(html, />登录<\/h1>/);
  assert.match(html, />注册新门店<\/button>/);
  assert.match(html, /paid@demo\.cn \/ 123456/);
  assert.match(html, /new@demo\.cn \/ 123456/);

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
    "recall-coupon.mp4",
    "recall-poster.mp4",
    "sales-plugins.mp4",
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

test("uses real video frames for every video preview", async () => {
  const [pageSource, screenSource, detailSource, mappingSource, css, sourceManifestText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-details.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/video-preview-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/video-preview-sources.json", import.meta.url), "utf8"),
  ]);
  const sourceManifest = JSON.parse(sourceManifestText);
  const expectedTitles = [
    "33㎡钻石厨房：台面多出 1.8 米",
    "118㎡原木风全屋定制完工实拍",
    "568 元/㎡套餐到底包含什么",
    "8㎡儿童房收纳翻倍方案",
    "ENF 板材怎么选：三个误区",
    "安装现场：柜门缝隙做到 2mm",
    "奶油风翻车的 5 个细节",
    "旧房翻新先做柜体还是水电",
    "同户型改造前后动线对比",
    "店长带看：漳州龙文展厅",
  ];

  assert.equal(sourceManifest.stockFrames.length, 16);
  assert.equal(sourceManifest.localVideoFrames.length, 10);
  for (const title of expectedTitles) {
    assert.match(mappingSource, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const item of [...sourceManifest.stockFrames, ...sourceManifest.localVideoFrames]) {
    const image = await readFile(new URL(`../${item.file}`, import.meta.url));
    assert.ok(
      image[0] === 0xff && image[1] === 0xd8 && image.at(-2) === 0xff && image.at(-1) === 0xd9,
      `${item.file} must be a complete JPEG frame`,
    );
  }

  assert.match(pageSource, /poster=\{demo\.poster\}/);
  assert.match(screenSource, /videoPosterForTitle\(video\.title\)/);
  assert.match(screenSource, /slicePosterByFileName/);
  assert.match(screenSource, /spokespersonPosterByMaterial/);
  assert.match(screenSource, /extractVideoPreview\(file: File\)/);
  assert.match(screenSource, /canvas\.toDataURL\("image\/jpeg"/);
  assert.match(screenSource, /暂时无法提取预览/);
  assert.match(detailSource, /videoPosterForTitle\(title\)/);
  assert.match(detailSource, /sliceSegmentPosters\[index\]/);
  assert.match(detailSource, /spokespersonPosterByMaterial/);
  assert.match(detailSource, /poster="\.\/video-previews\/finished-kitchen\.jpg"/);
  assert.doesNotMatch(screenSource, /EmptyCover/);
  assert.doesNotMatch(css, /\.cover-[1-6]\s*\{/);
  assert.match(css, /\.media-cover > img\s*\{[\s\S]*?object-fit:\s*cover/);
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
  assert.match(css, /\.detail-main\s*\{[\s\S]*?border:\s*0/);
  assert.match(css, /\.detail-main\s*\{[\s\S]*?padding:\s*0/);
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

test("switches 02-05 between the enterprise WeChat QR and cloud computer status", async () => {
  const [screenSource, dataSource, css] = await Promise.all([
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(screenSource, /function WecomCloudStatus\(\)/);
  assert.match(screenSource, /const \[loggedIn, setLoggedIn\] = useState\(false\)/);
  assert.match(screenSource, /企业微信登录二维码演示/);
  assert.match(screenSource, /企业微信还未登录/);
  assert.match(screenSource, /下方为上次同步的数据，登录后会自动更新/);
  assert.match(screenSource, /企业微信已连接，云电脑工作中/);
  assert.match(screenSource, /<dt>门店账号<\/dt><dd>漳州龙文店<\/dd>/);
  assert.match(screenSource, /<dt>工作状态<\/dt><dd>正在接待<\/dd>/);
  assert.match(screenSource, /<dt>最近更新<\/dt><dd>今天 15:20<\/dd>/);
  assert.match(screenSource, /仅演示：查看已登录状态/);
  assert.match(screenSource, /<WecomCloudStatus \/>[\s\S]*className="filter-bar"/);
  assert.match(dataSource, /先确认企业微信显示“正在接待”；看到二维码时先让门店员工扫码登录/);
  assert.match(dataSource, /企业微信已连接，云电脑显示“正在接待”/);
  assert.match(css, /\.wecom-login-state\s*\{[\s\S]*?grid-template-columns:\s*176px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?\.wecom-login-state,[\s\S]*?grid-template-columns:\s*1fr/);
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
  assert.match(screenSource, /const \[uploadedSamples, setUploadedSamples\]/);
  assert.match(screenSource, /新记录在列表第一条/);
  assert.match(screenSource, /到店（随文件读出）/);
  assert.match(screenSource, /setUploadedSamples/);
  assert.match(screenSource, /const samples = \[\.\.\.uploadedSamples, \.\.\.baseSamples\]/);

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
  assert.match(screenSource, /const checks = \[/);
  assert.match(screenSource, /const allChecksPassed = missingChecks\.length === 0/);
  assert.match(screenSource, /hasEnoughContent && allChecksPassed && hasChanges/);
  assert.match(screenSource, /不会只按字数判定/);
  assert.doesNotMatch(screenSource, /加一条规则/);
  assert.doesNotMatch(screenSource, /先用 3 段对话试一试/);
  assert.doesNotMatch(screenSource, /3 段示例试聊已通过/);

  assert.match(dataSource, /修改完成后点“提交并应用”/);
  assert.doesNotMatch(dataSource, /先用 3 段示例对话试聊/);
  assert.doesNotMatch(pageSource, /demos\/sales-prompt\.mp4/);
});

test("puts daily work first and folds low-frequency setup out of the way", async () => {
  const [pageSource, dataSource, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(pageSource, /useState\("video-top"\)/);
  assert.match(pageSource, /item\.module === key && item\.cadence === "daily"/);
  assert.match(pageSource, />今天要做<\/b>/);
  assert.match(pageSource, /每天从这里开始/);
  assert.match(pageSource, /<details className="setup-nav"/);
  assert.match(pageSource, />设置与工具<\/b>/);
  assert.match(pageSource, /首次使用或资料变化时再打开/);
  assert.match(pageSource, /<optgroup label="今天要做">/);
  assert.match(pageSource, /<optgroup label="设置与工具（低频）">/);
  assert.doesNotMatch(pageSource, /第 \$\{screen\.index\} 步/);

  assert.match(dataSource, /caption: "做今天的视频"/);
  assert.match(dataSource, /caption: "看今天的接待"/);
  assert.match(dataSource, /caption: "处理今天的跟进"/);
  assert.doesNotMatch(dataSource, /caption: "[89] 步"/);
  assert.match(
    dataSource,
    /id: "recall-activities"[\s\S]*?cadence: "setup"/,
  );
  assert.match(
    dataSource,
    /id: "recall-pool"[\s\S]*?cadence: "daily"/,
  );

  assert.match(css, /\.task-nav-groups\s*\{/);
  assert.match(css, /\.setup-nav\s*\{[\s\S]*?border-top:/);
  assert.match(css, /\.setup-nav \.screen-nav button\s*\{[\s\S]*?color: var\(--muted\)/);
});

test("gates the product behind registration, login, and a clear demo payment", async () => {
  const [accountSource, pageSource, css] = await Promise.all([
    readFile(new URL("../app/account-access.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(accountSource, /type AccessView = "login" \| "register" \| "payment" \| "success"/);
  assert.match(accountSource, /paid@demo\.cn/);
  assert.match(accountSource, /new@demo\.cn/);
  assert.match(accountSource, /注册并前往开通/);
  assert.match(accountSource, /一次性开通费/);
  assert.match(accountSource, /¥1,000/);
  assert.match(accountSource, /微信支付/);
  assert.match(accountSource, /支付宝/);
  assert.match(accountSource, /演示支付，不会真实扣款/);
  assert.match(accountSource, /disabled=\{!paymentAgreed\}/);
  assert.match(accountSource, /onAccessGranted\(pendingAccount\)/);
  assert.match(accountSource, /window\.sessionStorage/);
  assert.match(accountSource, /route === "payment" && paymentReady/);
  assert.match(accountSource, /storedRegistration\.paid/);
  assert.match(accountSource, /paid: true/);
  assert.match(pageSource, /if \(!account\)/);
  assert.match(pageSource, /<AccountAccess/);
  assert.match(pageSource, /onSignOut/);
  assert.match(pageSource, /resetWorkflowDemo\(\)/);
  assert.match(
    await readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    /export function resetWorkflowDemo\(\)/,
  );
  assert.match(css, /\.account-access\s*\{/);
  assert.match(css, /\.account-access-payment,/);
});

test("keeps 02-08 and 02-09 in one service page", async () => {
  const [screenSource, dataSource, pageSource] = await Promise.all([
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(screenSource, /openSettings/);
  assert.match(screenSource, /<PluginConfigScreen/);
  assert.match(screenSource, /收起设置/);
  assert.doesNotMatch(screenSource, /case "sales-plugin-config"/);
  assert.doesNotMatch(screenSource, /goTo\("sales-plugin-config"/);
  assert.doesNotMatch(dataSource, /id: "sales-plugin-config"/);
  assert.doesNotMatch(pageSource, /sales-plugin-config/);
  assert.match(pageSource, /demos\/sales-plugins\.mp4/);
  assert.match(screenSource, /信息不够时怎么办/);
  assert.match(screenSource, /setup\.needsPriceTable/);
  assert.match(screenSource, /setup\.needsServiceRegion/);
  assert.match(screenSource, /setPreviewIndex\(null\)/);
  assert.match(screenSource, /setConfigIndex\(null\)/);
  assert.match(screenSource, /修改会自动保存为草稿/);
  assert.match(dataSource, /修改会自动保存为草稿；再用 4 个正反示例试运行/);
  assert.doesNotMatch(screenSource, /还差 2 项设置/);
  assert.doesNotMatch(screenSource, /使用哪个活动/);
  assert.doesNotMatch(screenSource, /className="flow-steps"/);
});

test("nests 03-06 and 03-07 under 03-05 and removes the approval branch", async () => {
  const [screenSource, detailSource, dataSource, pageSource] = await Promise.all([
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-details.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(dataSource, /id: "recall-poster"[\s\S]*?parent: "recall-plugins"/);
  assert.match(dataSource, /id: "recall-coupon"[\s\S]*?parent: "recall-plugins"/);
  assert.match(pageSource, /mainScreens\.filter\(\(item\) => item\.module === screen\.module && !item\.parent\)/);
  assert.doesNotMatch(dataSource, /id: "recall-review"/);
  assert.doesNotMatch(dataSource, /id: "recall-review-detail"/);
  assert.doesNotMatch(screenSource, /case "recall-review"/);
  assert.doesNotMatch(screenSource, /function ReviewScreen/);
  assert.doesNotMatch(detailSource, /RecallReviewDetail/);
  assert.doesNotMatch(detailSource, /只提交这一条给店长审核/);
  assert.match(screenSource, /保存并设为可使用/);
  assert.doesNotMatch(dataSource, /两项子设置|单独的功能入口/);
  assert.doesNotMatch(screenSource, /03-05 下的一项设置/);
  assert.doesNotMatch(screenSource, /defaultChecked disabled/);
  assert.match(screenSource, /posterStatus: "使用中"/);
  assert.match(screenSource, /workflowMemory\.posterStatus = "已保存并使用"/);
  assert.match(screenSource, /本店每天最多可预约多少户/);
  assert.doesNotMatch(screenSource, /厦门每天最多可预约多少户/);
});

test("merges 03-04 into D13 and removes unsupported detail actions", async () => {
  const [screenSource, detailSource, dataSource] = await Promise.all([
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-details.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(dataSource, /id: "recall-cadence",/);
  assert.doesNotMatch(screenSource, /case "recall-cadence"/);
  assert.doesNotMatch(screenSource, /function CadenceScreen/);
  assert.match(dataSource, /id: "recall-customer-detail"[\s\S]*?查看客户并安排后续内容/);
  assert.match(dataSource, /id: "recall-cadence-detail"[\s\S]*?parent: "recall-customer-detail"/);
  assert.match(detailSource, /以前怎么沟通/);
  assert.match(detailSource, /接下来发送什么/);
  assert.match(detailSource, /客户明确拒绝，停止自动联系/);
  assert.doesNotMatch(detailSource, /继续按原计划自动跟进/);
  assert.doesNotMatch(detailSource, /按原计划继续/);
  assert.doesNotMatch(detailSource, /转给销售继续跟进/);
  assert.doesNotMatch(detailSource, /交给销售人工查看/);
  assert.doesNotMatch(detailSource, /不选这条，继续看下一条/);
  assert.doesNotMatch(detailSource, /声音还是不对，只重做口播/);
  assert.match(detailSource, /保存并放回客户计划/);
  assert.match(detailSource, /到设定时间自动发送/);
  assert.doesNotMatch(detailSource, /保存这条消息设计/);
  assert.match(screenSource, /cadenceUpdateKey\(customerName, touchNumber\)/);
  assert.match(screenSource, /demo-cadence-message-status-request/);
  assert.match(detailSource, /const examples: Record<string/);
  assert.match(detailSource, /demo-cadence-message-status-response/);
  assert.match(detailSource, /demo-cadence-source-status-response/);
  assert.match(detailSource, /来源已暂停/);
  assert.match(detailSource, /资料已暂停，不能修改/);
});

test("keeps the 02-03 score rule internally consistent", async () => {
  const [screenSource, dataSource] = await Promise.all([
    readFile(new URL("../app/prototype-screens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(screenSource, /\(scores\[item\] \?\? 5\) < 3/);
  assert.match(screenSource, /有 2 分或以下/);
  assert.match(dataSource, /低于 3 分/);
  assert.doesNotMatch(screenSource, /有 3 分或以下/);
});
