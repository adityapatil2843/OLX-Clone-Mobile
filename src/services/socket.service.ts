import { NotImplementedError } from './auth.service';

export interface SocketEventCallback<T = unknown> {
  (data: T): void;
}

export const socketService = {
  connect: (_token?: string): void => {
    // In Phase 0, real-time socket connections are deferred until Phase 1 backend is available
  },

  disconnect: (): void => {
    // In Phase 0, no-op
  },

  on: <T>(_event: string, _callback: SocketEventCallback<T>): void => {
    // Registered in Phase 1
  },

  off: (_event: string): void => {
    // Registered in Phase 1
  },

  emit: (_event: string, _payload: unknown): void => {
    throw new NotImplementedError('socketService.emit');
  },

  isConnected: (): boolean => {
    return false;
  },
};
