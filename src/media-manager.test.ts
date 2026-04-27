import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {MediaManager} from './media-manager';

describe('MediaManager', () => {
  let manager: MediaManager;
  let videoEl: HTMLVideoElement;

  beforeEach(() => {
    videoEl = document.createElement('video');
    manager = new MediaManager(videoEl);

    // Mock MediaSource
    class MockMediaSource {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      addEventListener = vi.fn().mockImplementation((event, cb) => {
        if (event === 'sourceopen') {
          setTimeout(cb, 0); // Simulate async open
        }
      });
      readyState = 'open';
      addSourceBuffer = vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        appendBuffer: vi.fn(),
        updating: false,
      });
      endOfStream = vi.fn();
    }
    const mockMediaSourceConstructor = vi.fn().mockImplementation(function () {
      return new MockMediaSource();
    });
    Object.assign(mockMediaSourceConstructor, MockMediaSource);
    globalThis.MediaSource = mockMediaSourceConstructor as any;

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
      createBufferSource = vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        buffer: null,
      });
      createBuffer = vi.fn().mockReturnValue({
        copyToChannel: vi.fn(),
        duration: 1,
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
      disconnect = vi.fn();
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize MediaSource', async () => {
    manager.init(false);
    expect(globalThis.MediaSource).toHaveBeenCalled();

    // Wait for sourceopen callback
    await vi.waitFor(() => {
      expect(videoEl.src).toBe('blob:http://localhost/mock-url');
    });
  });

  it('should start mic', async () => {
    const started = await manager.startMic('2048');
    expect(started).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });
    expect(window.AudioContext).toHaveBeenCalled();
  });

  it('should stop mic', async () => {
    await manager.startMic('2048');
    manager.stopMic();
    // Verify cleanup (mocks should have been called)
    expect(manager.getMicStream()).toBeNull();
  });

  it('should play audio chunk', async () => {
    await manager.playAudioChunk('base64data');
    // AudioContext should be created or used
    expect(window.AudioContext).toHaveBeenCalled();
  });

  it('should handle video data chunk', async () => {
    manager.init(false);
    // Wait for sourceopen to set sourceBuffer
    await vi.waitFor(() => {
      expect((manager as any).sourceBuffer).toBeTruthy();
    });

    await manager.handleVideoDataChunk('base64data', 'video/mp4');
    // Should append to buffer (async)
    expect((manager as any).sourceBuffer.appendBuffer).toHaveBeenCalled();
  });

  it('should handle video chunk as blob', async () => {
    manager.init(false);
    await vi.waitFor(() => {
      expect((manager as any).sourceBuffer).toBeTruthy();
    });

    const blob = new Blob(['data'], {type: 'video/mp4'});
    await manager.handleVideoChunk(blob);
    expect((manager as any).sourceBuffer.appendBuffer).toHaveBeenCalled();
  });

  it('should handle mute and unmute', () => {
    manager.setMuted(true);
    expect(videoEl.muted).toBe(true);

    manager.setMuted(false);
    expect(videoEl.muted).toBe(false);
  });
});
