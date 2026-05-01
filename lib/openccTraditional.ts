import * as OpenCC from 'opencc-js';

let cnToTw: ((text: string) => string) | undefined;

/** 简体 → 台湾繁体（与 opencc-js 词典一致） */
export function toTraditionalTaiwan(text: string): string {
  try {
    if (!cnToTw) {
      cnToTw = OpenCC.Converter({ from: 'cn', to: 'tw' });
    }
    const convert = cnToTw;
    return convert(text);
  } catch {
    return text;
  }
}
