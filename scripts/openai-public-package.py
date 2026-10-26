#!/usr/bin/env python3
"""Validate public metadata and reproducibly build a separate OpenAI draft.

Private manifests are never rewritten. Draft packaging is not submission,
catalog approval, host execution or artistic acceptance.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path, PurePosixPath
import struct
import unicodedata
import zipfile

REPO = Path(__file__).resolve().parents[1]
ICON_SHA256 = '677e4dd7f5215aaaa5dcada8a4326ec611024a6d9be1d6619435692be566ec44'


def validate_translations(manifest):
    translations = manifest['extensions']['com.openai'].get('publication', {}).get('translations')
    if translations is None:
        return 0
    if not isinstance(translations, dict):
        raise ValueError('translations must be an object or null')
    for locale, fields in translations.items():
        if not isinstance(locale, str) or not locale.strip() or not isinstance(fields, dict):
            raise ValueError('invalid translation locale/object')
        if set(fields) - {'subtitle', 'description'}:
            raise ValueError('unsupported translation fields: ' + ', '.join(sorted(set(fields) - {'subtitle', 'description'})))
        for key, value in fields.items():
            if value is None:
                continue
            limit = 30 if key == 'subtitle' else 4000
            if not isinstance(value, str) or not value.strip() or len(value) > limit:
                raise ValueError('invalid translated ' + key)
            if any(unicodedata.category(c) == 'Cc' and c != '\n' for c in value):
                raise ValueError('unsupported translation controls')
            if key == 'subtitle' and '\n' in value:
                raise ValueError('translated subtitle must be one line')
    return len(translations)


def validate_public_manifest(manifest, sources):
    if manifest.get('$schema') != 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json':
        raise ValueError('unrecognized portable manifest')
    extension = manifest['extensions']['com.openai']
    listing = extension['interface']
    for field, limit in [('displayName', 30), ('shortDescription', 30), ('longDescription', 4000), ('developerName', 80)]:
        value = listing.get(field)
        if not isinstance(value, str) or not value.strip() or len(value) > limit:
            raise ValueError('invalid listing field: ' + field)
    if manifest.get('apps') is not None or extension.get('apps') is not None or '.app.json' in sources:
        raise ValueError('private app binding in public author upload')
    locales = validate_translations(manifest)
    for field in ['logo', 'composerIcon']:
        name = listing[field].removeprefix('./')
        if name not in sources:
            raise ValueError('unresolved icon: ' + field)
        data = sources[name]
        if data[:8] != b'\x89PNG\r\n\x1a\n' or len(data) > 5 * 1024 * 1024:
            raise ValueError('invalid PNG icon')
        width, height = struct.unpack('>II', data[16:24])
        if width != height or width < 256 or width > 4096 or hashlib.sha256(data).hexdigest() != ICON_SHA256:
            raise ValueError('studio avatar changed or invalid')
    missing_urls = [k for k in ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL'] if not listing.get(k)]
    if 'mcp.json' in sources and missing_urls:
        raise ValueError('MCP review listing URLs missing: ' + ', '.join(missing_urls))
    for key in ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']:
        value = listing.get(key)
        if value is not None and (not isinstance(value, str) or not value.startswith('https://') or len(value) > 1024):
            raise ValueError('invalid listing URL: ' + key)
    return {'translation_locales': locales, 'missing_listing_urls': missing_urls,
            'URL_content_or_access_verified_by_this_build': False}


def build(plugin, output):
    root = REPO / 'plugins' / plugin
    inventory = json.loads((root / 'package-files.json').read_text())['files']
    if len(inventory) != len(set(inventory)):
        raise ValueError('duplicate package path')
    sources = {}
    for name in inventory:
        path = PurePosixPath(name)
        target = root / name
        if path.is_absolute() or '..' in path.parts or target.is_symlink() or not target.resolve().is_relative_to(root.resolve()) or not target.is_file():
            raise ValueError('missing or unsafe package path: ' + name)
        if name in {'.codex-plugin/plugin.json', '.mcp.json'}:
            continue
        sources[name] = target.read_bytes()
    private = json.loads(sources['plugin.json'])
    manifest = json.loads((root / 'distribution/openai/plugin.json').read_text())
    if any(manifest.get(k) != private.get(k) for k in ['name', 'version']):
        raise ValueError('public/private identity or version drift')
    if manifest['extensions']['com.openai']['interface']['defaultPrompt'] != private['extensions']['com.openai']['interface']['defaultPrompt']:
        raise ValueError('public/private ordered starter prompt drift')
    sources['plugin.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    checks = validate_public_manifest(manifest, sources)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(sources.items()):
            entry = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(sources):
            raise ValueError('archive integrity or inventory drift')
        validate_public_manifest(json.loads(archive.read('plugin.json')), {n: archive.read(n) for n in archive.namelist()})
    receipt = {'schema': 'objekts.openai-public-draft/1', 'plugin': manifest['name'], 'version': manifest['version'],
               'file_count': len(sources), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
               'metadata_checks': checks, 'state': 'PREPARED_NOT_UPLOADED', 'ready_for_review_submission': False,
               'private_manifest_modified': False, 'host_execution_verified': False, 'official_acceptance': False,
               'files': [{'path': n, 'sha256': hashlib.sha256(b).hexdigest()} for n, b in sorted(sources.items())]}
    output.with_suffix('.manifest.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    return receipt


def self_test():
    valid = {'extensions': {'com.openai': {'publication': {'translations': {'ru-RU': {'subtitle': 'Текст', 'description': 'Первая строка\nВторая строка'}}}}}}
    validate_translations(valid)
    results = []
    for fault in ['legacy_shortDescription', 'legacy_longDescription', 'unknown_translation_field', 'subtitle_newline', 'subtitle_too_long', 'description_control']:
        fixture = copy.deepcopy(valid)
        fields = fixture['extensions']['com.openai']['publication']['translations']['ru-RU']
        if fault == 'legacy_shortDescription':
            fields['shortDescription'] = fields.pop('subtitle')
        elif fault == 'legacy_longDescription':
            fields['longDescription'] = fields.pop('description')
        elif fault == 'unknown_translation_field':
            fields['name'] = 'Unknown'
        elif fault == 'subtitle_newline':
            fields['subtitle'] = 'One\nTwo'
        elif fault == 'subtitle_too_long':
            fields['subtitle'] = 'x' * 31
        else:
            fields['description'] = 'Text\tTab'
        try:
            validate_translations(fixture)
        except ValueError as error:
            results.append({'fixture': fault, 'rejected': True, 'reason': str(error)})
        else:
            raise AssertionError('malformed translation accepted: ' + fault)
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plugin', choices=['remake-by-objekts', 'skript-by-objekts'])
    parser.add_argument('--out', type=Path)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        print(json.dumps({'translation_regressions': self_test()}))
    if args.plugin:
        if args.out is None:
            parser.error('--out is required with --plugin')
        result = build(args.plugin, args.out)
        print(json.dumps({k: v for k, v in result.items() if k != 'files'}, ensure_ascii=False))
    elif not args.self_test:
        parser.error('--plugin or --self-test is required')
