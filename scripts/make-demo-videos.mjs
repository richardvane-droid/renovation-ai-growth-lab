#!/usr/bin/env node

import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const runFile = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceDir = path.join(scriptDir, "demo-sources");
const outputDir = path.join(repoRoot, "public", "demos");
const ffmpegBin = process.env.FFMPEG_PATH || "ffmpeg";

const WIDTH = 1280;
const HEIGHT = 720;
const SOURCE_WIDTH = 742;
const SOURCE_HEIGHT = 752;
const CROP_HEIGHT = Math.floor((SOURCE_WIDTH * HEIGHT) / WIDTH);
const STEP_SECONDS = 5;
const DISCLAIMER = "当前页面演示 · 不会真实发送";

const pageDemos = [
  {
    id: "video-slices",
    accent: "#1677ff",
    posterAt: 7.5,
    title: "上传实拍并检查自动拆出的片段",
    steps: [
      {
        action: ["点“上传门店视频”", "只上传本店已获授权的实拍"],
        result: "上传后，这一页会出现文件和处理状态。",
        focus: [0.87, 0.24],
      },
      {
        action: ["先看“处理状态”", "分析中时不用重复上传"],
        result: "看到“分析完成”，才继续检查片段。",
        focus: [0.52, 0.37],
      },
      {
        action: ["核对片段数和画面内容", "确认系统没有漏掉关键画面"],
        result: "数量和画面说明都正常，本页检查完成。",
        focus: [0.66, 0.48],
      },
      {
        action: ["确认右侧出现“检查片段”入口", "演示在跳转前结束"],
        result: "这一页的上传和分析状态已经检查完成。",
        focus: [0.91, 0.43],
      },
    ],
  },
  {
    id: "video-spokesperson",
    accent: "#1677ff",
    posterAt: 10.5,
    title: "准备店长照片和 3 段出镜视频",
    steps: [
      {
        action: ["先核对出镜人和授权", "确认本人可随时撤回"],
        result: "授权状态清楚，才继续准备素材。",
        focus: [0.21, 0.88],
      },
      {
        action: ["检查“正面讲话”", "光线、距离和时长都要合格"],
        result: "看到“已完成”，这一项才算准备好。",
        focus: [0.73, 0.39],
      },
      {
        action: ["再检查“自然动作”", "不要漏传第二段"],
        result: "两项都显示完成，再处理最后一段。",
        focus: [0.73, 0.52],
      },
      {
        action: ["上传“不同语气示范”", "上传后等待本页给出检查结果"],
        result: "看到“已上传，等待检查”，本页上传已完成。",
        focus: [0.88, 0.66],
      },
    ],
  },
  {
    id: "video-result",
    accent: "#1677ff",
    posterAt: 4.5,
    title: "看完、核对并下载今天的推荐版",
    steps: [
      {
        action: ["先播放“第 3 版（建议发布）”", "从头播放到结尾"],
        result: "状态从“还没有播放到结尾”变为“已播放到结尾”。",
        focus: [0.27, 0.43],
      },
      {
        action: ["再看右侧自动检查", "黄色或红色项目先处理"],
        result: "自动检查结果只供下载前参考。",
        focus: [0.75, 0.46],
      },
      {
        action: ["确认没有黄色或红色提示", "有异常时先修改或重新生成"],
        result: "自动检查全部为绿色，再准备下载。",
        focus: [0.75, 0.57],
        source: "lower",
      },
      {
        action: ["点“下载第 3 版”", "确认当前页签标有“建议发布”"],
        result: "看到“今日成片-第3版.mp4”开始下载，本页完成。",
        focus: [0.75, 0.61],
        source: "lower",
      },
    ],
  },
  {
    id: "sales-training",
    accent: "#2563eb",
    posterAt: 7.5,
    title: "上传并核对门店资料",
    steps: [
      {
        action: ["点“上传最新门店资料”", "一次放入一种清楚的文件"],
        result: "上传后，本页会显示系统正在读取。",
        focus: [0.87, 0.24],
      },
      {
        action: ["检查 5 类资料是否齐全", "价格、活动、材料、区域、售后都要有"],
        result: "缺少的资料会在卡片中直接提示。",
        focus: [0.54, 0.39],
      },
      {
        action: ["先找黄色“需要你确认”", "不要把旧价格直接交给机器人"],
        result: "本页会直接标出待核对或说法不一致的资料。",
        focus: [0.48, 0.52],
      },
      {
        action: ["确认黄色资料出现核对入口", "演示在点击入口前结束"],
        result: "本页只负责上传、读取和发现待核对项。",
        focus: [0.76, 0.56],
      },
    ],
  },
  {
    id: "sales-simulation",
    accent: "#2563eb",
    posterAt: 7.5,
    title: "给回答评分并改正低分项",
    steps: [
      {
        action: ["先读客户问题和机器人回答", "不要只看总分"],
        result: "先判断回答是否真正解决客户问题。",
        focus: [0.26, 0.4],
      },
      {
        action: ["分别给 4 项打分", "每项都必须选择 1 到 5 分"],
        result: "页面会自动算出本题总分。",
        focus: [0.28, 0.77],
      },
      {
        action: ["出现 2 分后填写正确回答", "按门店资料改成可以兑现的话"],
        result: "低分题必须写出正确说法，不能增加承诺。",
        focus: [0.55, 0.75],
        source: "lower",
      },
      {
        action: ["保存正确回答，再做下一题", "确认本题状态已经更新"],
        result: "看到本题已保存，当前页面操作完成。",
        focus: [0.55, 0.87],
        source: "lower",
      },
    ],
  },
  {
    id: "sales-quality",
    accent: "#2563eb",
    posterAt: 4.5,
    title: "核对一段可能答错的聊天",
    steps: [
      {
        action: ["先在左侧选 1 段聊天", "优先处理“待店长检查”"],
        result: "右侧只显示当前选中的完整对话。",
        focus: [0.23, 0.45],
      },
      {
        action: ["对照客户问题和回答依据", "确认没有瞎报价格或名额"],
        result: "依据不足时不能直接判为合格。",
        focus: [0.72, 0.48],
      },
      {
        action: ["写至少 6 个字的判断理由", "说明为什么合格或哪里有问题"],
        result: "有具体意见，按钮才允许提交。",
        focus: [0.75, 0.68],
        source: "lower",
      },
      {
        action: ["需要人工核价时", "点“交给真人销售”"],
        result: "看到负责人和截止时间，本页处理完成。",
        focus: [0.65, 0.8],
        source: "lower",
      },
    ],
  },
  {
    id: "sales-plugins",
    accent: "#2563eb",
    posterAt: 7.5,
    title: "配置、试运行并启用一项功能",
    steps: [
      {
        action: ["先从卡片中选 1 项服务", "查看客户会收到的内容"],
        result: "客户预览会在卡片列表下方展开。",
        focus: [0.25, 0.55],
      },
      {
        action: ["确认预览后打开设置表", "本页一次只展开一项服务"],
        result: "设置表会出现在同一页下方，不会跳去另一个流程。",
        focus: [0.28, 0.6],
      },
      {
        action: ["修改内容会自动保存草稿", "再用 4 个示例试运行"],
        result: "试运行前不会影响真实客户。",
        focus: [0.3, 0.55],
        source: "lower",
      },
      {
        action: ["确认 4 个结果都正确", "再点“确认结果后启用”"],
        result: "卡片显示“使用中”，这项服务才完成。",
        focus: [0.58, 0.55],
        source: "lower",
      },
    ],
  },
  {
    id: "recall-poster",
    accent: "#d97706",
    posterAt: 1.5,
    title: "设置知识海报生成规则",
    steps: [
      {
        action: ["先选客户所处阶段", "不同阶段不要共用一套内容"],
        result: "右侧预览会按阶段变化。",
        focus: [0.24, 0.23],
      },
      {
        action: ["再选知识主题和制作口径", "一次只解决一个装修问题"],
        result: "标题应让客户一眼知道能学到什么。",
        focus: [0.24, 0.36],
      },
      {
        action: ["核对门店资料和客户信息开关", "只使用客户已经提供的信息"],
        result: "系统还会检查资料是否仍然有效。",
        focus: [0.24, 0.52],
      },
      {
        action: ["看右侧预览，再保存规则", "不要在没看预览时直接保存"],
        result: "看到“规则已保存”，本页操作完成。",
        focus: [0.5, 0.67],
      },
    ],
  },
  {
    id: "recall-coupon",
    accent: "#d97706",
    posterAt: 10.5,
    title: "设置量房券规则",
    steps: [
      {
        action: ["填写权益、服务区域和有效期", "不要使用模糊承诺"],
        result: "右侧券面会同步显示客户将看到的话。",
        focus: [0.24, 0.44],
      },
      {
        action: ["填写本店每天可预约人数", "人数必须是正整数"],
        result: "容量写清楚，系统才不会超发。",
        focus: [0.24, 0.56],
      },
      {
        action: ["选择预约名额从哪里读取", "优先使用门店接待表"],
        result: "找不到可靠数据时，不允许自动发券。",
        focus: [0.24, 0.67],
      },
      {
        action: ["核对右侧预览，再保存规则", "保存不会立刻发给客户"],
        result: "看到“规则已保存”，本页操作完成。",
        focus: [0.5, 0.12],
        source: "lower",
      },
    ],
  },
  {
    id: "brain-import",
    accent: "#7c3aed",
    posterAt: 10.5,
    title: "核对并确认一份企业资料",
    steps: [
      {
        action: ["先点一份黄色或红色资料", "绿色资料不用逐份检查"],
        result: "下方显示这份资料需要店长处理的内容。",
        focus: [0.53, 0.42],
      },
      {
        action: ["核对系统改写前后的说法", "确认没有夸大价格或服务承诺"],
        result: "改写后的内容符合门店当前实际情况。",
        focus: [0.24, 0.67],
        source: "lower",
      },
      {
        action: ["核对系统分好的三类", "确认 20 + 9 + 7 一共是 36 条"],
        result: "价格、回答和规则三类与资料内容一致。",
        focus: [0.72, 0.49],
        source: "lower",
      },
      {
        action: ["点“确认这 36 条内容并使用”", "确认后会自动供其他功能使用"],
        result: "资料状态变为“可以使用”，本页完成。",
        focus: [0.15, 0.93],
        source: "lower",
      },
    ],
  },
  {
    id: "brain-gaps",
    accent: "#7c3aed",
    posterAt: 10.5,
    title: "补齐事实并生成可靠回答",
    steps: [
      {
        action: ["先看客户最常问的问题", "确认这确实是本店需要补的答案"],
        result: "本页只处理“PET 门板靠灶台”这一件事。",
        focus: [0.48, 0.25],
      },
      {
        action: ["按门店资料填写 4 项事实", "最后写清依据来自哪份资料"],
        result: "五项内容都填写清楚，生成按钮可以点击。",
        focus: [0.5, 0.47],
        source: "lower",
      },
      {
        action: ["点“资料齐全，生成回答草稿”", "资料不齐时不要猜着填写"],
        result: "页面下方出现一份待检查的回答草稿。",
        focus: [0.16, 0.85],
        source: "lower",
      },
      {
        action: ["核对草稿，再点“确认无误”", "确认前不会用于真实客户"],
        result: "状态变为“已审核并开始使用”，本页完成。",
        focus: [0.12, 0.91],
        source: "draft",
      },
    ],
  },
  {
    id: "brain-trace",
    accent: "#7c3aed",
    posterAt: 7.5,
    title: "核对一条机器人回答",
    steps: [
      {
        action: ["先读客户问了什么", "不要只看客户后来有没有继续聊"],
        result: "确认客户问的是 568 元套餐包含项。",
        focus: [0.25, 0.42],
      },
      {
        action: ["再读机器人最终回答", "检查是否答到问题、有没有乱承诺"],
        result: "回答说明了包含项、不包含项和下一步。",
        focus: [0.28, 0.56],
      },
      {
        action: ["核对右侧列出的门店依据", "每一句关键信息都要找得到来源"],
        result: "价格、套餐和说法都有当前可用的依据。",
        focus: [0.75, 0.48],
      },
      {
        action: ["确认无误后点“回答可以使用”", "有问题时改选旁边的红色按钮"],
        result: "看到“本条回答已完成评价”，本页完成。",
        focus: [0.1, 0.88],
        source: "lower",
      },
    ],
  },
];

