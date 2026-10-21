#!/usr/bin/env python3
"""REMAKE by objekts: deterministic project packet preflight.

This checks *structure and declared source/canon consistency only*; it cannot
understand a film, inspect image pixels, or attest human approval.
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

VALID_STATUSES = {'PROPOSED', 'USER_APPROVED', 'LOCKED'}
VALID_EVIDENCE = {'OBSERVED', 'USER_STATED', 'MODEL_HYPOTHESIS', 'UNKNOWN'}


def validate(data: object) -> dict:
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    def add(kind: str, code: str, path: str, message: str) -> None:
        (errors if kind == 'error' else warnings).append(
            {'code': code, 'path': path, 'message': message}
        )

    if not isinstance(data, dict):
        add('error', 'INVALID_PACKET', '$', 'Root must be a JSON object.')
        return {'ok': False, 'errors': errors, 'warnings': warnings}

    for key in ['project_id', 'author_intent', 'revision']:
        if not isinstance(data.get(key), str) or not data[key].strip():
            add('error', 'REQUIRED', key, f'{key} must be a nonempty string.')

    assets = data.get('assets', [])
    if not isinstance(assets, list):
        add('error', 'INVALID_ASSETS', 'assets', 'Expected an array.')
        assets = []
    ids = set()
    for i, asset in enumerate(assets):
        p = f'assets[{i}]'
        if not isinstance(asset, dict):
            add('error', 'INVALID_ASSET', p, 'Expected an object.')
            continue
        aid = asset.get('id')
        if not isinstance(aid, str) or not aid.strip():
            add('error', 'MISSING_ASSET_ID', p + '.id', 'Unique source ID required.')
        elif aid in ids:
            add('error', 'DUPLICATE_ASSET', p + '.id', f'Duplicate ID: {aid}.')
        else:
            ids.add(aid)
        seen = asset.get('pixels_inspected') is True
        if asset.get('observation_status') == 'OBSERVED' and not seen:
            add('error', 'UNSEEN_CLAIM', p + '.observation_status',
                'OBSERVED requires pixels_inspected=true.')
        elif asset.get('observation_status') not in VALID_EVIDENCE:
            add('error', 'INVALID_EVIDENCE', p + '.observation_status',
                'Use OBSERVED, USER_STATED, MODEL_HYPOTHESIS, or UNKNOWN.')
        if seen and asset.get('kind') not in {'image', 'video_frame'}:
            add('warning', 'PIXEL_SCOPE', p + '.kind',
                'pixels_inspected can only describe an image or video frame.')

    locks = data.get('locks', {})
    if not isinstance(locks, dict):
        add('error', 'INVALID_LOCKS', 'locks', 'Expected an object mapping constraints to values.')
        locks = {}
    shots = data.get('shots', [])
    if not isinstance(shots, list):
        add('error', 'INVALID_SHOTS', 'shots', 'Expected an array.')
        shots = []
    shot_ids = set()
    for i, shot in enumerate(shots):
        p = f'shots[{i}]'
        if not isinstance(shot, dict):
            add('error', 'INVALID_SHOT', p, 'Expected an object.')
            continue
        sid = shot.get('id')
        if not isinstance(sid, str) or not sid:
            add('error', 'SHOT_ID_REQUIRED', p + '.id', 'Shot requires an ID.')
        elif sid in shot_ids:
            add('error', 'DUPLICATE_SHOT', p + '.id', 'Shot ID must be unique.')
        else:
            shot_ids.add(sid)
        status = shot.get('status', 'PROPOSED')
        if status not in VALID_STATUSES:
            add('error', 'INVALID_STATUS', p + '.status', 'Unsupported status.')
        if status in {'USER_APPROVED', 'LOCKED'} and not shot.get('user_approval_ref'):
            add('error', 'UNVERIFIED_APPROVAL', p + '.user_approval_ref',
                'User-approved shot requires explicit approval reference.')
        refs = shot.get('source_asset_ids', [])
        if not isinstance(refs, list):
            add('error', 'INVALID_REFS', p + '.source_asset_ids', 'Expected an array.')
            refs = []
        for aid in refs:
            if aid not in ids:
                add('error', 'UNRESOLVED_SOURCE', p + '.source_asset_ids',
                    f'Unknown source asset: {aid}.')
        for key, locked_value in locks.items():
            if key in shot and shot[key] != locked_value:
                add('error', 'LOCK_CONFLICT', p + '.' + key,
                    f'Value conflicts with project lock for {key}.')
        if not shot.get('visible_action'):
            add('warning', 'NO_VISIBLE_ACTION', p + '.visible_action',
                'No filmable action is declared; deliberate stillness can be valid.')
        for key in ['entry', 'exit', 'cut', 'sound']:
            if not shot.get(key):
                add('warning', 'INCOMPLETE_SHOT_CARD', p + '.' + key,
                    f'{key} not yet specified.')

    handoff = data.get('handoff', {})
    if not isinstance(handoff, dict):
        add('error', 'INVALID_HANDOFF', 'handoff', 'Expected an object.')
    else:
        if handoff.get('status', 'NOT_SENT') == 'SENT' and not (
            handoff.get('consent') is True and handoff.get('delivery_receipt')
        ):
            add('error', 'UNVERIFIED_SEND', 'handoff',
                'SENT requires explicit consent and actual delivery receipt.')
        if handoff.get('recipient') and handoff.get('consent') is not True:
            add('error', 'CONTACT_WITHOUT_CONSENT', 'handoff.recipient',
                'Do not populate a recipient without explicit consent.')

    return {'ok': not errors, 'errors': errors, 'warnings': warnings,
            'note': 'Static integrity check only; not visual, creative, human, or delivery verification.'}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('packet', type=Path, help='JSON packet')
    args = ap.parse_args()
    try:
        src = json.loads(args.packet.read_text(encoding='utf-8'))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(json.dumps({'ok': False, 'errors': [{'code': 'FILE_ERROR', 'message': str(exc)}]}, ensure_ascii=False))
        return 2
    result = validate(src)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
