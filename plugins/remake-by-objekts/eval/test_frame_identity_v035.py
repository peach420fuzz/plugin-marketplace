"""Decoder regression, synthetic AV only: compare samples to a full sequential decode.

No mocked subprocess, no creative evaluation, no assertion of host perception.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'skills/creative-companion/scripts'))
from remake_media_evidence_v026 import inspect, verify
from remake_video_evidence_v023 import inspect as legacy_inspect


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg required')
class FrameIdentityTests(unittest.TestCase):
    def test_sample_indices_match_independent_sequential_decode(self):
        with tempfile.TemporaryDirectory(prefix='remake-identity-') as tmp:
            root = Path(tmp)
            source = root / 'synthetic.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i',
                            'testsrc2=size=160x96:rate=8:duration=1',
                            '-an', '-c:v', 'mpeg4', '-y', str(source)], check=True)
            def pixels(path):
                return subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path),
                                       '-map', '0:v:0', '-an', '-pix_fmt', 'rgb24',
                                       '-f', 'rawvideo', '-fps_mode', 'passthrough', '-'],
                                      check=True, capture_output=True).stdout
            decoded = pixels(source)
            stride = 160 * 96 * 3
            self.assertEqual(len(decoded), 8 * stride)
            reference = [hashlib.sha256(decoded[i*stride:(i+1)*stride]).hexdigest() for i in range(8)]
            self.assertGreater(len(set(reference)), 1, 'fixture must distinguish frame indices')
            for version, run in [('current', inspect), ('legacy', legacy_inspect)]:
                folder = root / version
                manifest = run(source, folder, 4)
                persisted = json.loads((folder / 'manifest.json').read_text())
                self.assertEqual(persisted, manifest)
                self.assertEqual([f['frame_index'] for f in manifest['frames']], [0, 2, 5, 7])
                for frame in manifest['frames']:
                    file = folder / (frame.get('image_filename') or frame['local_png'])
                    self.assertEqual(hashlib.sha256(pixels(file)).hexdigest(), reference[frame['frame_index']])
                    self.assertAlmostEqual(frame['pts_seconds'], frame['frame_index'] / 8, places=6)
                if version == 'current':
                    self.assertTrue(verify(folder / 'manifest.json', source)['ok'])
                    self.assertFalse(manifest['host_received_media'])


if __name__ == '__main__':
    unittest.main()
