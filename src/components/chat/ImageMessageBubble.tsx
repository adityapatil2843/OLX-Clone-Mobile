import React, { memo, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { palette, radii } from '../../constants/tokens';

export const ImageMessageBubble = memo(function ImageMessageBubble({ uri, isMine }: { uri: string; isMine: boolean }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  return (
    <View style={{ backgroundColor: isMine ? '#002f34' : palette.pureWhite, borderRadius: radii.lg, padding: 4, maxWidth: 260 }}>
      <Image
        source={{ uri }}
        style={{ width: 240, height: 180, borderRadius: radii.md, backgroundColor: palette.slate200 }}
        resizeMode="cover"
        onLoad={() => setIsLoading(false)}
        onError={() => { setIsLoading(false); setHasError(true); }}
        accessibilityLabel="Chat image"
      />
      {isLoading && <ActivityIndicator accessibilityLabel="Loading image" size="small" color={isMine ? palette.pureWhite : palette.slate500} style={{ position: 'absolute', top: 86, left: 116 }} />}
      {hasError && <Text style={{ position: 'absolute', alignSelf: 'center', top: 80, color: palette.slate600 }}>Image unavailable</Text>}
    </View>
  );
});
