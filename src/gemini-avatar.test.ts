import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {GeminiAvatar} from './gemini-avatar';

describe('GeminiAvatar', () => {
  let element: GeminiAvatar;

  beforeEach(() => {
    // Mock MediaSource on window
    // @ts-ignore
    window.MediaSource = vi.fn().mockImplementation(function () {
      return {
        addEventListener: vi.fn(),
        readyState: 'closed',
        addSourceBuffer: vi.fn().mockReturnValue({
          addEventListener: vi.fn(),
          appendBuffer: vi.fn(),
        }),
      };
    });
    // @ts-ignore
    globalThis.MediaSource = window.MediaSource;

    // Mock URL.createObjectURL
    URL.createObjectURL = vi
      .fn()
      .mockReturnValue('blob:http://localhost/mock-url');

    // Mock navigator.mediaDevices
    // @ts-ignore
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{stop: vi.fn()}],
        }),
      },
      configurable: true,
    });

    // Mock AudioContext
    // @ts-ignore
    window.AudioContext = vi.fn().mockImplementation(function () {
      return {
        createMediaStreamSource: vi.fn().mockReturnValue({
          connect: vi.fn(),
          disconnect: vi.fn(),
        }),
        audioWorklet: {
          addModule: vi.fn().mockResolvedValue(undefined),
        },
        createGain: vi.fn().mockReturnValue({
          connect: vi.fn(),
          disconnect: vi.fn(),
          gain: {value: 1},
        }),
        destination: {},
        currentTime: 0,
        close: vi.fn().mockResolvedValue(undefined),
      };
    });
    globalThis.AudioContext = window.AudioContext;

    // Mock AudioWorkletNode
    // @ts-ignore
    window.AudioWorkletNode = vi.fn().mockImplementation(function () {
      return {
        connect: vi.fn(),
        port: {
          onmessage: null,
          postMessage: vi.fn(),
        },
      };
    });
    globalThis.AudioWorkletNode = window.AudioWorkletNode;
    // @ts-ignore
    globalThis.AudioWorkletNode = window.AudioWorkletNode;

    if (!customElements.get('gemini-avatar')) {
      customElements.define('gemini-avatar', GeminiAvatar);
    }

    element = document.createElement('gemini-avatar') as GeminiAvatar;
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.restoreAllMocks();
  });

  it('should be registered', () => {
    expect(customElements.get('gemini-avatar')).toBeDefined();
  });

  it('should render basic structure', () => {
    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).toBeTruthy();
    expect(shadowRoot?.querySelector('#avatar-video')).toBeTruthy();
    expect(shadowRoot?.querySelector('#preview-image')).toBeTruthy();
    expect(shadowRoot?.querySelector('.controls')).toBeTruthy();
  });

  it('should update size when attribute changes', () => {
    element.setAttribute('size', '200px');
    expect(element.style.width).toBe('200px');
  });

  it('should update position when attribute changes', () => {
    element.setAttribute('position', 'bottom-left');
    expect(element.style.bottom).toBe('20px');
    expect(element.style.left).toBe('20px');
  });

  it('should set preview image correctly', () => {
    element.setAttribute('avatar-name', 'Kira');
    const img = element.shadowRoot?.querySelector(
      '#preview-image',
    ) as HTMLImageElement;
    expect(img.src).toContain('kira.png');
    expect(img.style.display).toBe('block');
  });

  it('should hide preview image for AudioOnly', () => {
    element.setAttribute('avatar-name', 'AudioOnly');
    const img = element.shadowRoot?.querySelector(
      '#preview-image',
    ) as HTMLImageElement;
    expect(img.style.display).toBe('none');
  });

  it('should expose start and stop methods', () => {
    expect(typeof element.start).toBe('function');
    expect(typeof element.stop).toBe('function');
  });

  it('should expose mute and unmute methods', () => {
    expect(typeof element.mute).toBe('function');
    expect(typeof element.unmute).toBe('function');
  });

  it('should expose sendMessage method', () => {
    expect(typeof element.sendMessage).toBe('function');
  });

  it('should return stats with default values', () => {
    const stats = element.getStats();
    expect(stats.packetsReceived).toBe(0);
    expect(stats.audioChunksSent).toBe(0);
    expect(stats.videoFramesSent).toBe(0);
    expect(stats.setupDurationMs).toBeNull();
  });

  it('should update stats correctly', () => {
    const anyEl = element as any;
    anyEl.startTime = 1000;
    anyEl.setupCompleteTime = 2000;
    anyEl.firstFrameTime = 2500;
    anyEl.packetsReceived = 10;
    anyEl.mediaManager.audioChunksSent = 5;
    anyEl.mediaManager.videoFramesReceived = 48;

    anyEl.videoEl = document.createElement('video');
    anyEl.videoEl.getVideoPlaybackQuality = vi
      .fn()
      .mockReturnValue({totalVideoFrames: 48});

    const stats = element.getStats();
    expect(stats.setupDurationMs).toBe(1000);
    expect(stats.setupToFirstFrameDurationMs).toBe(500);
    expect(stats.packetsReceived).toBe(10);
    expect(stats.audioChunksSent).toBe(5);
    expect(stats.totalVideoFrames).toBe(48);
  });

  it('should show/hide controls based on visible-controls attribute', () => {
    element.setAttribute('visible-controls', 'mic,mute');

    const micBtn = element.shadowRoot?.querySelector(
      'button:nth-child(1)',
    ) as HTMLButtonElement;
    const camBtn = element.shadowRoot?.querySelector(
      'button:nth-child(2)',
    ) as HTMLButtonElement;
    const screenBtn = element.shadowRoot?.querySelector(
      'button:nth-child(3)',
    ) as HTMLButtonElement;
    const muteBtn = element.shadowRoot?.querySelector(
      'button:nth-child(4)',
    ) as HTMLButtonElement;
    const snapshotBtn = element.shadowRoot?.querySelector(
      'button:nth-child(5)',
    ) as HTMLButtonElement;

    expect(micBtn.style.display).toBe('');
    expect(camBtn.style.display).toBe('none');
    expect(screenBtn.style.display).toBe('none');
    expect(muteBtn.style.display).toBe('');
    expect(snapshotBtn.style.display).toBe('none');
  });

  it('should call mediaManager.startMic and client.connect on start', async () => {
    const anyEl = element as any;
    anyEl.mediaManager = {
      startMic: vi.fn().mockResolvedValue(true),
      setRecordingVideo: vi.fn(),
      setupMicRecorder: vi.fn(),
      stopMic: vi.fn(),
      stopVideoStreaming: vi.fn(),
      resetMediaSource: vi.fn(),
      stopRecording: vi.fn(),
    };
    anyEl.tryConnect = vi.fn().mockResolvedValue(undefined);

    element.setAttribute('access-token', 'test-token');
    element.setAttribute('project-id', 'test-project');

    await element.start();

    expect(anyEl.mediaManager.startMic).toHaveBeenCalled();
    expect(anyEl.tryConnect).toHaveBeenCalled();
  });
});
