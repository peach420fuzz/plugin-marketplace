import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from remake_media_evidence_v026 import inspect,verify,file_hash,MAX_BYTES

@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'),'FFmpeg required')
class MediaEvidenceTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.t=tempfile.TemporaryDirectory(prefix='remake-v026-')
  cls.dir=Path(cls.t.name)
  cls.movie=cls.dir/'synthetic_av.mp4'
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=320x180:rate=12:duration=1.5',
                 '-f','lavfi','-i','sine=frequency=800:sample_rate=44100:duration=1.5',
                 '-c:v','mpeg4','-qscale:v','5','-c:a','aac','-shortest','-y',str(cls.movie)],check=True)
 @classmethod
 def tearDownClass(cls):cls.t.cleanup()
 def test_real_decode_with_audio_track(self):
  x=inspect(self.movie,self.dir/'decode',6);self.assertEqual(x['selected_frame_count'],6)
  self.assertEqual(x['video_width'],320);self.assertEqual(x['audio_stream_count'],1)
  self.assertTrue(all(f['image_sha256'] for f in x['frames']))
 def test_check_manifest(self):
  folder=self.dir/'validated'; inspect(self.movie,folder,4)
  self.assertTrue(verify(folder/'manifest.json',self.movie)['ok'])
 def test_tampered_frame(self):
  folder=self.dir/'tampered'; data=inspect(self.movie,folder,3)
  with (folder/data['frames'][0]['image_filename']).open('ab') as f:f.write(b'TAMPER')
  self.assertFalse(verify(folder/'manifest.json',self.movie)['ok'])
 def test_tampered_source(self):
  folder=self.dir/'source';inspect(self.movie,folder,3)
  altered=self.dir/'altered.mp4';shutil.copy(self.movie,altered)
  with altered.open('ab') as f:f.write(b'TAMPER')
  self.assertIn('SOURCE_DIGEST_MISMATCH',verify(folder/'manifest.json',altered)['errors'])
 def test_no_semantic_claim(self):
  x=inspect(self.movie,self.dir/'nomedia',3,False)
  self.assertFalse(x['observed_semantic_content']);self.assertFalse(x['audio_transcribed']);self.assertFalse(x['host_received_media'])
 def test_sample_one(self):self.assertEqual(inspect(self.movie,self.dir/'one',1,False)['selected_frame_count'],1)
 def test_out_of_scope_long_video_reject(self):
  path=self.dir/'too_long.mp4'
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','color=size=64x64:rate=1:duration=92',
                  '-c:v','mpeg4','-y',str(path)],check=True)
  with self.assertRaises(ValueError):inspect(path,self.dir/'long',2,False)
 def test_no_audio_track_does_not_hallucinate(self):
  path=self.dir/'silent.mp4'
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','color=size=64x64:rate=4:duration=1',
                  '-c:v','mpeg4','-an','-y',str(path)],check=True)
  p=inspect(path,self.dir/'silent-evidence',2,False)
  self.assertEqual(p['audio_stream_count'],0)
  self.assertEqual(p['audio_codecs'],[])
 def test_png_header_valid(self):
  import struct
  m=inspect(self.movie,self.dir/'verify_png',2,True)
  for f in m['frames']:
   raw=(self.dir/'verify_png'/f['image_filename']).read_bytes()
   self.assertTrue(raw.startswith(b"\x89PNG\r\n\x1a\n"))
   self.assertEqual((int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big')),(320,180))
 def test_zero_samples_reject(self):
  with self.assertRaises(ValueError):inspect(self.movie,self.dir/'z',0)
 def test_33_samples_reject(self):
  with self.assertRaises(ValueError):inspect(self.movie,self.dir/'33',33)
 def test_bad_nonvideo(self):
  p=self.dir/'not-a-video.mp4';p.write_text('not a video')
  with self.assertRaises((ValueError,subprocess.CalledProcessError)):
   inspect(p,self.dir/'bad')
 def test_symlink_reject(self):
  p=self.dir/'symlink.mp4';p.symlink_to(self.movie)
  with self.assertRaises(ValueError):inspect(p,self.dir/'sl')
 def test_detect_audio_present_not_transcript(self):
  m=inspect(self.movie,self.dir/'audio',2,False)
  self.assertEqual(m['audio_codecs'],['aac']);self.assertFalse(m['audio_transcribed'])
 def test_frame_pts_monotone(self):
  m=inspect(self.movie,self.dir/'pts',6,False)
  ps=[x['pts_seconds'] for x in m['frames']]
  self.assertEqual(ps,sorted(ps));self.assertTrue(all(isinstance(p,float) for p in ps))

if __name__=='__main__':unittest.main()
