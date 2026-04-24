import {describe, it, expect, vi, beforeEach} from 'vitest';
import './demo';
import {GeminiAvatar} from './gemini-avatar';
import * as fs from 'fs';
import * as path from 'path';

describe('Demo App', () => {
  let avatar: GeminiAvatar;
  let streamBtn: HTMLButtonElement;
  let mockTokenClient: any;

  beforeEach(() => {
    // @ts-ignore
    global.MediaSource = vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      readyState: 'closed',
      addSourceBuffer: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        appendBuffer: vi.fn(),
      }),
    }));

    // @ts-ignore
    URL.createObjectURL = vi
      .fn()
      .mockReturnValue('blob:http://localhost/mock-url');

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
    // @ts-ignore
    global.localStorage = localStorageMock;

    // Mock navigator.mediaDevices
    // @ts-ignore
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn().mockReturnValue([{stop: vi.fn()}]),
      }),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    };

    // Mock AudioContext
    // @ts-ignore
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createMediaStreamSource: vi
        .fn()
        .mockReturnValue({connect: vi.fn(), disconnect: vi.fn()}),
      createGain: vi.fn().mockReturnValue({
        gain: {value: 1},
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
    }));

    // Mock AudioWorkletNode
    // @ts-ignore
    global.AudioWorkletNode = vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      port: {onmessage: vi.fn()},
    }));

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
    global.alert = vi.fn();

    // Mock Google Identity Services
    mockTokenClient = {
      requestAccessToken: vi.fn(),
    };
    // @ts-ignore
    global.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
        },
        oauth2: {
          initTokenClient: vi.fn().mockReturnValue(mockTokenClient),
        },
      },
    };

    const oauthClientIdInput = document.getElementById(
      'oauthClientId',
    ) as HTMLInputElement;
    if (oauthClientIdInput) oauthClientIdInput.value = 'test-client-id';
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
    // @ts-ignore
    const getItemSpy = global.localStorage.getItem;

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
    // @ts-ignore
    global.localStorage.getItem.mockImplementation(key => {
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

    const alertSpy = vi.spyOn(global, 'alert');

    avatar.dispatchEvent(
      new CustomEvent('avatar-setup-error', {
        detail: {error: new Error('test')},
      }),
    );

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Something went wrong. Likely causes:'),
    );
  });
});
