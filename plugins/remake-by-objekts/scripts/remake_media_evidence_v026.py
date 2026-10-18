#!/usr/bin/env python3
"""REMAKE media evidence 0.26, local-only and opt-in; actual file hash + ffprobe PTS + PNG hashes.

Does NOT claim semantic interpretation, narrative accuracy, detected people, or audio transcription.
Does NOT send bytes to any server. Requires local ffmpeg/ffprobe.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import shutil
import subprocess
from pathlib import Path

SCHEMA = 'remake.media-evidence/0.26'
MAX_BYTES = 60 * 1024 * 1024
MAX_DURATION_S = 90.0
MAX_PIXELS = 3840 * 2160
MAX_SAMPLES = 32


def _cmd(args: list[str], timeout: int = 120) -> str:
    p = subprocess.run(args, stdin=subprocess.DEVNULL, capture_output=True,
                       timeout=timeout, check=True)
    return p.stdout.decode('utf-8', errors='replace')


def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda: f.read(1048576), b''):
            h.update(data)
    return h.hexdigest()


def _pts(x: object) -> float | None:
    try:
        value = float(x)
        if math.isfinite(value) and value >= 0:
            return value
    except (ValueError, TypeError):
        pass
    return None


def inspect(media_path: Path, output_folder: Path, samples: int = 6, extract: bool = True) -> dict:
    if type(samples) is not int or not 1 <= samples <= MAX_SAMPLES:
        raise ValueError('samples must be between 1 and 32')
    path = Path(media_path)
    if not path.is_file() or path.is_symlink():
        raise ValueError('requires a regular, existing local media file, not a symlink')
    nbytes = path.stat().st_size
    if nbytes <= 0 or nbytes > MAX_BYTES:
        raise ValueError('media byte-size exceeds local safety bound (60 MiB) or is empty')
    if not shutil.which('ffprobe') or (extract and not shutil.which('ffmpeg')):
        raise RuntimeError('local ffprobe/ffmpeg required')
    probe = json.loads(_cmd(['ffprobe','-v','error','-show_streams','-show_format', '-of','json',str(path)]))
    video = next((s for s in probe.get('streams',[]) if s.get('codec_type') == 'video'), None)
    if video is None:
        raise ValueError('no video track detected')
    width, height = int(video.get('width') or 0), int(video.get('height') or 0)
    if width < 1 or height < 1 or width * height > MAX_PIXELS:
        raise ValueError('invalid or oversized video dimensions')
    duration = _pts(probe.get('format', {}).get('duration'))
    if duration is None:
        raise ValueError('missing trustworthy container duration (fail closed)')
    if duration > MAX_DURATION_S:
        raise ValueError('media duration over 90 seconds')
    decode = json.loads(_cmd(['ffprobe','-v','error','-select_streams','v:0',
                            '-show_frames','-show_entries',
                            'frame=best_effort_timestamp_time,pict_type','-of','json',str(path)]))
    pts = []
    for index, frame in enumerate(decode.get('frames', [])):
        v = _pts(frame.get('best_effort_timestamp_time'))
        if v is not None:
            pts.append({'frame_index':index,'pts_seconds':v,'pict_type':frame.get('pict_type')})
    if not pts:
        raise ValueError('no timestamped video frames')
    if any(pts[i+1]['pts_seconds'] < pts[i]['pts_seconds'] for i in range(len(pts)-1)):
        raise ValueError('nonmonotonic presentation timestamps: unsafe to assign sampled frame positions')
    if pts[-1]['pts_seconds'] > MAX_DURATION_S:
        raise ValueError('PTS exceeds media duration limit')
    if any(pts[i+1]['frame_index'] <= pts[i]['frame_index'] for i in range(len(pts)-1)):
        raise ValueError('duplicate or unsorted frame index')
    n = min(samples, len(pts))
    choices = sorted({round(i*(len(pts)-1)/max(1,n-1)) for i in range(n)})
    picked = [dict(pts[j]) for j in choices]
    out = Path(output_folder)
    out.mkdir(parents=True, exist_ok=True)
    for frame in picked:
        frame['image_sha256'] = None
        frame['image_filename'] = None
        if not extract:
            continue
        file = out/f"frame_{frame['frame_index']:06d}.png"
        _cmd(['ffmpeg','-v','error','-nostdin','-i',str(path),'-map','0:v:0',
              '-an','-vf',f"select=eq(n\\,{frame['frame_index']})",'-vsync','0',
              '-frames:v','1','-y',str(file)], timeout=90)
        if not file.is_file() or file.stat().st_size == 0:
            raise RuntimeError('frame extraction did not produce a nonempty PNG')
        with file.open('rb') as f:
            if f.read(8) != b'\x89PNG\r\n\x1a\n':
                raise RuntimeError('ffmpeg output is not a valid PNG header')
        frame['image_filename'] = file.name
        frame['image_sha256'] = file_hash(file)
    audio = [s for s in probe.get('streams',[]) if s.get('codec_type') == 'audio']
    manifest = {'schema_version':SCHEMA,'source_filename':path.name,'source_sha256':file_hash(path),
                'source_size_bytes':nbytes,'source_kind':'video',
                'container_duration_seconds':duration,'video_width':width,'video_height':height,
                'video_codec':video.get('codec_name'), 'video_avg_frame_rate':video.get('avg_frame_rate'),
                'audio_stream_count':len(audio),'audio_codecs':[a.get('codec_name') for a in audio],
                'decoded_frames_with_pts':len(pts),'selected_frame_count':len(picked),'frames':picked,
                'provenance':'LOCAL_FFPROBE_MEASUREMENT',
                'observed_semantic_content':False,'audio_transcribed':False,
                'license_or_rights_verified':False,
                'host_received_media':False,
                'warnings':['Structural evidence only: source was read by local FFprobe, not by the host AI.',
                            'No film subjects, scene boundaries, audience effect, voice content or creative quality inferred.']}
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return manifest


def verify(manifest_path: Path, source_path: Path | None = None) -> dict:
    manifest_path = Path(manifest_path)
    m = json.loads(manifest_path.read_text(encoding='utf8'))
    errors=[]
    if m.get('schema_version') != SCHEMA: errors.append('SCHEMA_MISMATCH')
    if source_path:
        if file_hash(Path(source_path)) != m.get('source_sha256'): errors.append('SOURCE_DIGEST_MISMATCH')
    for f in m.get('frames',[]):
        name = f.get('image_filename')
        if not name: continue
        if Path(name).name != name: errors.append('UNSAFE_FRAME_NAME'); continue
        path=manifest_path.parent / name
        if not path.is_file() or file_hash(path) != f.get('image_sha256'):
            errors.append('FRAME_DIGEST_MISMATCH:'+name)
    return {'ok':not errors,'errors':errors,'source_bytes_attached_to_ai':False}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('video',type=Path)
    ap.add_argument('--out',type=Path,required=True)
    ap.add_argument('--samples',type=int,default=6)
    ap.add_argument('--no-extract',action='store_true')
    args=ap.parse_args()
    print(json.dumps(inspect(args.video,args.out,args.samples,not args.no_extract),ensure_ascii=False,indent=2))

if __name__=='__main__':main()
