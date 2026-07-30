#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const runFile = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(repoRoot, "public", "demos");
const ffmpegBin = process.env.FFMPEG_PATH || "ffmpeg";

const WIDTH = 1280;
const HEIGHT = 720;
const SLIDE_SECONDS = 4;
const DISCLAIMER = "演示数据，不会真实发送";

const demos = [
  {
    fileName: "video-growth.mp4",
    module: "短视频获客",
    accent: "#36d399",
    accentSoft: "#123d35",
    slides: [
      {
        kicker: "每天的视频任务",
        title: "从同行热门视频，到本店可发布成片",
        lines: ["只学结构，不抄内容", "系统制作，店长最后确认"],
      },
      {
        kicker: "第 1 步",
        title: "先看同行视频，再选 1 条参考",
        lines: ["看开头是否吸引人", "看节奏和客户最关心的问题", "不会复制对方画面和文案"],
      },
      {
        kicker: "第 2 步",
        title: "把每一段换成本店真实素材",
        lines: ["同行案例 → 本店工地或完工案例", "对方出镜人 → 已授权的本店店长", "对方活动 → 本店真实价格和服务地区"],
      },
      {
        kicker: "第 3 步",
        title: "系统自动完成制作",
        lines: ["改写文案 → 选素材 → 生成口播", "合成字幕和画面 → 自动检查", "可以离开页面，完成后会提醒"],
      },
      {
        kicker: "第 4 步",
        title: "店长从头到尾检查成片",
        lines: ["人物和声音是否自然", "产品、价格、服务区域是否正确", "字幕和门店标识是否清楚"],
      },
      {
        kicker: "完成",
        title: "确认没问题，再下载发布",
        lines: ["发现问题：标记时间点并重新生成", "确认无误：下载推荐版成片", "自动检查不能代替人工验收"],
      },
    ],
  },
  {
    fileName: "finished-kitchen-video.mp4",
    module: "本店成片示例",
    accent: "#36d399",
    accentSoft: "#123d35",
    slideSeconds: 7,
    slides: [
      {
        kicker: "开头先说客户能得到什么",
        title: "33㎡厨房，台面多出 1.8 米",
        lines: ["演示成片 · 虚构案例", "不代表所有户型都能增加相同长度"],
      },
      {
        kicker: "客户原来的难题",
        title: "转角浪费，两个人做饭会挤",
        lines: ["普通直角柜深处不好拿", "冰箱、洗切和烹饪动线互相打架"],
      },
      {
        kicker: "本店给出的方案",
        title: "用钻石转角接出台面",
        lines: ["转角柜更容易打开和拿取", "尺寸要以现场测量和设计图为准"],
      },
      {
        kicker: "再给客户看细节",
        title: "高低台、封边和五金都拍清楚",
        lines: ["展示本店实际工艺", "不借用别家客户和工地画面"],
      },
      {
        kicker: "完工后从同一位置对比",
        title: "走动顺了，常用物品也更好拿",
        lines: ["画面为门店场景演示", "最终效果因户型和需求而异"],
      },
      {
        kicker: "结尾只邀请下一步",
        title: "回复“厨房”，领取规划清单",
        lines: ["有大有小 · 漳州龙文店", "演示视频，不含真实客户信息"],
      },
    ],
  },
  {
    fileName: "sales-assistant.mp4",
    module: "企微自动接待",
    accent: "#60a5fa",
    accentSoft: "#142f54",
    slides: [
      {
        kicker: "安全回复流程",
        title: "放入门店资料 → 自动回复 → 人工接手",
        lines: ["有依据才回答", "高风险问题交给真人"],
      },
      {
        kicker: "第 1 步",
        title: "先上传门店可信资料",
        lines: ["套餐价格和包含项", "活动时间、可接待人数和门店地址", "服务地区与不能承诺的事项"],
      },
      {
        kicker: "第 2 步",
        title: "系统先听懂客户在问什么",
        lines: ["预算、风格、户型和时间", "报价异议、活动咨询或到店意向", "信息不够时先追问，不急着承诺"],
      },
      {
        kicker: "第 3 步",
        title: "只有查到依据，才给明确答案",
        lines: ["价格从最新门店价格表中查", "活动名额从每日接待表中查", "查不到就明确交给销售确认"],
      },
      {
        kicker: "第 4 步",
        title: "高风险情况立即交给真人",
        lines: ["投诉、退款和特殊折扣", "资料冲突或客户明确要求人工", "暂停自动回复，并提醒销售接管"],
      },
      {
        kicker: "完成",
        title: "每次回复都能查看用了哪份资料",
        lines: ["查看系统根据哪份门店资料回答", "修改后的答案会保留记录", "店长确认后才会用于新客户"],
      },
    ],
  },
  {
    fileName: "customer-followup.mp4",
    module: "沉默客户跟进",
    accent: "#f59e0b",
    accentSoft: "#513716",
    slides: [
      {
        kicker: "低打扰跟进流程",
        title: "选客户 → 排时间 → 发送前确认",
        lines: ["先提供有用信息", "不连续催单，不越界承诺"],
      },
      {
        kicker: "第 1 步",
        title: "先找出适合继续跟进的客户",
        lines: ["查看客户阶段和最后一次联系", "区分暂缓、比价、预算犹豫等情况", "明确拒绝的客户不进入自动跟进"],
      },
      {
        kicker: "第 2 步",
        title: "为每位客户生成低频跟进计划",
        lines: ["先发户型、收纳或材料知识", "再根据反应邀请量房或到店", "每次内容和间隔都可以修改"],
      },
      {
        kicker: "第 3 步",
        title: "每条内容发送前都要检查",
        lines: ["服务地址、活动期限和剩余名额", "价格与权益有没有过度承诺", "距离上次联系是否太近"],
      },
      {
        kicker: "第 4 步",
        title: "出现停止条件，立刻停止",
        lines: ["客户回复、拒绝或已经成交", "连续多次未回应或要求不要打扰", "系统停止计划并保留人工备注"],
      },
      {
        kicker: "完成",
        title: "店长确认后，才会按计划发送",
        lines: ["可以批准、修改或停止", "价格和权益不确定时不会发送", "本演示不会给任何客户发送消息"],
      },
    ],
  },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function textLines(lines, { x, y, size, weight = 500, color, gap }) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * gap}" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(line)}</text>`,
    )
    .join("\n");
}

