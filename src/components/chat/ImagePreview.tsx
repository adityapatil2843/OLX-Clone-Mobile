import React, { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { palette, radii } from '../../constants/tokens';

export const ImagePreview = memo(function ImagePreview({ uri, onRemove, disabled }: { uri: string; onRemove: () => void; disabled?: boolean }) {
  return (
    <View style={{ padding: 8, backgroundColor: palette.pureWhite, borderTopWidth: 1, borderTopColor: palette.slate200 }}>
      <View style={{ alignSelf: 'flex-start' }}>
        <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: radii.sm }} />
        <TouchableOpacity disabled={disabled} onPress={onRemove} style={{ position: 'absolute', right: -8, top: -8, backgroundColor: palette.slate800, borderRadius: 12, padding: 3 }}>
          <X size={14} color={palette.pureWhite} />
        </TouchableOpacity>
      </View>
      {disabled && <Text style={{ color: palette.slate500, fontSize: 11, marginTop: 4 }}>Sending image…</Text>}
    </View>
  );
});
