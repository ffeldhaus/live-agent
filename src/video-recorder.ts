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
) {
  console.log('Starting video processing...');

  const videoBlob = new Blob(videoChunks, {type: videoMimeType});

  const micMimeType = micChunks.length > 0 ? micChunks[0].type : 'audio/webm';
  console.log(`[Recorder] Mic Blob type: ${micMimeType}`);
  const micBlob = new Blob(micChunks, {type: micMimeType});
  const micExt = micMimeType.includes('mp4') ? 'mp4' : 'webm';
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
    await ffmpeg.writeFile(micFilename, await fetchFile(micBlob));

    const hasAvatar2 = avatar2VideoChunks && avatar2VideoChunks.length > 0;
    if (hasAvatar2) {
      const avatar2Blob = new Blob(avatar2VideoChunks!, {type: videoMimeType});
      await ffmpeg.writeFile('video2.mp4', await fetchFile(avatar2Blob));
    }

    console.log('Files written to FFmpeg VFS');

    const isAvatar1Right =
      avatarPosition.includes('right') || avatarPosition.includes('middle');

    let filterComplex = '';
    const execArgs = ['-i', 'video.mp4', '-i', micFilename];

    if (hasAvatar2) {
      execArgs.push('-i', 'video2.mp4');

      // Avatar 1 (Input 0) + Avatar 2 (Input 2) + Mic (Input 1)
      // Avatar 1 to Right, Avatar 2 to Left, Mic to Center
      const isAvatar2Left = avatar2Position
        ? avatar2Position.includes('left')
        : !isAvatar1Right;
      const a1Filter = isAvatar1Right ? 'c0=0|c1=c0' : 'c0=c0|c1=0';
      const a2Filter = isAvatar2Left ? 'c0=c0|c1=0' : 'c0=0|c1=c0';

      filterComplex = `[0:a]pan=stereo|${a1Filter}[a1]; [2:a]pan=stereo|${a2Filter}[a2]; [1:a]pan=stereo|c0=c0|c1=c0[amic]; [a1][a2][amic]amix=inputs=3[a]`;
    } else {
      // Avatar 1 + Mic
      if (isAvatar1Right) {
        // Mic (Left) + Avatar (Right)
        filterComplex = '[1:a][0:a]amerge=inputs=2[a]';
      } else {
        // Avatar (Left) + Mic (Right)
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
      'output.mp4',
    );

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
