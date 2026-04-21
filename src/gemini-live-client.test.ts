import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiLiveClient } from './gemini-live-client';

describe('GeminiLiveClient', () => {
    let client: GeminiLiveClient;
    let mockWs: any;

    beforeEach(() => {
        mockWs = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: 1 // WebSocket.OPEN
        };
        // Mock global WebSocket
        global.WebSocket = vi.fn().mockImplementation(() => mockWs) as any;
        // @ts-ignore
        global.WebSocket.OPEN = 1;

        client = new GeminiLiveClient({
            projectId: 'test-project',
            accessToken: 'test-token',
            debug: true
        });
    });

    it('should connect with correct URL', () => {
        client.connect();
        expect(global.WebSocket).toHaveBeenCalledWith(
            expect.stringContaining('wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=test-token')
        );
    });

    it('should send setup on open', () => {
        client.connect();
        mockWs.onopen();
        expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('"setup"'));
    });

    it('should handle setupComplete message', () => {
        const onSetupComplete = vi.fn();
        client.onSetupComplete = onSetupComplete;
        client.connect();
        mockWs.onopen();
        
        mockWs.onmessage({ data: JSON.stringify({ setupComplete: {} }) });
        
        expect(onSetupComplete).toHaveBeenCalled();
    });

    it('should handle user transcript message', async () => {
        const onUserTranscript = vi.fn();
        client.onUserTranscript = onUserTranscript;
        client.connect();
        mockWs.onopen();
        
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { userTurn: { parts: [{ text: 'hello' }] } } }) });
        
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
        
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ text: 'hi there' }] } } }) });
        
        await vi.waitFor(() => {
            expect(onModelTranscript).toHaveBeenCalledWith('hi there');
        });
    });

    it('should handle audio data message', async () => {
        const onAudioData = vi.fn();
        client.onAudioData = onAudioData;
        client.connect();
        mockWs.onopen();
        
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm', data: 'base64data' } }] } } }) });
        
        await vi.waitFor(() => {
            expect(onAudioData).toHaveBeenCalledWith('base64data');
        });
    });

    it('should handle video data message', async () => {
        const onVideoData = vi.fn();
        client.onVideoData = onVideoData;
        client.connect();
        mockWs.onopen();
        
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'video/mp4', data: 'base64data' } }] } } }) });
        
        await vi.waitFor(() => {
            expect(onVideoData).toHaveBeenCalledWith('base64data', 'video/mp4');
        });
    });

    it('should handle raw blob message as video chunk', async () => {
        const onVideoChunk = vi.fn();
        client.onVideoChunk = onVideoChunk;
        client.connect();
        mockWs.onopen();
        
        const blob = new Blob(['video data'], { type: 'video/mp4' });
        mockWs.onmessage({ data: blob });
        
        await vi.waitFor(() => {
            expect(onVideoChunk).toHaveBeenCalledWith(blob);
        });
    });

    it('should send text message', () => {
        client.connect();
        mockWs.onopen();
        
        client.sendText('hello');
        
        expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('"text":"hello"'));
    });

    it('should send audio message', () => {
        client.connect();
        mockWs.onopen();
        
        client.sendAudio('base64data');
        
        expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('"data":"base64data"'));
    });

    it('should send video message', () => {
        client.connect();
        mockWs.onopen();
        
        client.sendVideo('base64data');
        
        expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('"data":"base64data"'));
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
        
        mockWs.onmessage({ data: JSON.stringify({ sessionResumptionUpdate: { resumable: true, newHandle: 'new-handle' } }) });
        
        await vi.waitFor(() => {
            expect((client as any).sessionHandle).toBe('new-handle');
        });
    });

    it('should trigger reconnection on goAway if eligible', async () => {
        client.connect();
        mockWs.onopen();
        mockWs.onmessage({ data: JSON.stringify({ setupComplete: {} }) });
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ text: 'hi' }] } } }) });
        mockWs.onmessage({ data: JSON.stringify({ sessionResumptionUpdate: { resumable: true, newHandle: 'test-handle' } }) });
        
        await vi.waitFor(() => {
            expect((client as any).receivedFirstResponse).toBe(true);
        });

        mockWs.onmessage({ data: JSON.stringify({ goAway: {} }) });
        
        expect(mockWs.close).toHaveBeenCalled();
    });

    it('should trigger reconnection on close if eligible', async () => {
        client.connect();
        mockWs.onopen();
        mockWs.onmessage({ data: JSON.stringify({ setupComplete: {} }) });
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ text: 'hi' }] } } }) });
        mockWs.onmessage({ data: JSON.stringify({ sessionResumptionUpdate: { resumable: true, newHandle: 'test-handle' } }) });
        
        await vi.waitFor(() => {
            expect((client as any).receivedFirstResponse).toBe(true);
        });

        mockWs.onclose();
        
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should send setup with session handle on reconnection', async () => {
        client.connect();
        mockWs.onopen();
        mockWs.onmessage({ data: JSON.stringify({ setupComplete: {} }) });
        mockWs.onmessage({ data: JSON.stringify({ serverContent: { modelTurn: { parts: [{ text: 'hi' }] } } }) });
        mockWs.onmessage({ data: JSON.stringify({ sessionResumptionUpdate: { resumable: true, newHandle: 'test-handle' } }) });
        
        await vi.waitFor(() => {
             expect((client as any).sessionHandle).toBe('test-handle');
        });

        mockWs.onclose();
        
        mockWs.onopen();
        
        expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('"handle":"test-handle"'));
    });
});
