export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_IMAGE_MAX_WIDTH = 1600;
export const CHAT_IMAGE_QUALITY = 0.8;
export const CHAT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ChatImageMimeType = (typeof CHAT_IMAGE_MIME_TYPES)[number];
