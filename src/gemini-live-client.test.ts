import {describe, it, expect, vi, beforeEach} from 'vitest';
import {GeminiLiveClient} from './gemini-live-client';

describe('GeminiLiveClient', () => {
  let client: GeminiLiveClient;
  let mockWs: any;

  beforeEach(() => {
    mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1, // WebSocket.OPEN
    };
    // Mock global WebSocket
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        console.log('Mock WebSocket created!');
        return mockWs;
      }
    }
    const mockWebSocketConstructor = vi.fn().mockImplementation(function () {
      return new MockWebSocket();
    });
    Object.assign(mockWebSocketConstructor, MockWebSocket);
    vi.stubGlobal('WebSocket', mockWebSocketConstructor);

    client = new GeminiLiveClient({
      projectId: 'test-project',
      accessToken: 'test-token',
      debug: true,
      enableSessionResumption: true, // Enable for tests that assume it
    });
  });

  it('should connect with correct URL', () => {
    client.connect();
    expect(globalThis.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining(
        'wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=test-token',
      ),
    );
  });

  it('should send setup on open', () => {
    client.connect();
    mockWs.onopen();
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"setup"'),
    );
  });

  it('should handle setupComplete message', () => {
    const onSetupComplete = vi.fn();
    client.onSetupComplete = onSetupComplete;
    client.connect();
    mockWs.onopen();

    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});

    expect(onSetupComplete).toHaveBeenCalled();
  });

  it('should handle user transcript message', async () => {
    const onUserTranscript = vi.fn();
    client.onUserTranscript = onUserTranscript;
    client.connect();
    mockWs.onopen();

    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {userTurn: {parts: [{text: 'hello'}]}},
      }),
    });

    // Wait for async queue processing
    await vi.waitFor(() => {
      expect(onUserTranscript).toHaveBeenCalledWith('hello');
    });
  });

  it('should handle model transcript message', async () => {
    const onModelTranscript = vi.fn();
    client.onModelTranscript = onModelTranscript;
    client.connect();
    mockWs.onopen();

    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi there'}]}},
      }),
    });

    await vi.waitFor(() => {
      expect(onModelTranscript).toHaveBeenCalledWith('hi there');
    });
  });

  it('should handle audio data message', async () => {
    const onAudioData = vi.fn();
    client.onAudioData = onAudioData;
    client.connect();
    mockWs.onopen();

    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {
          modelTurn: {
            parts: [{inlineData: {mimeType: 'audio/pcm', data: 'base64data'}}],
          },
        },
      }),
    });

    await vi.waitFor(() => {
      expect(onAudioData).toHaveBeenCalledWith('base64data');
    });
  });

  it('should handle video data message', async () => {
    const onVideoData = vi.fn();
    client.onVideoData = onVideoData;
    client.connect();
    mockWs.onopen();

    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {
          modelTurn: {
            parts: [{inlineData: {mimeType: 'video/mp4', data: 'base64data'}}],
          },
        },
      }),
    });

    await vi.waitFor(() => {
      expect(onVideoData).toHaveBeenCalledWith('base64data', 'video/mp4');
    });
  });

  it('should handle raw blob message as video chunk', async () => {
    const onVideoChunk = vi.fn();
    client.onVideoChunk = onVideoChunk;
    client.connect();
    mockWs.onopen();

    const blob = new Blob(['video data'], {type: 'video/mp4'});
    mockWs.onmessage({data: blob});

    await vi.waitFor(() => {
      expect(onVideoChunk).toHaveBeenCalledWith(blob);
    });
  });

  it('should send text message', () => {
    client.connect();
    mockWs.onopen();

    client.sendText('hello');

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"text":"hello"'),
    );
  });

  it('should send audio message', () => {
    client.connect();
    mockWs.onopen();

    client.sendAudio('base64data');

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"data":"base64data"'),
    );
  });

  it('should send video message', () => {
    client.connect();
    mockWs.onopen();

    client.sendVideo('base64data');

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"data":"base64data"'),
    );
  });

  it('should disconnect', () => {
    client.connect();
    client.disconnect();

    expect(mockWs.close).toHaveBeenCalled();
    expect(client.isConnected).toBe(false);
  });

  it('should store session handle from sessionResumptionUpdate', async () => {
    client.connect();
    mockWs.onopen();

    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'new-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).sessionHandle).toBe('new-handle');
    });
  });

  it('should trigger reconnection on goAway if eligible', async () => {
    client.connect();
    mockWs.onopen();
    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi'}]}},
      }),
    });
    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'test-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).receivedFirstResponse).toBe(true);
    });

    mockWs.onmessage({data: JSON.stringify({goAway: {}})});

    await vi.waitFor(() => {
      expect(mockWs.close).toHaveBeenCalled();
    });
  });

  it('should trigger reconnection on close if eligible', async () => {
    client.connect();
    mockWs.onopen();
    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi'}]}},
      }),
    });
    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'test-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).receivedFirstResponse).toBe(true);
    });

    mockWs.onclose({code: 1000, reason: 'test'});

    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
  });

  it('should send setup with session handle on reconnection', async () => {
    client.connect();
    mockWs.onopen();
    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi'}]}},
      }),
    });
    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'test-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).sessionHandle).toBe('test-handle');
    });

    mockWs.onclose({code: 1000, reason: 'test'});

    mockWs.onopen();

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"handle":"test-handle"'),
    );
  });

  it('should call onSetupError if close happens before setupComplete', () => {
    const onSetupError = vi.fn();
    client.onSetupError = onSetupError;
    client.connect();
    mockWs.onopen();

    // Simulate close before setupComplete
    mockWs.onclose({code: 1000, reason: 'test'});

    expect(onSetupError).toHaveBeenCalled();
  });

  it('should delay reconnection on goAway if queue is not empty', async () => {
    client.connect();
    mockWs.onopen();
    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi'}]}},
      }),
    });
    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'test-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).receivedFirstResponse).toBe(true);
    });

    const onModelTranscript = vi.fn();
    client.onModelTranscript = onModelTranscript;

    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'msg1'}]}},
      }),
    });
    mockWs.onmessage({data: JSON.stringify({goAway: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'msg2'}]}},
      }),
    });

    await vi.waitFor(() => {
      expect(onModelTranscript).toHaveBeenCalledWith('msg2');
      expect(mockWs.close).toHaveBeenCalled();
    });
  });

  it('should delay reconnection on close if queue is not empty', async () => {
    client.connect();
    mockWs.onopen();
    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi'}]}},
      }),
    });
    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'test-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).receivedFirstResponse).toBe(true);
    });

    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'msg1'}]}},
      }),
    });

    mockWs.onclose({code: 1000, reason: 'test'});

    // Should not reconnect immediately
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);

    // Should reconnect after queue processing
    await vi.waitFor(() => {
      expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    });
  });

  it('should track sent messages in history', () => {
    client.connect();
    mockWs.onopen();

    client.sendText('hello');
    client.sendAudio('audio-data');
    client.sendVideo('video-data');

    const sentMessages = (client as any).sentMessages;
    expect(sentMessages.length).toBe(3);
    expect(sentMessages[0].index).toBe(1);
    expect(sentMessages[0].message.realtimeInput.text).toBe('hello');
    expect(sentMessages[1].index).toBe(2);
    expect(sentMessages[2].index).toBe(3);
  });

  it('should clear message history on new session handle', async () => {
    client.connect();
    mockWs.onopen();

    client.sendText('hello');
    expect((client as any).sentMessages.length).toBe(1);

    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'new-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).sentMessages.length).toBe(0);
    });
  });

  it('should purge message history based on lastConsumedClientMessageIndex', async () => {
    client.connect();
    mockWs.onopen();

    client.sendText('msg1'); // index 1
    client.sendText('msg2'); // index 2
    client.sendText('msg3'); // index 3

    expect((client as any).sentMessages.length).toBe(3);

    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {
          resumable: true,
          newHandle: 'new-handle',
          lastConsumedClientMessageIndex: '2',
        },
      }),
    });

    await vi.waitFor(() => {
      const sentMessages = (client as any).sentMessages;
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0].index).toBe(3);
      expect(sentMessages[0].message.realtimeInput.text).toBe('msg3');
    });
  });

  it('should not trigger reconnection on explicit disconnect', async () => {
    client.connect();
    mockWs.onopen();
    mockWs.onmessage({data: JSON.stringify({setupComplete: {}})});
    mockWs.onmessage({
      data: JSON.stringify({
        serverContent: {modelTurn: {parts: [{text: 'hi'}]}},
      }),
    });
    mockWs.onmessage({
      data: JSON.stringify({
        sessionResumptionUpdate: {resumable: true, newHandle: 'test-handle'},
      }),
    });

    await vi.waitFor(() => {
      expect((client as any).receivedFirstResponse).toBe(true);
    });

    const onDisconnected = vi.fn();
    client.onDisconnected = onDisconnected;

    client.disconnect();

    mockWs.onclose({code: 1000, reason: 'test'});

    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);
    expect(onDisconnected).toHaveBeenCalled();
  });

  it('should not enable session resumption by default', () => {
    const defaultClient = new GeminiLiveClient({
      projectId: 'test-project',
      accessToken: 'test-token',
    });
    // Reset mock to clear calls from beforeEach client
    globalThis.WebSocket = vi.fn().mockImplementation(function () {
      return mockWs;
    }) as any;

    defaultClient.connect();
    mockWs.onopen();

    expect(mockWs.send).not.toHaveBeenCalledWith(
      expect.stringContaining('"sessionResumption"'),
    );
  });

  it('should include transcription settings when enabled', () => {
    const clientWithTranscript = new GeminiLiveClient({
      projectId: 'test-project',
      accessToken: 'test-token',
      enableTranscript: true,
    });
    globalThis.WebSocket = vi.fn().mockImplementation(function () {
      return mockWs;
    }) as any;

    clientWithTranscript.connect();
    mockWs.onopen();

    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"inputAudioTranscription":{}'),
    );
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"outputAudioTranscription":{}'),
    );
    expect(mockWs.send).not.toHaveBeenCalledWith(
      expect.stringContaining('"TEXT"'),
    );
  });
});
