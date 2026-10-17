import { NotImplementedError } from './auth.service';

export interface UploadSignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface UploadMediaParams {
  uri: string;
  type: 'image' | 'video';
  mimeType?: string;
}

export const mediaService = {
  requestUploadUrl: async (_params: { fileName: string; fileType: string }): Promise<UploadSignedUrlResponse> => {
    throw new NotImplementedError('mediaService.requestUploadUrl');
  },

  uploadMedia: async (_params: UploadMediaParams): Promise<{ mediaUrl: string; fileKey: string }> => {
    throw new NotImplementedError('mediaService.uploadMedia');
  },
};
