import { useState } from 'react';
import { Image, type NativeSyntheticEvent, StyleSheet, View, type ImageLoadEventData } from 'react-native';

type Props = {
  uri: string;
  maxWidth: number;
  /** 长图用 contain，封面用 cover */
  resizeMode?: 'contain' | 'cover';
  borderRadius?: number;
  /** 限制最大高度（封面避免占满屏）；不传则按图片自然比例完整展示 */
  maxHeight?: number;
};

export function GatheringFecImage({
  uri,
  maxWidth,
  resizeMode = 'contain',
  borderRadius = 14,
  maxHeight,
}: Props) {
  const [ratio, setRatio] = useState(9 / 16);

  const onLoad = (e: NativeSyntheticEvent<ImageLoadEventData>) => {
    const { width, height } = e.nativeEvent.source;
    if (width > 0 && height > 0) setRatio(height / width);
  };

  let height = Math.round(maxWidth * ratio);
  if (maxHeight != null && height > maxHeight) {
    height = maxHeight;
  }

  return (
    <View style={[styles.wrap, { width: maxWidth, borderRadius, overflow: 'hidden' }]}>
      <Image
        source={{ uri }}
        accessibilityIgnoresInvertColors
        onLoad={onLoad}
        style={{ width: maxWidth, height }}
        resizeMode={resizeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(120, 120, 128, 0.08)',
    alignSelf: 'center',
  },
});
