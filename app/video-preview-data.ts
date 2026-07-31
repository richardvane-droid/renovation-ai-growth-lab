const stockPreviewPath = "./video-previews/stock";

export const videoPosterByTitle: Record<string, string> = {
  "33㎡钻石厨房：台面多出 1.8 米": `${stockPreviewPath}/kitchen-countertop.jpg`,
  "118㎡原木风全屋定制完工实拍": `${stockPreviewPath}/home-walkthrough.jpg`,
  "568 元/㎡套餐到底包含什么": `${stockPreviewPath}/package-materials.jpg`,
  "8㎡儿童房收纳翻倍方案": `${stockPreviewPath}/child-bedroom.jpg`,
  "ENF 板材怎么选：三个误区": `${stockPreviewPath}/wood-samples.jpg`,
  "安装现场：柜门缝隙做到 2mm": `${stockPreviewPath}/cabinet-hinge.jpg`,
  "奶油风翻车的 5 个细节": `${stockPreviewPath}/cream-interior.jpg`,
  "旧房翻新先做柜体还是水电": `${stockPreviewPath}/room-renovation.jpg`,
  "同户型改造前后动线对比": `${stockPreviewPath}/floorplan-layout.jpg`,
  "店长带看：漳州龙文展厅": `${stockPreviewPath}/showroom-tour.jpg`,
};

export const slicePosterByFileName: Record<string, string> = {
  "龙文店厨房安装实拍.mp4": `${stockPreviewPath}/kitchen-installation.jpg`,
  "衣柜封边细节.mov": `${stockPreviewPath}/edge-finishing.jpg`,
  "118㎡完工全景.mp4": `${stockPreviewPath}/home-walkthrough.jpg`,
  "儿童房收纳改造.mp4": `${stockPreviewPath}/child-bedroom.jpg`,
};

export const spokespersonPosterByMaterial: Record<string, string> = {
  "正面讲话": `${stockPreviewPath}/spokesperson-front.jpg`,
  "自然动作": `${stockPreviewPath}/spokesperson-gesture.jpg`,
  "不同语气示范": `${stockPreviewPath}/spokesperson-tones.jpg`,
  "合格示例": `${stockPreviewPath}/spokesperson-example.jpg`,
};

export const sliceSegmentPosters = [
  `${stockPreviewPath}/kitchen-installation.jpg`,
  `${stockPreviewPath}/cabinet-hinge.jpg`,
  `${stockPreviewPath}/edge-finishing.jpg`,
  `${stockPreviewPath}/home-walkthrough.jpg`,
];

export function videoPosterForTitle(title: string) {
  return videoPosterByTitle[title];
}
