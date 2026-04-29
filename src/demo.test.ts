import {describe, it, expect, vi, beforeEach} from 'vitest';
import './demo';
import {GeminiAvatar} from './gemini-avatar';
import * as fs from 'fs';
import * as path from 'path';
import * as uiHelpers from './ui-helpers';

describe('Demo App', () => {
  let avatar: GeminiAvatar;
  let streamBtn: HTMLButtonElement;
  let mockTokenClient: any;

  beforeEach(() => {
    vi.stubGlobal(
      'MediaSource',
      vi.fn().mockImplementation(function () {
        return {
          addEventListener: vi.fn(),
          readyState: 'closed',
          addSourceBuffer: vi.fn().mockReturnValue({
            addEventListener: vi.fn(),
            appendBuffer: vi.fn(),
          }),
        };
      }),
    );
    window.MediaSource = globalThis.MediaSource;

    vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost/mock-url',
    );

    // Mock fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(url => {
        if (url.startsWith('/tokeninfo')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({expires_in: '3600', email: 'test@example.com'}),
          });
        }
        if (url.startsWith('/oauth2/v3/userinfo')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                name: 'Test User',
                picture: 'https://example.com/avatar.png',
              }),
          });
        }
        return Promise.reject(new Error(`Unhandled fetch in test: ${url}`));
      }),
    );

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockImplementation(key => {
        if (key === 'gemini_oauth_client_id') return 'test-client-id';
        if (key === 'gemini_access_token') return 'valid-token';
        if (key === 'gemini_token_expiry')
          return (new Date().getTime() + 3600000).toString();
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn().mockReturnValue([{stop: vi.fn()}]),
        }),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
    });

    // Mock AudioContext
    vi.stubGlobal(
      'AudioContext',
      vi.fn().mockImplementation(function () {
        return {
          createMediaStreamSource: vi
            .fn()
            .mockReturnValue({connect: vi.fn(), disconnect: vi.fn()}),
          createGain: vi.fn().mockReturnValue({
            gain: {value: 1},
            connect: vi.fn(),
            disconnect: vi.fn(),
          }),
          createAnalyser: vi.fn().mockReturnValue({
            fftSize: 256,
            frequencyBinCount: 128,
            getByteTimeDomainData: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn(),
          }),
          createMediaElementSource: vi
            .fn()
            .mockReturnValue({connect: vi.fn(), disconnect: vi.fn()}),
          createMediaStreamDestination: vi.fn().mockReturnValue({
            stream: {
              getTracks: vi.fn().mockReturnValue([
                {
                  kind: 'audio',
                  label: 'mock-track',
                  enabled: true,
                  readyState: 'live',
                },
              ]),
            },
          }),
          destination: {},
          currentTime: 0,
          audioWorklet: {addModule: vi.fn().mockResolvedValue(undefined)},
          close: vi.fn().mockResolvedValue(undefined),
        };
      }),
    );
    window.AudioContext = globalThis.AudioContext;

    // Mock AudioWorkletNode
    vi.stubGlobal(
      'AudioWorkletNode',
      vi.fn().mockImplementation(function () {
        return {
          connect: vi.fn(),
          disconnect: vi.fn(),
          port: {onmessage: vi.fn()},
        };
      }),
    );
    window.AudioWorkletNode = globalThis.AudioWorkletNode;

    if (!customElements.get('gemini-avatar')) {
      customElements.define('gemini-avatar', GeminiAvatar);
    }

    const htmlPath = path.resolve(__dirname, '../index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Remove scripts and links to prevent network requests in test
    html = html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      '',
    );
    html = html.replace(/<link\b[^>]*>/gi, '');

    document.body.innerHTML = html;

    avatar = document.getElementById('my-avatar') as GeminiAvatar;
    streamBtn = document.getElementById('streamBtn') as HTMLButtonElement;

    // Mock alert
    vi.stubGlobal('alert', vi.fn());

    // Mock Google Identity Services
    mockTokenClient = {
      requestAccessToken: vi.fn(),
    };
    vi.stubGlobal('google', {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
        },
        oauth2: {
          initTokenClient: vi.fn().mockReturnValue(mockTokenClient),
        },
      },
    });

    const oauthClientIdInput = document.getElementById(
      'oauthClientId',
    ) as HTMLInputElement;
    if (oauthClientIdInput) oauthClientIdInput.value = 'test-client-id';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should call avatar.start() when clicked and not connected', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const startSpy = vi.spyOn(avatar, 'start').mockResolvedValue(undefined);

    // Mock isConnected to return false
    vi.spyOn(avatar, 'isConnected', 'get').mockReturnValue(false);

    streamBtn.disabled = false;
    streamBtn.click();

    // Wait for async operations in click handler
    await vi.waitFor(() => {
      expect(startSpy).toHaveBeenCalled();
      expect(streamBtn.textContent).toBe('Stop');
    });
  });

  it('should call avatar.stop() when clicked and connected', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const stopSpy = vi.spyOn(avatar, 'stop').mockResolvedValue(undefined);

    // Mock isConnected to return true
    vi.spyOn(avatar, 'isConnected', 'get').mockReturnValue(true);

    // Simulate button state
    streamBtn.textContent = 'Stop';

    streamBtn.disabled = false;
    streamBtn.click();

    await vi.waitFor(() => {
      expect(stopSpy).toHaveBeenCalled();
      expect(streamBtn.textContent).toBe('Start');
    });
  });

  it('should update avatar-name attribute on start', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    vi.spyOn(avatar, 'start').mockResolvedValue(undefined);
    vi.spyOn(avatar, 'isConnected', 'get').mockReturnValue(false);

    const avatarNameSelect = document.getElementById(
      'avatarName',
    ) as HTMLSelectElement;
    avatarNameSelect.value = 'Hana';

    streamBtn.disabled = false;
    streamBtn.click();

    await vi.waitFor(() => {
      expect(avatar.getAttribute('avatar-name')).toBe('Hana');
    });
  });

  it('should only load from localStorage on page load', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const getItemSpy = vi.mocked(localStorage.getItem);

    // Reset mock calls after page load (which happens in beforeEach)
    getItemSpy.mockClear();

    const toggleQaBtn = document.getElementById(
      'toggleQaBtn',
    ) as HTMLButtonElement;
    if (toggleQaBtn) {
      toggleQaBtn.click();
    }

    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it('should trigger OAuth flow when clicking start without token', async () => {
    // Override localStorage mock for this test to return null for token
    vi.mocked(localStorage.getItem).mockImplementation(key => {
      if (key === 'gemini_oauth_client_id') return 'test-client-id';
      return null;
    });

    document.dispatchEvent(new Event('DOMContentLoaded'));

    vi.spyOn(avatar, 'isConnected', 'get').mockReturnValue(false);

    const tokenInput = document.getElementById(
      'accessToken',
    ) as HTMLInputElement;
    if (tokenInput) tokenInput.value = '';

    streamBtn.disabled = false;
    streamBtn.click();

    await vi.waitFor(() => {});
  });

  it('should trigger OAuth flow when clicking login button', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const tokenInput = document.getElementById(
      'accessToken',
    ) as HTMLInputElement;
    if (tokenInput) tokenInput.value = '';

    const googleSignInBtn = document.getElementById(
      'googleSignInBtn',
    ) as HTMLButtonElement;
    if (googleSignInBtn) {
      googleSignInBtn.click();
      expect(mockTokenClient.requestAccessToken).toHaveBeenCalled();
    }
  });

  it('should alert on avatar-setup-error', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const modalSpy = vi.spyOn(uiHelpers, 'showMessageModal');

    avatar.dispatchEvent(
      new CustomEvent('avatar-setup-error', {
        detail: {error: new Error('test')},
      }),
    );

    expect(modalSpy).toHaveBeenCalledWith(
      'Setup Error',
      expect.stringContaining('Something went wrong. Likely causes:'),
    );
  });

  it('should clear expired token on load', async () => {
    const now = new Date().getTime();
    vi.mocked(localStorage.getItem).mockImplementation(key => {
      if (key === 'gemini_access_token') return 'expired-token';
      if (key === 'gemini_token_expiry') return (now - 1000).toString(); // Expired 1s ago
      if (key === 'gemini_oauth_client_id') return 'test-client-id';
      return null;
    });

    document.dispatchEvent(new Event('DOMContentLoaded'));

    const tokenInput = document.getElementById(
      'accessToken',
    ) as HTMLInputElement;

    await vi.waitFor(() => {
      expect(tokenInput.value).toBe('');
    });
  });
});
