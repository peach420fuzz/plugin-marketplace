import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'skills/creative-companion/scripts'))
from remake_video_evidence_v023 import inspect

@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'),'requires real ffmpeg and ffprobe')
class FFmpegTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.dir=tempfile.TemporaryDirectory(prefix='remake-evidence-')
  cls.path=Path(cls.dir.name)/'sample.mp4'
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=160x96:rate=8:duration=1','-an','-c:v','mpeg4','-y',str(cls.path)],check=True)
 @classmethod
 def tearDownClass(cls):cls.dir.cleanup()
 def test_pts_is_measured(self):
  p=inspect(self.path,Path(self.dir.name)/'evidence',count=4,extract=True)
  self.assertEqual(p['decoded_frames_with_pts'],8);self.assertEqual(len(p['frames']),4)
  self.assertTrue(all('pts_seconds' in f for f in p['frames']))
  self.assertTrue(all((Path(self.dir.name)/'evidence'/f['local_png']).exists() for f in p['frames']))
 def test_not_visual_interpretation(self):
  p=inspect(self.path,Path(self.dir.name)/'metadata',count=3,extract=False)
  self.assertFalse(p['analyzed_visual_content']);self.assertFalse(p['speech_transcribed'])
 def test_single_frame(self):
  p=inspect(self.path,Path(self.dir.name)/'single',count=1,extract=False)
  self.assertEqual(p['selected_frame_count'],1)
 def test_bad_count(self):
  with self.assertRaises(ValueError):inspect(self.path,Path(self.dir.name)/'bad',count=33)
 def test_missing_source(self):
  with self.assertRaises(ValueError):inspect(Path(self.dir.name)/'no-file.mp4',Path(self.dir.name)/'bad')
if __name__=='__main__':unittest.main()
