import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CHAT_IMAGE_MAX_BYTES, CHAT_IMAGE_MAX_WIDTH, CHAT_IMAGE_QUALITY } from '../constants/chatAttachments';
import { mediaService } from '../services/media.service';
import { chatService, ChatMessage } from '../services/chat.service';

export interface PendingChatImage {
  uri: string;
  name: string;
  mimeType: string;
  fileSize?: number;
}

export function useChatAttachments(conversationId: string) {
  const [pendingImage, setPendingImage] = useState<PendingChatImage | null>(null);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectImage = useCallback(async (source: 'gallery' | 'camera') => {
    setError(null);
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access to attach an image.`);
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: CHAT_IMAGE_QUALITY })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: CHAT_IMAGE_QUALITY });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > CHAT_IMAGE_MAX_BYTES) {
        throw new Error('Please choose an image smaller than 10 MB.');
      }

      const mimeType = asset.mimeType || 'image/jpeg';
      if (!mimeType.startsWith('image/')) throw new Error('Only image files can be attached.');

      const context = await ImageManipulator.manipulate(asset.uri)
        .resize({ width: Math.min(asset.width || CHAT_IMAGE_MAX_WIDTH, CHAT_IMAGE_MAX_WIDTH) })
        .renderAsync();
      const saved = await context.saveAsync({ compress: CHAT_IMAGE_QUALITY, format: SaveFormat.JPEG });
      setPendingImage({
        uri: saved.uri,
        name: `chat_image_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to select image.');
    }
  }, []);

  const removeImage = useCallback(() => {
    if (!isSendingImage) setPendingImage(null);
  }, [isSendingImage]);

  const sendImage = useCallback(async (): Promise<ChatMessage> => {
    if (!pendingImage || isSendingImage) throw new Error('No image is ready to send.');
    setIsSendingImage(true);
    setError(null);
    try {
      const uploaded = await mediaService.uploadChatImage(conversationId, pendingImage);
      const message = await chatService.sendImageMessage(conversationId, uploaded.url);
      setPendingImage(null);
      return message;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send image.';
      setError(message);
      throw err;
    } finally {
      setIsSendingImage(false);
    }
  }, [conversationId, isSendingImage, pendingImage]);

  return { pendingImage, isSendingImage, error, selectImage, removeImage, sendImage };
}
