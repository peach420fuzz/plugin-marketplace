#!/usr/bin/env python3
"""REMAKE 0.27 -- source-linked, local evidence/observation packet checker.

It verifies the exact source/frame bytes and association with technical PTS evidence.
It DOES NOT verify visual semantics, a human's identity, rights or a real AI-host plugin call.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

SCHEMA = 'remake.visual-evidence/0.27'
ALLOWED = {'HOST_OBSERVED_FRAME', 'USER_DESCRIBED', 'MODEL_HYPOTHESIS'}

def _sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def validate_claims(bundle: dict, manifest_paths: dict[str, Path], source_paths: dict[str, Path] | None = None) -> dict:
    errors: list[dict] = []
    warnings: list[dict] = []
    def add(code: str, at: str, *, warn: bool = False):
        (warnings if warn else errors).append({'code': code, 'at': at})
    if not isinstance(bundle, dict) or bundle.get('schema_version') != SCHEMA:
        return {'ok': False, 'errors': [{'code': 'INVALID_SCHEMA', 'at': '$'}], 'warnings': []}
    sources = bundle.get('sources')
    claims = bundle.get('claims')
    if not isinstance(sources, list) or not isinstance(claims, list) or len(sources) > 250 or len(claims) > 2500:
        return {'ok': False, 'errors': [{'code': 'INVALID_COLLECTIONS', 'at': '$'}], 'warnings': []}
    records = {}
    for i, s in enumerate(sources):
        p = f'sources[{i}]'
        if not isinstance(s, dict) or not isinstance(s.get('source_id'), str) or not s['source_id']:
            add('INVALID_SOURCE', p); continue
        sid=s['source_id']
        if sid in records:
            add('DUPLICATE_SOURCE', p); continue
        if sid not in manifest_paths:
            add('MISSING_MANIFEST', p); continue
        mf = Path(manifest_paths[sid]); manifest = json.loads(mf.read_text())
        if mf.is_symlink() or not mf.is_file():
            add('UNSAFE_MANIFEST_PATH', p); continue
        if manifest.get('schema_version') != 'remake.media-evidence/0.26':
            add('INVALID_MEDIA_MANIFEST', p); continue
        if s.get('source_sha256') != manifest.get('source_sha256'):
            add('WRONG_SOURCE_HASH', p); continue
        if source_paths and sid in source_paths:
            real_source=Path(source_paths[sid])
            if not real_source.is_file() or real_source.is_symlink() or _sha(real_source) != manifest['source_sha256']:
                add('SOURCE_BYTES_CHANGED', p)
        else:
            add('SOURCE_BYTES_NOT_RECHECKED', p, warn=True)
        frame_records = {}
        for f in manifest.get('frames', []):
            idx = f.get('frame_index')
            if type(idx) is not int or idx in frame_records:
                add('INVALID_FRAME_INDEX', p); continue
            name=f.get('image_filename')
            if not isinstance(name,str) or not name.endswith('.png') or Path(name).name != name or name in ('.','..'):
                add('UNSAFE_FRAME_PATH', p); continue
            path=mf.parent/name
            if not path.is_file() or path.is_symlink() or _sha(path) != f.get('image_sha256'):
                add('FRAME_BYTES_CHANGED', f'{p}.frame[{idx}]')
            frame_records[idx]=f
        records[sid] = (manifest,frame_records)
    ids=set()
    for j,c in enumerate(claims):
        p=f'claims[{j}]'
        if not isinstance(c,dict):
            add('INVALID_CLAIM',p);continue
        cid=c.get('id')
        if not isinstance(cid,str) or not cid or cid in ids:
            add('MISSING_OR_DUPLICATE_CLAIM_ID',p)
        else: ids.add(cid)
        evidence=c.get('evidence')
        if evidence not in ALLOWED: add('INVALID_EVIDENCE',p)
        if not isinstance(c.get('text'),str) or not c['text'].strip(): add('EMPTY_CLAIM_TEXT',p)
        sid=c.get('source_id')
        if sid not in records:
            add('UNKNOWN_SOURCE',p);continue
        if c.get('source_sha256')!=records[sid][0]['source_sha256']:
            add('CLAIM_SOURCE_SHA_MISMATCH',p)
        if evidence=='HOST_OBSERVED_FRAME':
            idx=c.get('frame_index')
            if type(idx) is not int or idx not in records[sid][1]:
                add('UNINSPECTED_OR_UNKNOWN_FRAME',p);continue
            f=records[sid][1][idx]
            if c.get('frame_sha256')!=f.get('image_sha256'): add('CLAIM_FRAME_SHA_MISMATCH',p)
            if type(c.get('pts_seconds')) not in (int,float) or abs(c['pts_seconds']-f['pts_seconds'])>0.0005:
                add('CLAIM_PTS_MISMATCH',p)
            if c.get('review_surface')!='RENDERED_FRAMES_VIEWED_IN_CURRENT_SESSION':
                add('MISSING_INSPECTION_DECLARATION',p)
            add('SEMANTIC_AND_IDENTITY_ATTESTATION_UNVERIFIED',p,warn=True)
        elif any(k in c for k in ('frame_index','frame_sha256','pts_seconds')):
            add('FRAME_BINDING_ONLY_FOR_OBSERVED_FRAME',p)
        if evidence=='MODEL_HYPOTHESIS' and c.get('decision_status') not in ('PROPOSED','UNDECIDED'):
            add('UNAUTHORIZED_HYPOTHESIS_APPROVAL',p)
        if c.get('status') in ('USER_APPROVED','LOCKED'):
            add('APPROVAL_CLAIM_NOT_VERIFIED',p)
    return {'ok': not errors, 'errors': errors, 'warnings': warnings,
            'verified_scope': 'Local bytes/source/frame hashes, PTS and claim association only. Not semantic truth, user permission, independent review or authenticated user approval.'}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('bundle',type=Path)
    ap.add_argument('--source',action='append',default=[],help='SOURCE_ID=MANIFEST_FILE')
    arg=ap.parse_args()
    mp = dict(x.split('=',1) for x in arg.source)
    res=validate_claims(json.loads(arg.bundle.read_text()),{k:Path(v) for k,v in mp.items()})
    print(json.dumps(res,indent=2,ensure_ascii=False))
    return 0 if res['ok'] else 1
if __name__=='__main__':
    raise SystemExit(main())
