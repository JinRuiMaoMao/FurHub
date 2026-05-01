export type Moment = {
  id: string;
  author: string;
  timeLabel: string;
  body: string;
};

/** 发现页占位动态，后续接服务端时间线 */
export const MOCK_MOMENTS: Moment[] = [];
