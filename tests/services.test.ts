import { authService, NotImplementedError } from '../src/services/auth.service';
import { mediaService } from '../src/services/media.service';
import { socketService } from '../src/services/socket.service';

describe('Phase 0 Service Integration Boundaries', () => {
  it('throws NotImplementedError on unimplemented auth operations', async () => {
    await expect(authService.requestOtp({ phone: '9999999999' })).rejects.toThrow(NotImplementedError);
    await expect(authService.verifyOtp({ phone: '9999999999', otp: '123456' })).rejects.toThrow(NotImplementedError);
  });

  it('throws NotImplementedError on unimplemented media operations', async () => {
    await expect(mediaService.requestUploadUrl({ fileName: 'reel.mp4', fileType: 'video/mp4' })).rejects.toThrow(
      NotImplementedError
    );
  });

  it('reports socket disconnection in Phase 0', () => {
    expect(socketService.isConnected()).toBe(false);
    expect(() => socketService.emit('test', {})).toThrow(NotImplementedError);
  });
});
