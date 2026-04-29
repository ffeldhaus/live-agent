import {FFmpeg} from '@ffmpeg/ffmpeg';
import {fetchFile, toBlobURL} from '@ffmpeg/util';
import {downloadBlob} from './demo-helpers';

export async function processAndDownloadVideo(
  videoChunks: (Blob | ArrayBuffer)[],
  micChunks: Blob[],
  avatarPosition: string,
  avatar2VideoChunks?: Blob[],
  avatar2Position?: string,
  videoMimeType: string = 'video/mp4',
  filename: string = 'avatar_session.mp4',
  sherlogLink?: string,
) {
  console.log('Starting video processing...');

  const videoBlob = new Blob(videoChunks, {type: videoMimeType});

  const micMimeType = micChunks.length > 0 ? micChunks[0].type : 'audio/webm';
  console.log(`[Recorder] Mic Blob type: ${micMimeType}`);
  console.log(`[Recorder] Mic chunks count: ${micChunks.length}`);
  const totalMicSize = micChunks.reduce((acc, chunk) => acc + chunk.size, 0);
  console.log(`[Recorder] Mic total size: ${totalMicSize} bytes`);

  const micBlob = new Blob(micChunks, {type: micMimeType});
  let micExt = 'webm';
  if (micMimeType.includes('mp4')) {
    micExt = 'mp4';
  } else if (micMimeType === 'audio/pcm') {
    micExt = 'pcm';
  }
  const micFilename = `mic.${micExt}`;

  const ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({message}) => console.log('FFmpeg:', message));

  try {
    console.log('Loading FFmpeg core from CDN...');
    await ffmpeg.load({
      coreURL: await toBlobURL(
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        'text/javascript',
      ),
      wasmURL: await toBlobURL(
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
        'application/wasm',
      ),
    });
    console.log('FFmpeg loaded successfully');

    await ffmpeg.writeFile('video.mp4', await fetchFile(videoBlob));
    const hasMicAudio = micChunks.length > 0 && totalMicSize > 0;
    if (hasMicAudio) {
      await ffmpeg.writeFile(micFilename, await fetchFile(micBlob));
    }

    const hasAvatar2 = avatar2VideoChunks && avatar2VideoChunks.length > 0;
    if (hasAvatar2) {
      const avatar2Blob = new Blob(avatar2VideoChunks!, {type: videoMimeType});
      await ffmpeg.writeFile('video2.mp4', await fetchFile(avatar2Blob));
    }

    console.log('Files written to FFmpeg VFS');

    const isAvatar1Right =
      avatarPosition.includes('right') || avatarPosition.includes('middle');

    let filterComplex = '';
    const execArgs = ['-i', 'video.mp4'];

    if (hasMicAudio) {
      if (micExt === 'pcm') {
        execArgs.push('-f', 's16le', '-ar', '16000', '-ac', '1');
      }
      execArgs.push('-i', micFilename);
    }

    if (hasAvatar2) {
      execArgs.push('-i', 'video2.mp4');
    }

    if (hasMicAudio) {
      if (hasAvatar2) {
        // Avatar 1 (Input 0) + Avatar 2 (Input 2) + Mic (Input 1)
        const isAvatar2Left = avatar2Position
          ? avatar2Position.includes('left')
          : !isAvatar1Right;
        const a1Filter = isAvatar1Right ? 'c0=0|c1=c0' : 'c0=c0|c1=0';
        const a2Filter = isAvatar2Left ? 'c0=c0|c1=0' : 'c0=0|c1=c0';

        filterComplex = `[0:a]pan=stereo|${a1Filter}[a1]; [2:a]pan=stereo|${a2Filter}[a2]; [1:a]pan=stereo|c0=c0|c1=c0[amic]; [a1][a2][amic]amix=inputs=3[a]`;
      } else {
        // Avatar 1 + Mic
        if (isAvatar1Right) {
          filterComplex = '[1:a][0:a]amerge=inputs=2[a]';
        } else {
          filterComplex = '[0:a][1:a]amerge=inputs=2[a]';
        }
      }

      execArgs.push(
        '-filter_complex',
        filterComplex,
        '-map',
        '0:v',
        '-map',
        '[a]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
      );
    } else {
      // No mic audio
      if (hasAvatar2) {
        // Merge Avatar 1 and Avatar 2 audio
        const isAvatar2Left = avatar2Position
          ? avatar2Position.includes('left')
          : !isAvatar1Right;
        const a1Filter = isAvatar1Right ? 'c0=0|c1=c0' : 'c0=c0|c1=0';
        const a2Filter = isAvatar2Left ? 'c0=c0|c1=0' : 'c0=0|c1=c0';

        filterComplex = `[0:a]pan=stereo|${a1Filter}[a1]; [1:a]pan=stereo|${a2Filter}[a2]; [a1][a2]amix=inputs=2[a]`;

        execArgs.push(
          '-filter_complex',
          filterComplex,
          '-map',
          '0:v',
          '-map',
          '[a]',
          '-c:v',
          'copy',
          '-c:a',
          'aac',
        );
      } else {
        // Just copy video and audio from Avatar 1
        execArgs.push(
          '-map',
          '0:v',
          '-map',
          '0:a',
          '-c:v',
          'copy',
          '-c:a',
          'aac',
        );
      }
    }

    if (sherlogLink) {
      execArgs.push('-metadata', `comment=Sherlog Link: ${sherlogLink}`);
    }

    execArgs.push('output.mp4');

    console.log('Running FFmpeg with args:', execArgs);
    await ffmpeg.exec(execArgs);

    console.log('FFmpeg execution completed');

    const data = await ffmpeg.readFile('output.mp4');
    const outputBlob = new Blob([data], {type: 'video/mp4'});

    downloadBlob(outputBlob, filename);
    console.log('Download triggered');
  } catch (error) {
    console.error('Error processing video:', error);
    alert('Failed to process video download with FFmpeg.');
  }
}
