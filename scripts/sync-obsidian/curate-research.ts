import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

interface ResearchMetadata {
  title: string;
  slug: string;
  topic: 'market-competition' | 'product-user' | 'channel-growth';
  researchQuestion: string;
  summary: string;
  conclusions: [string, string, string];
  researchDate: string;
  scope: string;
  sources: Array<{ label: string }>;
  relatedResearch?: string[];
}

const metadataByFile: Record<string, ResearchMetadata> = {
  'HiFi渠道角色与进入策略.md': {
    title: 'Hi-Fi 渠道角色与进入策略',
    slug: 'hifi-channel-entry-strategy',
    topic: 'channel-growth',
    researchQuestion: '不同产品特征应如何匹配国内电商、专业零售、试听活动与海外分销渠道？',
    summary: '渠道经理的核心不是开店数量，而是终端动销、价格纪律、样机效率、库存健康和回款质量。',
    conclusions: [
      '国内标准化新品可由京东承担首发与搜索转化，天猫承担会员与大促复购，抖音承担场景化内容测试。',
      'M5 Ultra以上、电子管/R2R和旗舰耳机应先进入专业零售、试听会和展会，再扩大电商曝光。',
      '海外更适合“官方独立站控价与直发 + 本地分销商成交与售后 + CanJam获取消费者/媒体/渠道线索”。',
    ],
    researchDate: '2026-07-25',
    scope: '基于公开资料整理的渠道角色、产品匹配与 90 天试点框架；未明确列出来源的判断属于研究者推断或模拟经营假设。',
    sources: [{ label: '正文“主要公开来源”及各章节列出的公开资料' }],
    relatedResearch: ['shanling-sku-user-positioning', 'china-hifi-competition-price-map', 'hifi-new-user-pc-channel-growth', 'street-listening-marketing'],
  },
  'HiFi街头试听营销方案.md': {
    title: 'Hi-Fi 街头试听内容与地推方案',
    slug: 'street-listening-marketing',
    topic: 'channel-growth',
    researchQuestion: '如何用低门槛的街头试听，让普通用户先感知声音差异，再产生对 Hi-Fi 的兴趣？',
    summary: '把 Hi-Fi 从“先懂再买”的产品，转化为“先听到惊喜，再产生兴趣”的体验型产品。',
    conclusions: [
      '内容的主角始终是“人、歌与情绪”，设备的角色是帮助用户重新听见这首歌。',
      '路人不需要理解参数，只需分享一首歌并戴上耳机。',
      '第一阶段先拍摄 10 至 20 位路人的体验内容，验证参与意愿、可被镜头捕捉的差异感以及设备与试听渠道询问。',
    ],
    researchDate: '2026-08-23',
    scope: '线下体验与内容获客的初步方案；尚未执行试点，参与率、内容效果与转化均需用真实数据验证。',
    sources: [{ label: '待补充：公开来源、试点记录与转化数据' }],
    relatedResearch: ['hifi-new-user-pc-channel-growth', 'hifi-user-needs-product-opportunities', 'hifi-channel-entry-strategy'],
  },
  '中国Hi-Fi新用户增长与PC装机渠道拓展策略.md': {
    title: '中国 Hi-Fi 新用户增长与 PC 装机渠道拓展策略',
    slug: 'hifi-new-user-pc-channel-growth',
    topic: 'channel-growth',
    researchQuestion: '传统 Hi-Fi 品牌如何借助电竞、PC 装机、便携使用与日常审美场景接触新用户？',
    summary: '专业 Hi-Fi 是本体；电竞、PC 装机、便携和风格表达，是它被更多人使用的场景。',
    conclusions: [
      '品牌不应把产品简单定位成“专为电竞打造的耳机”。',
      '新用户未必先把自己称为“Hi-Fi 用户”，但可能愿意为更好的声音、更完整的设备体验或更有风格的日常产品付费。',
      'PC 装机渠道值得通过小规模试点验证。',
    ],
    researchDate: '2026-08-18—2026-08-23',
    scope: '市场进入与渠道拓展的初步策略备忘录；市场空白、用户规模与渠道竞争程度须通过门店走访、试点数据和用户访谈验证。',
    sources: [{ label: '待补充：公开来源、门店走访、试点数据与用户访谈' }],
    relatedResearch: ['street-listening-marketing', 'hifi-channel-entry-strategy'],
  },
  '国内HiFi竞品与价格带地图.md': {
    title: '国内 Hi-Fi 竞品与价格带地图',
    slug: 'china-hifi-competition-price-map',
    topic: 'market-competition',
    researchQuestion: '国内 Hi-Fi 的主要品类和价格带竞争如何分布，山灵各价格带应承担什么任务？',
    summary: '便携 CD、R2R 和电子管并非最大市场，但更容易建立品牌记忆，适合内容、试听和展会驱动。',
    conclusions: [
      '最拥挤战场是¥1,000–4,000 DAP：飞傲、海贝、iBasso、凯音与山灵在系统、参数、声音和电子管玩法上正面重叠。',
      '山灵最危险的产品带是M3 Plus与M3 Plus Master：既要面对Android性价比机，也要面对更强发烧标签的竞品。',
      '山灵最值得守住的锚点是M5 Ultra与M7T：分别代表纯音AKM升级和电子管上探。',
    ],
    researchDate: '2026-07-25',
    scope: '基于公开资料整理的 DAP、便携解码耳放、桌面一体机、耳机与便携 CD 竞争框架；真实成交均价、渠道毛利和退货数据仍需内部验证。',
    sources: [{ label: '正文“主要公开来源”及各章节列出的公开资料' }],
    relatedResearch: ['shanling-sku-user-positioning', 'hifi-channel-entry-strategy', 'hifi-user-needs-product-opportunities'],
  },
  '山灵主推SKU与用户定位表.md': {
    title: '山灵主推 SKU 与用户定位表',
    slug: 'shanling-sku-user-positioning',
    topic: 'product-user',
    researchQuestion: '如何把公开产品目录整理成拉新、升级与旗舰三层销售主序列？',
    summary: '销售经理不应把所有SKU放进同一种KPI：拉新款看新客和连带，高端款看出样、试听、内容与品牌带动。',
    conclusions: [
      '拉新入口：M0 Pura、M1 Plus、H2、UP6、EC Play，承担第一次进入Hi-Fi的低门槛成交。',
      '中端升级与利润带：M3 Plus、M5 Ultra、EH2、ME600，承接“能听出差异、愿意为体验加价”的用户。',
      '高端形象与深转化：M7T、M8T、EC Zero T、HW600、Majestic、EM7/SCD3.3，依赖样机、试听会和核心门店。',
    ],
    researchDate: '2026-07-25',
    scope: '基于公开产品状态、价格、参数与反馈整理的销售主序列；商业角色、渠道优先级与 KPI 属于研究判断。',
    sources: [{ label: '正文“主要公开来源”及各章节列出的公开资料' }],
    relatedResearch: ['china-hifi-competition-price-map', 'hifi-channel-entry-strategy', 'hifi-user-needs-product-opportunities'],
  },
  '用户需求差评与新品机会清单.md': {
    title: '用户需求、差评与新品机会清单',
    slug: 'hifi-user-needs-product-opportunities',
    topic: 'product-user',
    researchQuestion: '如何把公开用户反馈拆解为销售异议、基础体验修复与新品验证方向？',
    summary: '销售端应主动披露适用边界，避免把缺点留到售后阶段。',
    conclusions: [
      '最伤转化的常常不是“声音不够好”，而是用户担心系统、无线、续航和售后不够省心。',
      '最优先的机会不是再堆旗舰，而是修复MTouch/Android稳定性、日志与曲库管理等基础体验。',
      '硬件新品应优先“中价位、易懂、可连带”：紧凑Android DAP、H2二代、中价位单动圈IEM。',
    ],
    researchDate: '2026-07-25',
    scope: '基于公开口碑样本形成的问题分类与机会假设；论坛样本偏差、售后故障、退货原因和试听转化须以内部证据验证。',
    sources: [{ label: '正文“主要公开来源”及各章节列出的公开资料' }],
    relatedResearch: ['shanling-sku-user-positioning', 'china-hifi-competition-price-map', 'hifi-new-user-pc-channel-growth', 'street-listening-marketing'],
  },
};

function readArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function cleanPublicBody(body: string) {
  return body
    .replace(/\[\[首页\|返回首页\]\]\s*·\s*/g, '')
    .replace(/\[\[山灵产品表格\]\]/g, '山灵产品表格（内部资料，未公开）')
    .replace(/\[\[([^\]]+\.docx)(?:\|[^\]]+)?\]\]/gi, '$1（未公开）')
    .replace(/^\*This is for informational purposes only\. For medical advice or diagnosis, consult a professional\.\*\s*$/gim, '')
    .trimStart();
}

async function main() {
  const vaultRoot = readArgument('--vault');
  const apply = process.argv.includes('--apply');
  if (!vaultRoot) throw new Error('请通过 --vault 指定 Obsidian Vault。');

  const directory = path.resolve(vaultRoot, '网站发布', '行业研究');
  const report: Array<{ file: string; changed: boolean; mode: 'dry-run' | 'applied' }> = [];

  for (const [file, metadata] of Object.entries(metadataByFile)) {
    const filePath = path.join(directory, file);
    const source = await readFile(filePath, 'utf8');
    const parsed = matter(source);
    const data: Record<string, unknown> = {
      ...parsed.data,
      publish: false,
      preview: true,
      featured: false,
      ...metadata,
      updatedAt: '2026-08-27',
      relatedResearch: metadata.relatedResearch ?? [],
      relatedListening: [],
      relatedFieldNotes: [],
    };
    delete data.publishedAt;
    delete data.source_file;
    delete data.research_date;
    if (parsed.data.source_file) {
      data.sourceFileStatus = '原始 Word 附件未在 Vault 中找到；网页预览仅使用当前 Markdown 正文与正文列出的公开来源。';
    }

    const next = matter.stringify(cleanPublicBody(parsed.content), data);
    const changed = next !== source;
    if (apply && changed) await writeFile(filePath, next, 'utf8');
    report.push({ file, changed, mode: apply ? 'applied' : 'dry-run' });
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
