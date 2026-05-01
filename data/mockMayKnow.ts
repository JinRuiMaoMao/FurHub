/**
 * 「可能认识」演示数据：仅 B 站 UP。
 *
 * 入选条件见 `lib/mayKnow.ts`：`bilibiliHasFurryTaggedVideo`（至少有一条带 Furry/福瑞/兽装等向标签的公开稿件，演示为人工核对）、粉丝 **>1000**。
 */

export { FURRY_INTEREST_TAG_SUBSTRINGS as BILIBILI_FURRY_TAG_SUBSTRINGS } from '@/lib/furryInterestTags';

export type MayKnowTag = 'furry' | 'furryZh';

export type MayKnowPerson = {
  email: string;
  name: string;
  avatar: string;
  tag: MayKnowTag;
  bilibili: string;
  /** 至少有一条公开稿件带 Furry/福瑞/兽装等向标签（接 API 时以稿件标签为准） */
  bilibiliHasFurryTaggedVideo: boolean;
  /** 粉丝数（card.fans），须 >1000 */
  bilibiliFans: number;
  /** 可选：公开投稿数（仅展示/维护参考） */
  bilibiliArchiveCount?: number;
};

export const MAY_KNOW_POOL: MayKnowPerson[] = [
  {
    email: 'mayknow.01@furhub.demo',
    name: '喵仔瑞狩',
    avatar: 'https://i1.hdslb.com/bfs/face/f57a6a6ade4301a439cb1947294114ea851ab1f8.jpg',
    tag: 'furry',
    bilibili: 'https://space.bilibili.com/8381620',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 123_348,
    bilibiliArchiveCount: 1281,
  },
  {
    email: 'mayknow.02@furhub.demo',
    name: '牵比绒kibi',
    avatar: 'https://i2.hdslb.com/bfs/face/eb1c87bb2183fe675d19e52d60c7ecd5fad2c7fd.jpg',
    tag: 'furryZh',
    bilibili: 'https://space.bilibili.com/1227903083',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 136_287,
    bilibiliArchiveCount: 160,
  },
  {
    email: 'mayknow.03@furhub.demo',
    name: 'Aaron-小海',
    avatar: 'https://i2.hdslb.com/bfs/face/ce7d4300cedb45922f955b9ea741f4045ac098d5.jpg',
    tag: 'furry',
    bilibili: 'https://space.bilibili.com/30296366',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 45_632,
    bilibiliArchiveCount: 55,
  },
  {
    email: 'mayknow.04@furhub.demo',
    name: '青盐不是大灰狼',
    avatar: 'https://i2.hdslb.com/bfs/face/d2e3053c086c33788cfea569a61c309b165bdcab.jpg',
    tag: 'furryZh',
    bilibili: 'https://space.bilibili.com/82191626',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 29_425,
    bilibiliArchiveCount: 559,
  },
  {
    email: 'mayknow.05@furhub.demo',
    name: '银碳Gintan',
    avatar: 'https://i0.hdslb.com/bfs/face/d3ddb46701005f568b01d5baa46f9e8b4f7884fa.jpg',
    tag: 'furryZh',
    bilibili: 'https://space.bilibili.com/2142558030',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 763_105,
    bilibiliArchiveCount: 230,
  },
  {
    email: 'mayknow.06@furhub.demo',
    name: '御猫牌融合香蕉船',
    avatar: 'https://i0.hdslb.com/bfs/face/4787accdbfd4f418195ff5a77929050111bc97b8.jpg',
    tag: 'furry',
    bilibili: 'https://space.bilibili.com/21136932',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 16_335,
    bilibiliArchiveCount: 107,
  },
  {
    email: 'mayknow.07@furhub.demo',
    name: '原子猫Korrekt',
    avatar: 'https://i0.hdslb.com/bfs/face/a67958ccc9fd93bc2c50402fd84dcc69bd48658d.jpg',
    tag: 'furry',
    bilibili: 'https://space.bilibili.com/1960472418',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 7130,
    bilibiliArchiveCount: 147,
  },
  {
    email: 'mayknow.08@furhub.demo',
    name: '虞莫MOMO',
    avatar: 'https://i2.hdslb.com/bfs/face/c633da9bcebe8f8dfb5a0e5c19a69c5197812583.webp',
    tag: 'furryZh',
    bilibili: 'https://space.bilibili.com/1811071010',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 88_488,
    bilibiliArchiveCount: 578,
  },
  {
    email: 'mayknow.09@furhub.demo',
    name: '七海Nana7mi',
    avatar: 'https://i2.hdslb.com/bfs/face/8131207411160e7683e96387fb611ee9cd39625a.jpg',
    tag: 'furryZh',
    bilibili: 'https://space.bilibili.com/434334701',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 1_105_509,
    bilibiliArchiveCount: 2280,
  },
  {
    email: 'mayknow.10@furhub.demo',
    name: '星瞳_Official',
    avatar: 'https://i0.hdslb.com/bfs/face/57471c1fdaec5fd77d6c09ceeda077c84d606e2b.jpg',
    tag: 'furryZh',
    bilibili: 'https://space.bilibili.com/401315430',
    bilibiliHasFurryTaggedVideo: true,
    bilibiliFans: 1_104_642,
    bilibiliArchiveCount: 1266,
  },
];
