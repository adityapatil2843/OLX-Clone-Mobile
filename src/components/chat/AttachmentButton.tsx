import React, { memo } from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { palette } from '../../constants/tokens';

export const AttachmentButton = memo(function AttachmentButton({ onSelect }: { onSelect: (source: 'gallery' | 'camera') => void }) {
  const openOptions = () => Alert.alert('Attach image', 'Choose a source', [
    { text: 'Gallery', onPress: () => onSelect('gallery') },
    { text: 'Camera', onPress: () => onSelect('camera') },
    { text: 'Cancel', style: 'cancel' },
  ]);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Attach image" onPress={openOptions} style={{ padding: 8 }}>
      <Plus size={22} color={palette.slate700} />
    </TouchableOpacity>
  );
});