const obsoleteModuleVideos = [
  "video-growth.mp4",
  "sales-assistant.mp4",
  "customer-followup.mp4",
  "sales-prompt.mp4",
  "recall-activities.mp4",
  "recall-cadence.mp4",
  "recall-review.mp4",
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgTextLines(lines, { x, y, size, weight, color, gap }) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * gap}" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(line)}</text>`,
    )
    .join("\n");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function frameGeometry(step) {
  const focusSourceX = step.focus[0] * SOURCE_WIDTH;
  const focusSourceY = step.focus[1] * SOURCE_HEIGHT;
  const cropTop = Math.round(
    clamp(focusSourceY - CROP_HEIGHT / 2, 0, SOURCE_HEIGHT - CROP_HEIGHT),
  );
  const focusX = Math.round((focusSourceX / SOURCE_WIDTH) * WIDTH);
  const focusY = Math.round(((focusSourceY - cropTop) / CROP_HEIGHT) * HEIGHT);
  const captionAtTop = focusY > HEIGHT * 0.57;

  return {
    cropTop,
    focusX,
    focusY,
    captionAtTop,
  };
}

function makeOverlaySvg(demo, step, stepIndex, geometry) {
  const total = demo.steps.length;
  const panelY = geometry.captionAtTop ? 0 : 500;
  const labelY = panelY + 43;
  const actionY = panelY + 91;
  const resultY = panelY + 196;
  const actionGap = 46;
  const progress = Math.round(((stepIndex + 1) / total) * 270);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>
        <linearGradient id="panel" x1="0" y1="${geometry.captionAtTop ? 1 : 0}" x2="0" y2="${geometry.captionAtTop ? 0 : 1}">
          <stop offset="0" stop-color="#07111f" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#07111f" stop-opacity="0.98"/>
        </linearGradient>
        <filter id="ringShadow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <rect x="0" y="${panelY}" width="${WIDTH}" height="220" fill="url(#panel)"/>
      <rect x="34" y="${labelY - 28}" width="250" height="38" rx="19" fill="${demo.accent}"/>
      <text x="159" y="${labelY - 1}" text-anchor="middle" font-size="22" font-weight="800" fill="#ffffff" font-family="PingFang SC, Hiragino Sans GB, sans-serif">
        本页操作 ${stepIndex + 1} / ${total}
      </text>
      <text x="1244" y="${labelY - 1}" text-anchor="end" font-size="21" font-weight="650" fill="#d8e1ec" font-family="PingFang SC, Hiragino Sans GB, sans-serif">
        ${DISCLAIMER}
      </text>

      <g font-family="PingFang SC, Hiragino Sans GB, sans-serif">
        ${svgTextLines(step.action, {
          x: 36,
          y: actionY,
          size: 36,
          weight: 800,
          color: "#ffffff",
          gap: actionGap,
        })}
        <text x="36" y="${resultY}" font-size="25" font-weight="600" fill="#cbd8e8">
          完成标志：${escapeXml(step.result)}
        </text>
      </g>

      <rect x="974" y="${labelY + 21}" width="270" height="7" rx="4" fill="#ffffff" fill-opacity="0.18"/>
      <rect x="974" y="${labelY + 21}" width="${progress}" height="7" rx="4" fill="${demo.accent}"/>

      <g filter="url(#ringShadow)">
        <circle cx="${geometry.focusX}" cy="${geometry.focusY}" r="42" fill="${demo.accent}" fill-opacity="0.2" stroke="#ffffff" stroke-width="6"/>
        <circle cx="${geometry.focusX}" cy="${geometry.focusY}" r="19" fill="${demo.accent}" stroke="#ffffff" stroke-width="5"/>
        <path d="M ${geometry.focusX + 28} ${geometry.focusY + 22} l 29 53 10 -22 23 -8 z" fill="#ffffff" stroke="#111827" stroke-width="3" stroke-linejoin="round"/>
      </g>
    </svg>
  `;
}

async function assertFfmpeg() {
  try {
    await runFile(ffmpegBin, ["-version"], { maxBuffer: 2 * 1024 * 1024 });
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        `未找到 ffmpeg。请先安装 ffmpeg，或通过 FFMPEG_PATH 指定可执行文件路径后重试。\n例如：FFMPEG_PATH=/opt/homebrew/bin/ffmpeg node scripts/make-demo-videos.mjs`,
      );
    }
    throw new Error(`ffmpeg 无法运行：${error?.stderr || error?.message || error}`);
  }
}

async function assertSources() {
  await access(path.join(outputDir, "finished-kitchen-video.mp4"));
  for (const demo of pageDemos) {
    await access(path.join(sourceDir, `${demo.id}.png`));
    const sourceVariants = new Set(demo.steps.map((step) => step.source).filter(Boolean));
    for (const variant of sourceVariants) {
      await access(path.join(sourceDir, `${demo.id}-${variant}.png`));
    }
  }
}

async function renderPageDemo(demo, tempRoot) {
  const frameDir = path.join(tempRoot, demo.id);
  await mkdir(frameDir, { recursive: true });
  const sourcePath = path.join(sourceDir, `${demo.id}.png`);
  const mainSource = await readFile(sourcePath);
  const metadata = await sharp(mainSource).metadata();

  if (metadata.width !== SOURCE_WIDTH || metadata.height !== SOURCE_HEIGHT) {
    throw new Error(
      `${demo.id}.png 尺寸应为 ${SOURCE_WIDTH}×${SOURCE_HEIGHT}，实际为 ${metadata.width}×${metadata.height}`,
    );
  }

  const frameNames = [];
  for (let index = 0; index < demo.steps.length; index += 1) {
    const step = demo.steps[index];
    const source = step.source
      ? await readFile(path.join(sourceDir, `${demo.id}-${step.source}.png`))
      : mainSource;
    const sourceMetadata = await sharp(source).metadata();
    if (sourceMetadata.width !== SOURCE_WIDTH || sourceMetadata.height !== SOURCE_HEIGHT) {
      throw new Error(
        `${demo.id}${step.source ? `-${step.source}` : ""}.png 尺寸应为 ${SOURCE_WIDTH}×${SOURCE_HEIGHT}，实际为 ${sourceMetadata.width}×${sourceMetadata.height}`,
      );
    }
    const geometry = frameGeometry(step);
    const frameName = `step-${String(index + 1).padStart(2, "0")}.png`;
    const framePath = path.join(frameDir, frameName);
    const screenshot = await sharp(source)
      .extract({
        left: 0,
        top: geometry.cropTop,
        width: SOURCE_WIDTH,
        height: CROP_HEIGHT,
      })
      .resize(WIDTH, HEIGHT)
      .toBuffer();
    const overlay = Buffer.from(makeOverlaySvg(demo, step, index, geometry));

    await sharp(screenshot)
      .composite([{ input: overlay }])
      .png({ compressionLevel: 9 })
      .toFile(framePath);
    frameNames.push(frameName);
  }

  const concatLines = [];
  for (const frameName of frameNames) {
    concatLines.push(`file '${frameName}'`);
    concatLines.push(`duration ${STEP_SECONDS}`);
  }
  concatLines.push(`file '${frameNames.at(-1)}'`);
  await writeFile(
    path.join(frameDir, "steps.txt"),
    `${concatLines.join("\n")}\n`,
    "utf8",
  );

  const outputPath = path.join(outputDir, `${demo.id}.mp4`);
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "steps.txt",
    "-vf",
    "fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "22",
    "-movflags",
    "+faststart",
    "-t",
    String(demo.steps.length * STEP_SECONDS),
    "-an",
    outputPath,
  ];

  try {
    await runFile(ffmpegBin, args, {
      cwd: frameDir,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")
      .slice(-12)
      .join("\n");
    throw new Error(`生成 ${demo.id}.mp4 失败。\n${detail}`);
  }

  return outputPath;
}

async function renderDemoPoster(demo, videoPath) {
  const previewDir = path.join(repoRoot, "public", "video-previews");
  const outputPath = path.join(previewDir, `demo-${demo.id}.jpg`);
  await mkdir(previewDir, { recursive: true });
  await runFile(ffmpegBin, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(demo.posterAt),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    outputPath,
  ], { maxBuffer: 10 * 1024 * 1024 });
  return outputPath;
}

async function main() {
  await assertFfmpeg();
  await mkdir(outputDir, { recursive: true });
  await assertSources();
  const tempRoot = await mkdtemp(path.join(tmpdir(), "renovation-page-demos-"));

  try {
    for (const fileName of obsoleteModuleVideos) {
      await rm(path.join(outputDir, fileName), { force: true });
    }

    for (const demo of pageDemos) {
      const outputPath = await renderPageDemo(demo, tempRoot);
      const posterPath = await renderDemoPoster(demo, outputPath);
      console.log(
        `已生成 ${path.relative(repoRoot, outputPath)} 和 ${path.relative(repoRoot, posterPath)}（仅演示 ${demo.title}）`,
      );
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[演示视频生成失败]\n${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
