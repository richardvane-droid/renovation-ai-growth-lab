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
const STEP_SECONDS = 3;
const DISCLAIMER = "当前页面演示 · 不会真实发送";

const pageDemos = [
  {
    id: "video-slices",
    accent: "#1677ff",
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
        action: ["核对片段数和建议用途", "确认系统没有漏掉关键画面"],
        result: "数量和用途都正常，再进入逐段核对。",
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
    title: "准备店长照片和 3 段出镜视频",
    steps: [
      {
        action: ["先核对出镜人和授权", "确认本人可随时撤回"],
        result: "授权状态清楚，才继续准备素材。",
        focus: [0.21, 0.7],
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
        result: "3 段视频全部完成，才算通过本页。",
        focus: [0.88, 0.66],
      },
    ],
  },
  {
    id: "video-result",
    accent: "#1677ff",
    title: "看完、核对并下载今天的推荐版",
    steps: [
      {
        action: ["先选“建议发布”的版本", "从头播放到结尾"],
        result: "状态从“还没有播放到结尾”变为“已看完”。",
        focus: [0.27, 0.43],
      },
      {
        action: ["再看右侧自动检查", "黄色或红色项目先处理"],
        result: "自动检查只作提示，不能代替人工验收。",
        focus: [0.75, 0.46],
      },
      {
        action: ["逐项完成 5 个人工确认", "价格、地区和隐私都要核对"],
        result: "全部勾选后，下载按钮才会解锁。",
        focus: [0.7, 0.31],
        source: "lower",
      },
      {
        action: ["按钮可用后再下载", "确认文件标有“建议发布”"],
        result: "看到下载开始，本页操作就完成了。",
        focus: [0.7, 0.52],
        source: "lower",
      },
    ],
  },
  {
    id: "sales-training",
    accent: "#2563eb",
    title: "上传并核对门店资料",
    steps: [
      {
        action: ["点“上传最新门店资料”", "一次放入一种清楚的文件"],
        result: "上传后，本页会显示系统正在读取。",
        focus: [0.87, 0.24],
      },
      {
        action: ["检查四类资料是否齐全", "价格、活动、区域、售后都要有"],
        result: "缺少的资料会在卡片中直接提示。",
        focus: [0.54, 0.39],
      },
      {
        action: ["先处理黄色“待核对”", "不要把旧价格直接交给机器人"],
        result: "看到有效期和来源，才算可以使用。",
        focus: [0.48, 0.52],
      },
      {
        action: ["确认出现“检查资料”入口", "演示在进入详情前结束"],
        result: "本页只负责上传、读取和发现待核对项。",
        focus: [0.76, 0.56],
      },
    ],
  },
  {
    id: "sales-simulation",
    accent: "#2563eb",
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
        action: ["找到右侧低分原因", "按提示改成门店可以兑现的话"],
        result: "改写必须有依据，不能增加承诺。",
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
        action: ["选择合格、发现问题或转人工", "一次只作一个结论"],
        result: "看到聊天状态更新，本页操作完成。",
        focus: [0.65, 0.8],
        source: "lower",
      },
    ],
  },
  {
    id: "sales-plugin-config",
    accent: "#2563eb",
    title: "配置、试运行并启用一项功能",
    steps: [
      {
        action: ["左侧一次只选 1 项功能", "先看清楚它会自动做什么"],
        result: "右侧配置区会切换到当前功能。",
        focus: [0.17, 0.43],
      },
      {
        action: ["核对触发条件和使用资料", "不确定的资料不要勾选"],
        result: "触发条件和数据来源都要可解释。",
        focus: [0.55, 0.45],
      },
      {
        action: ["先保存草稿", "不要配置完就直接启用"],
        result: "保存后仍不会影响真实客户。",
        focus: [0.4, 0.84],
        source: "lower",
      },
      {
        action: ["用 4 个示例试运行", "全部通过后再启用"],
        result: "看到“已启用”，当前功能才正式完成。",
        focus: [0.61, 0.84],
        source: "lower",
      },
    ],
  },
  {
    id: "recall-activities",
    accent: "#d97706",
    title: "新增活动并提交审核",
    steps: [
      {
        action: ["先填活动名称、时间和权益", "每一项都按门店真实规则填写"],
        result: "右侧已有活动可用来对照格式。",
        focus: [0.22, 0.43],
      },
      {
        action: ["填写人数和适用范围", "不要只写“名额有限”"],
        result: "系统必须知道具体还能接待多少人。",
        focus: [0.22, 0.67],
      },
      {
        action: ["上传本活动自己的海报", "检查日期和权益是否一致"],
        result: "海报内容不能和表单规则冲突。",
        focus: [0.22, 0.53],
        source: "lower",
      },
      {
        action: ["先保存草稿，再提交审核", "提交不等于立即发给客户"],
        result: "看到“等待审核”，本页操作完成。",
        focus: [0.22, 0.83],
        source: "lower",
      },
    ],
  },
  {
    id: "recall-cadence",
    accent: "#d97706",
    title: "检查一位客户的跟进节奏",
    steps: [
      {
        action: ["左侧选择 1 位尚未发送的客户", "不要混着检查多人"],
        result: "右侧只显示这位客户的当前计划。",
        focus: [0.19, 0.47],
      },
      {
        action: ["读清楚发什么、为什么发", "确认内容对客户有用"],
        result: "不合适的内容先修改，不急着批准。",
        focus: [0.72, 0.43],
      },
      {
        action: ["检查距离上次联系的间隔", "过近时直接改天数"],
        result: "页面会重新计算下一次发送时间。",
        focus: [0.62, 0.36],
        source: "lower",
      },
      {
        action: ["确认停止条件，再提交审核", "客户回复或拒绝时必须停止"],
        result: "看到“等待店长审核”，本页操作完成。",
        focus: [0.81, 0.36],
        source: "lower",
      },
    ],
  },
  {
    id: "recall-poster",
    accent: "#d97706",
    title: "设置知识海报生成规则",
    steps: [
      {
        action: ["先选客户所处阶段", "不同阶段不要共用一套内容"],
        result: "右侧预览会按阶段变化。",
        focus: [0.24, 0.39],
      },
      {
        action: ["再选知识主题和制作口径", "一次只解决一个装修问题"],
        result: "标题应让客户一眼知道能学到什么。",
        focus: [0.24, 0.52],
      },
      {
        action: ["核对门店资料和客户信息开关", "客户隐私默认不要带入"],
        result: "只使用已确认、仍有效的门店资料。",
        focus: [0.24, 0.68],
      },
      {
        action: ["看右侧预览，再保存规则", "不要在没看预览时直接保存"],
        result: "看到“规则已保存”，本页操作完成。",
        focus: [0.23, 0.87],
        source: "lower",
      },
    ],
  },
  {
    id: "recall-coupon",
    accent: "#d97706",
    title: "设置量房券规则",
    steps: [
      {
        action: ["填写权益、服务区域和有效期", "不要使用模糊承诺"],
        result: "右侧券面会同步显示客户将看到的话。",
        focus: [0.24, 0.44],
      },
      {
        action: ["填写每天和每周可预约人数", "人数必须是正整数"],
        result: "容量写清楚，系统才不会超发。",
        focus: [0.24, 0.68],
      },
      {
        action: ["选择预约名额从哪里读取", "优先使用门店接待表"],
        result: "找不到可靠数据时，不允许自动发券。",
        focus: [0.24, 0.83],
      },
      {
        action: ["核对右侧预览，再保存规则", "保存不会立刻发给客户"],
        result: "看到“规则已保存”，本页操作完成。",
        focus: [0.35, 0.89],
        source: "lower",
      },
    ],
  },
  {
    id: "recall-review",
    accent: "#d97706",
    title: "核对并决定一条待发消息",
    steps: [
      {
        action: ["左侧只选 1 位客户", "先看本条消息为什么待审核"],
        result: "右侧会显示这位客户将收到的原话。",
        focus: [0.22, 0.55],
      },
      {
        action: ["核对消息、附件和发送时间", "确认不会立即发送"],
        result: "还要检查服务范围、活动和可约名额。",
        focus: [0.72, 0.45],
      },
      {
        action: ["先解决黄色“还没核对”", "点本页核对按钮并看结果"],
        result: "黄色项目变绿后，批准按钮才会解锁。",
        focus: [0.84, 0.63],
        source: "lower",
      },
      {
        action: ["选择批准、修改或只跳过本条", "本演示不混入永久停止流程"],
        result: "看到当前消息状态更新，本页操作完成。",
        focus: [0.6, 0.75],
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
    if (demo.steps.some((step) => step.source === "lower")) {
      await access(path.join(sourceDir, `${demo.id}-lower.png`));
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
    const source = step.source === "lower"
      ? await readFile(path.join(sourceDir, `${demo.id}-lower.png`))
      : mainSource;
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
      console.log(`已生成 ${path.relative(repoRoot, outputPath)}（仅演示 ${demo.title}）`);
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[演示视频生成失败]\n${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
