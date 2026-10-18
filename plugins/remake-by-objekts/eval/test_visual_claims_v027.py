"""Synthetic fixtures for REMAKE visual claim association; contains no studio assets."""
import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from remake_visual_claims_v027 import validate_claims

class VisualLinkingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        d=Path(self.tmp.name)
        self.src=d/'clip.mp4';self.src.write_bytes(b'FAKE synthetic fixture not a video')
        self.frame=d/'frame_000001.png';self.frame.write_bytes(b'\x89PNG\r\n\x1a\nsynthetic-fixture')
        sh=hashlib.sha256(self.src.read_bytes()).hexdigest()
        fh=hashlib.sha256(self.frame.read_bytes()).hexdigest()
        self.manifest=d/'manifest.json'
        self.manifest.write_text(json.dumps({'schema_version':'remake.media-evidence/0.26','source_sha256':sh,
             'frames':[{'frame_index':1,'pts_seconds':0.0416667,'image_filename':self.frame.name,'image_sha256':fh}]}))
        self.sources={'S1':self.manifest};self.paths={'S1':self.src}
        self.packet={'schema_version':'remake.visual-evidence/0.27','sources':[{'source_id':'S1','source_sha256':sh}],
                     'claims':[{'id':'C1','source_id':'S1','source_sha256':sh,'frame_index':1,'pts_seconds':0.0416667,'frame_sha256':fh,
                                'evidence':'HOST_OBSERVED_FRAME','review_surface':'RENDERED_FRAMES_VIEWED_IN_CURRENT_SESSION',
                                'text':'a hypothetical observed object'}]}
    def validate(self, packet=None,src=None):return validate_claims(packet or self.packet,self.sources,src or self.paths)
    def err(self,code,p=None):self.assertIn(code,[x['code'] for x in self.validate(p)['errors']])
    def test_valid(self):self.assertTrue(self.validate()['ok'])
    def test_semantic_cannot_be_certified(self):self.assertIn('SEMANTIC_AND_IDENTITY_ATTESTATION_UNVERIFIED',[x['code'] for x in self.validate()['warnings']])
    def test_wrong_pts(self):p=copy.deepcopy(self.packet);p['claims'][0]['pts_seconds']=5;self.err('CLAIM_PTS_MISMATCH',p)
    def test_wrong_frame_sha(self):p=copy.deepcopy(self.packet);p['claims'][0]['frame_sha256']='0'*64;self.err('CLAIM_FRAME_SHA_MISMATCH',p)
    def test_missing_declared_inspection(self):p=copy.deepcopy(self.packet);p['claims'][0].pop('review_surface');self.err('MISSING_INSPECTION_DECLARATION',p)
    def test_unobserved_extra_frame(self):p=copy.deepcopy(self.packet);p['claims'][0]['frame_index']=2;self.err('UNINSPECTED_OR_UNKNOWN_FRAME',p)
    def test_wrong_clip(self):p=copy.deepcopy(self.packet);p['claims'][0]['source_id']='S2';self.err('UNKNOWN_SOURCE',p)
    def test_wrong_src_claim_sha(self):p=copy.deepcopy(self.packet);p['claims'][0]['source_sha256']='0'*64;self.err('CLAIM_SOURCE_SHA_MISMATCH',p)
    def test_wrong_src_declared_sha(self):p=copy.deepcopy(self.packet);p['sources'][0]['source_sha256']='0'*64;self.err('WRONG_SOURCE_HASH',p)
    def test_tampered_frame(self):self.frame.write_bytes(b'changed');self.err('FRAME_BYTES_CHANGED')
    def test_tampered_source(self):self.src.write_bytes(b'changed');self.err('SOURCE_BYTES_CHANGED')
    def test_bad_frame_filename(self):m=json.loads(self.manifest.read_text());m['frames'][0]['image_filename']='../../secrets';self.manifest.write_text(json.dumps(m));self.err('UNSAFE_FRAME_PATH')
    def test_hypothesis_not_approved(self):p=copy.deepcopy(self.packet);p['claims']=[{'id':'H1','source_id':'S1','source_sha256':p['sources'][0]['source_sha256'],'evidence':'MODEL_HYPOTHESIS','decision_status':'USER_APPROVED','text':'invented edit'}];self.err('UNAUTHORIZED_HYPOTHESIS_APPROVAL',p)
    def test_user_approval_unverified(self):p=copy.deepcopy(self.packet);p['claims'][0]['status']='USER_APPROVED';self.err('APPROVAL_CLAIM_NOT_VERIFIED',p)
    def test_unknown_provenance(self):p=copy.deepcopy(self.packet);p['claims'][0]['evidence']='UNTRUSTED';self.err('INVALID_EVIDENCE',p)
    def test_duplicate_claim_id(self):p=copy.deepcopy(self.packet);p['claims'].append(copy.deepcopy(p['claims'][0]));self.err('MISSING_OR_DUPLICATE_CLAIM_ID',p)
    def test_reject_fake_pts_on_hypothesis(self):p=copy.deepcopy(self.packet);p['claims'][0]['evidence']='MODEL_HYPOTHESIS';p['claims'][0]['decision_status']='PROPOSED';self.err('FRAME_BINDING_ONLY_FOR_OBSERVED_FRAME',p)
    def test_missing_rechecked_source_warns(self):r=validate_claims(self.packet,self.sources);self.assertTrue(r['ok']);self.assertIn('SOURCE_BYTES_NOT_RECHECKED',[x['code'] for x in r['warnings']])
if __name__=='__main__':unittest.main()
