import { AuthSession, UserProfile } from '../types/user';

export class NotImplementedError extends Error {
  constructor(featureName: string) {
    super(`[Phase 0 Foundation] ${featureName} is not yet implemented. Requires Phase 1 backend service integration.`);
    this.name = 'NotImplementedError';
  }
}

export interface RequestOtpParams {
  phone: string;
}

export interface VerifyOtpParams {
  phone: string;
  otp: string;
}

export const authService = {
  requestOtp: async (_params: RequestOtpParams): Promise<{ success: boolean; cooldownSeconds: number }> => {
    throw new NotImplementedError('authService.requestOtp');
  },

  verifyOtp: async (_params: VerifyOtpParams): Promise<AuthSession> => {
    throw new NotImplementedError('authService.verifyOtp');
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    // Phase 0: No persisted session yet
    return null;
  },

  logout: async (): Promise<void> => {
    // Phase 0: No-op clean teardown
  },
};
