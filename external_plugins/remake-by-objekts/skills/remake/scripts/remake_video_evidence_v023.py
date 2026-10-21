#!/usr/bin/env python3
"""REMAKE by objekts — offline frame/timecode evidence, no semantic video analysis.

Requires ffprobe and ffmpeg locally. Inputs are permissioned local media. The
metadata proves extracted frame location only, never scene content or intent.
This script does not run automatically in ChatGPT / Claude / Gemini plugins.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path


def _run(args: list[str]):
    return subprocess.run(args,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE,text=True,timeout=120,check=True)


def inspect(path: Path, out_dir: Path, count: int = 6, extract: bool = True):
    if not path.is_file():raise ValueError('input must be existing local file')
    if type(count) is not int or not (1<=count<=32):raise ValueError('sample count must be 1..32')
    if not shutil.which('ffprobe'):raise RuntimeError('ffprobe binary required')
    if extract and not shutil.which('ffmpeg'):raise RuntimeError('ffmpeg binary required')
    streams=json.loads(_run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]).stdout)
    video=next((s for s in streams.get('streams',[]) if s.get('codec_type')=='video'),None)
    if video is None:raise ValueError('no video stream found')
    frame_result=json.loads(_run(['ffprobe','-v','error','-select_streams','v:0','-show_frames',
                                  '-show_entries','frame=best_effort_timestamp_time,pict_type','-of','json',str(path)]).stdout)
    decoded=[]
    for i,f in enumerate(frame_result.get('frames',[])):
        try: pts=float(f['best_effort_timestamp_time'])
        except (ValueError,TypeError,KeyError):continue
        if not (float('-inf')<pts<float('inf')):continue
        decoded.append({'frame_index':i,'pts_seconds':pts,'pict_type':f.get('pict_type','?')})
    if not decoded:raise ValueError('no timestamped frames')
    sample_n=min(count,len(decoded))
    indices=sorted(set(round(k*(len(decoded)-1)/max(1,sample_n-1)) for k in range(sample_n)))
    chosen=[decoded[i].copy() for i in indices]
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    out_dir.mkdir(parents=True,exist_ok=True)
    for f in chosen:
        if extract:
            output=out_dir/f"frame_{f['frame_index']:06d}.png"
            _run(['ffmpeg','-v','error','-nostdin','-i',str(path),'-map','0:v:0','-an','-vf',f"select=eq(n\\,{f['frame_index']})",'-frames:v','1','-y',str(output)])
            if not output.is_file() or output.stat().st_size==0:raise RuntimeError('frame extraction produced no image')
            f['local_png']=output.name
        else:f['local_png']=None
    data={'schema_version':'remake.media-evidence/0.23','source_filename':path.name,
          'source_sha256':h.hexdigest(),'source_kind':'video',
          'duration_seconds_claimed_by_container':streams.get('format',{}).get('duration'),
          'video_width':video.get('width'),'video_height':video.get('height'),
          'codec':video.get('codec_name'),'frame_rate_rational':video.get('avg_frame_rate'),
          'audio_stream_present':any(s.get('codec_type')=='audio' for s in streams.get('streams',[])),
          'decoded_frames_with_pts':len(decoded),'selected_frame_count':len(chosen),
          'frames':chosen,'analyzed_visual_content':False,'speech_transcribed':False,
          'note':'Frame PTS/indices measured by ffprobe; no shot, subject, motion, narrative, audio or image semantics interpreted. Host model must inspect extracted images to claim visual observations.'}
    (out_dir/'manifest.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    return data


def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('video',type=Path);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--count',type=int,default=6);ap.add_argument('--no-extract',action='store_true')
    a=ap.parse_args();print(json.dumps(inspect(a.video,a.out,a.count,not a.no_extract),indent=2,ensure_ascii=False))

if __name__=='__main__':main()