function makeSlideSvg(demo, slide, slideIndex) {
  const total = demo.slides.length;
  const progressWidth = 760;
  const progress = Math.round(((slideIndex + 1) / total) * progressWidth);
  const stepLabel = `${String(slideIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#07111f"/>
          <stop offset="0.58" stop-color="#0c1728"/>
          <stop offset="1" stop-color="${demo.accentSoft}"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.84" cy="0.16" r="0.72">
          <stop offset="0" stop-color="${demo.accent}" stop-opacity="0.25"/>
          <stop offset="1" stop-color="${demo.accent}" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="22" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
      <circle cx="1160" cy="85" r="180" fill="${demo.accent}" opacity="0.06"/>
      <circle cx="1040" cy="660" r="260" fill="${demo.accent}" opacity="0.04"/>

      <g font-family="Hiragino Sans GB, PingFang SC, STHeiti, sans-serif">
        <rect x="64" y="48" width="184" height="48" rx="24" fill="${demo.accent}"/>
        <text x="156" y="80" text-anchor="middle" font-size="24" font-weight="700" fill="#07111f">${escapeXml(demo.module)}</text>

        <rect x="932" y="48" width="284" height="48" rx="24" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.18"/>
        <text x="1074" y="79" text-anchor="middle" font-size="22" font-weight="600" fill="#ffffff">${DISCLAIMER}</text>

        <g filter="url(#shadow)">
          <rect x="64" y="132" width="1152" height="472" rx="34" fill="#0b1526" fill-opacity="0.86" stroke="#ffffff" stroke-opacity="0.1"/>
        </g>

        <text x="112" y="196" font-size="26" font-weight="700" fill="${demo.accent}">${escapeXml(slide.kicker)}</text>
        ${textLines([slide.title], {
          x: 112,
          y: 286,
          size: 56,
          weight: 800,
          color: "#ffffff",
          gap: 66,
        })}

        <rect x="112" y="330" width="8" height="${Math.max(120, slide.lines.length * 62 - 18)}" rx="4" fill="${demo.accent}"/>
        ${textLines(slide.lines.map((line) => `•  ${line}`), {
          x: 148,
          y: 374,
          size: 31,
          weight: 500,
          color: "#dbe7f5",
          gap: 62,
        })}

        <rect x="64" y="648" width="${progressWidth}" height="8" rx="4" fill="#ffffff" fill-opacity="0.12"/>
        <rect x="64" y="648" width="${progress}" height="8" rx="4" fill="${demo.accent}"/>
        <text x="1216" y="661" text-anchor="end" font-size="24" font-weight="650" fill="#b8c5d6">${stepLabel}</text>
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

async function renderDemo(demo, tempRoot) {
  const demoName = path.basename(demo.fileName, ".mp4");
  const frameDir = path.join(tempRoot, demoName);
  await mkdir(frameDir, { recursive: true });

  const frameNames = [];
  const slideSeconds = demo.slideSeconds ?? SLIDE_SECONDS;
  for (let index = 0; index < demo.slides.length; index += 1) {
    const frameName = `slide-${String(index + 1).padStart(2, "0")}.png`;
    const framePath = path.join(frameDir, frameName);
    const svg = makeSlideSvg(demo, demo.slides[index], index);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(framePath);
    frameNames.push(frameName);
  }

  const concatLines = [];
  for (const frameName of frameNames) {
    concatLines.push(`file '${frameName}'`);
    concatLines.push(`duration ${slideSeconds}`);
  }
  concatLines.push(`file '${frameNames.at(-1)}'`);
  await writeFile(path.join(frameDir, "slides.txt"), `${concatLines.join("\n")}\n`, "utf8");

  const outputPath = path.join(outputDir, demo.fileName);
  const duration = String(demo.slides.length * slideSeconds);
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
    "slides.txt",
    "-vf",
    "fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    "-t",
    duration,
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
    throw new Error(`生成 ${demo.fileName} 失败。\n${detail}`);
  }

  return outputPath;
}

async function main() {
  await assertFfmpeg();
  await mkdir(outputDir, { recursive: true });
  const tempRoot = await mkdtemp(path.join(tmpdir(), "renovation-ai-demos-"));

  try {
    for (const demo of demos) {
      const outputPath = await renderDemo(demo, tempRoot);
      console.log(`已生成 ${path.relative(repoRoot, outputPath)}`);
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[演示视频生成失败]\n${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
