export type Gathering = {
  id: string;
  title: string;
  city: string;
  venue: string;
  /** 地图标注与复制用地址（与 FEC 页面一致） */
  mapAddress: string;
  latitude: number;
  longitude: number;
  dateLabel: string;
  tags: string[];
  description: string;
  /** FEC 展会页，坐标取自该页 JSON 中的 addressLat / addressLon */
  sourceUrl?: string;
  /** 封面大图（`thumbnail` → https://images.furrycons.cn/…） */
  coverImageUrl?: string;
  /** FEC `media.images` 详情海报等，不含与封面重复的 URL */
  detailImageUrls?: string[];
  /** FEC 详情页 JSON 中 `event.detail` 活动正文（优先于在线 HTML 解析） */
  fecDetail?: string;
  /** FEC `organization.name` */
  organizerName?: string;
  /** FEC `startAt` / `endAt` ISO，用于头图日期与天数 */
  fecStartAt?: string;
  fecEndAt?: string;
  /** FEC `scale`：small / cosy / medium / large / xlarge */
  fecScale?: string;
  /** FEC `type`：all-in-con / comic-market / fandom-meetup / travel-con */
  fecEventType?: string;
  /** FEC `locationType`：hotel / venue */
  fecLocationType?: string;
};
