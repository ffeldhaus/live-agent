import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {GeminiAvatar} from './gemini-avatar';

describe('GeminiAvatar', () => {
  let element: GeminiAvatar;

  beforeEach(() => {
    // Mock MediaSource on window
    class MockMediaSource {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      addEventListener = vi.fn();
      readyState = 'closed';
      addSourceBuffer = vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        appendBuffer: vi.fn(),
      });
    }
    const mockMediaSourceConstructor = vi.fn().mockImplementation(function () {
      return new MockMediaSource();
    });
    Object.assign(mockMediaSourceConstructor, MockMediaSource);
    window.MediaSource = mockMediaSourceConstructor as any;
    globalThis.MediaSource = window.MediaSource;

    // Mock URL.createObjectURL
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost/mock-url',
    );

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{stop: vi.fn()}],
        }),
      },
      configurable: true,
    });

    // Mock AudioContext
    class MockAudioContext {
      createMediaStreamSource = vi.fn().mockReturnValue({
        connect: vi.fn(),
        disconnect: vi.fn(),
      });
      audioWorklet = {
        addModule: vi.fn().mockResolvedValue(undefined),
      };
      createGain = vi.fn().mockReturnValue({
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: {value: 1},
      });
      destination = {};
      currentTime = 0;
      close = vi.fn().mockResolvedValue(undefined);
    }
    const mockAudioContextConstructor = vi.fn().mockImplementation(function () {
      return new MockAudioContext();
    });
    window.AudioContext = mockAudioContextConstructor as any;
    globalThis.AudioContext = window.AudioContext;

    // Mock AudioWorkletNode
    class MockAudioWorkletNode {
      connect = vi.fn();
      port = {
        onmessage: null,
        postMessage: vi.fn(),
      };
    }
    const mockAudioWorkletNodeConstructor = vi
      .fn()
      .mockImplementation(function () {
        return new MockAudioWorkletNode();
      });
    window.AudioWorkletNode = mockAudioWorkletNodeConstructor as any;
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
    expect(stats.audioPacketsSent).toBe(0);
    expect(stats.videoPacketsSent).toBe(0);
    expect(stats.setupDurationMs).toBeNull();
  });

  it('should update stats correctly', () => {
    const anyEl = element as any;
    anyEl.startTime = 1000;
    anyEl.setupCompleteTime = 2000;
    anyEl.firstFrameTime = 2500;

    anyEl.client = {
      getStats: vi.fn().mockReturnValue({
        totalPacketsReceived: 10,
        audioPacketsReceived: 2,
        videoPacketsReceived: 3,
        textPacketsReceived: 5,
        totalPacketsSent: 20,
        audioPacketsSent: 5,
        videoPacketsSent: 10,
        textPacketsSent: 5,
      }),
      disconnect: vi.fn(),
    };

    const stats = element.getStats();
    expect(stats.setupDurationMs).toBe(1000);
    expect(stats.setupToFirstFrameDurationMs).toBe(500);
    expect(stats.packetsReceived).toBe(10);
    expect(stats.audioPacketsSent).toBe(5);
    expect(stats.videoPacketsSent).toBe(10);
    expect(stats.textPacketsSent).toBe(5);
    expect(stats.audioPacketsReceived).toBe(2);
    expect(stats.videoPacketsReceived).toBe(3);
    expect(stats.textPacketsReceived).toBe(5);
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
