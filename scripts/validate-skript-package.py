#!/usr/bin/env python3
"""Validate and reproducibly package authored SKRIPT source; no host/quality claim."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import tempfile
import zipfile

REPO = Path(__file__).resolve().parent.parent


def contained(root, name):
    path = root / name
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('unsafe package path: ' + name)
    if not path.is_file():
        raise ValueError('missing package file: ' + name)
    return path


def validate(root, adapter=None):
    root = Path(root).resolve()
    inventory = json.loads((root / 'package-files.json').read_text())['files']
    if len(inventory) != len(set(inventory)) or len(inventory) != 17:
        raise ValueError('authored SKRIPT inventory must contain 17 unique paths')
    sources = {name: contained(root, name).read_bytes() for name in inventory}
    manifest = json.loads(sources['plugin.json'])
    if manifest.get('name') != 'skript-by-objekts' or not re.fullmatch(r'\d+\.\d+\.\d+', manifest.get('version', '')):
        raise ValueError('invalid SKRIPT identity or version')
    extension = manifest['extensions']['com.openai']
    interface = extension['interface']
    for field, limit in [('displayName', 30), ('shortDescription', 30), ('longDescription', 4000)]:
        value = interface.get(field)
        if not isinstance(value, str) or not value.strip() or len(value) > limit:
            raise ValueError('invalid listing field: ' + field)
    prompts = interface['defaultPrompt']
    if not isinstance(prompts, list) or not 1 <= len(prompts) <= 3 or any(not isinstance(p, str) or not p.strip() or len(p) > 128 or '\n' in p for p in prompts):
        raise ValueError('invalid ordered starter prompts')
    if len({' '.join(p.split()).casefold() for p in prompts}) != len(prompts):
        raise ValueError('duplicate starter prompts')
    if interface['category'] != 'Creativity' or interface['capabilities'] != []:
        raise ValueError('SKRIPT must retain its creativity/skills-only contract')
    if manifest.get('apps') is not None or extension.get('apps') is not None:
        raise ValueError('private app binding cannot be authored into this package')
    for name in ['mcp.json', '.mcp.json', '.app.json']:
        if (root / name).exists():
            raise ValueError('unexpected service/app dependency: ' + name)
    compatibility = root / '.codex-plugin/plugin.json'
    compatibility_state = 'absent from authored source; not required'
    if compatibility.exists():
        legacy = json.loads(contained(root, '.codex-plugin/plugin.json').read_text())
        legacy_interface = legacy.get('interface', legacy.get('extensions', {}).get('com.openai', {}).get('interface'))
        if legacy.get('name') != manifest['name'] or legacy.get('version') != manifest['version'] or not isinstance(legacy_interface, dict) or legacy_interface.get('defaultPrompt') != prompts:
            raise ValueError('compatibility identity/version/ordered starter drift')
        compatibility_state = 'present and identity/version/ordered prompts checked'
    links = 0
    for name, data in sources.items():
        if not name.endswith('.md'):
            continue
        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)', data.decode('utf-8')):
            target = target.strip().strip('<>')
            if target.startswith(('https://', 'http://', '#')):
                continue
            if ':' in target:
                raise ValueError('unsupported reference scheme: ' + target)
            resolved = (root / name).parent / target.split('#', 1)[0]
            if not resolved.resolve().is_relative_to(root) or not resolved.is_file():
                raise ValueError('unsafe or missing Markdown reference: ' + name + ': ' + target)
            if str(resolved.resolve().relative_to(root)) not in sources:
                raise ValueError('Markdown reference omitted from package: ' + target)
            links += 1
    for field in ['logo', 'composerIcon']:
        name = interface[field].removeprefix('./')
        if name not in sources:
            raise ValueError('icon omitted from package: ' + field)
        data = sources[name]
        if data[:8] != b'\x89PNG\r\n\x1a\n' or len(data) > 5 * 1024 * 1024:
            raise ValueError('invalid PNG icon')
        width, height = struct.unpack('>II', data[16:24])
        if width != height or width < 256 or hashlib.sha256(data).hexdigest() != '677e4dd7f5215aaaa5dcada8a4326ec611024a6d9be1d6619435692be566ec44':
            raise ValueError('studio icon geometry or source drift')
    roots = [root]
    if adapter is not None:
        adapter = Path(adapter).resolve()
        roots.append(adapter)
        for name, data in sources.items():
            if contained(adapter, name).read_bytes() != data:
                raise ValueError('native/adapter source mismatch: ' + name)
    for directory in roots:
        claude = json.loads(contained(directory, '.claude-plugin/plugin.json').read_text())
        gemini = json.loads(contained(directory, 'gemini-extension.json').read_text())
        for wrapper in [claude, gemini]:
            if wrapper.get('name') != manifest['name'] or wrapper.get('version') != manifest['version'] or wrapper.get('mcpServers'):
                raise ValueError('source wrapper identity/version or service drift')
        contained(directory, gemini['contextFileName'])
    missing_urls = [key for key in ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL'] if not interface.get(key)]
    return sources, {'version': manifest['version'], 'authored_files': len(sources), 'markdown_links_checked': links, 'compatibility': compatibility_state, 'native_adapter_equal': adapter is not None, 'missing_public_listing_urls': missing_urls}


def build(root, output, adapter=None):
    sources, result = validate(root, adapter)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(sources.items()):
            info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(sources):
            raise ValueError('ZIP content or integrity mismatch')
    result.update({'archive_sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'source_valid': True, 'ready_for_public_submission': False, 'host_execution': False, 'artistic_acceptance': False, 'files': [{'path': n, 'sha256': hashlib.sha256(d).hexdigest()} for n, d in sorted(sources.items())]})
    output.with_suffix('.manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


def self_test(root):
    results = []
    for fault in ['compatibility_version_drift', 'escaping_markdown_reference', 'omitted_source_card']:
        with tempfile.TemporaryDirectory(prefix='skript-structural-') as temporary:
            copy = Path(temporary) / 'skript'
            shutil.copytree(root, copy)
            if fault == 'compatibility_version_drift':
                manifest = json.loads((copy / 'plugin.json').read_text())
                path = copy / '.codex-plugin/plugin.json'
                path.parent.mkdir(exist_ok=True)
                path.write_text(json.dumps({'name': manifest['name'], 'version': '0.0.0', 'interface': manifest['extensions']['com.openai']['interface']}))
            elif fault == 'escaping_markdown_reference':
                path = copy / 'skills/script-workshop/references/SCENE_AND_REWRITE.md'
                path.write_text(path.read_text() + '\n[Outside](../../../../../escape.md)\n')
            else:
                (copy / 'skills/script-workshop/references/SOURCE_CARD_GOD.md').unlink()
            try:
                validate(copy)
            except ValueError as error:
                results.append({'fixture': fault, 'rejected': True, 'reason': str(error)})
            else:
                raise AssertionError('invalid package accepted: ' + fault)
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=REPO / 'plugins/skript-by-objekts')
    parser.add_argument('--adapter', type=Path, default=REPO / 'external_plugins/skript-by-objekts')
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--self-test', action='store_true', help='Reject three malformed package fixtures before the real build')
    args = parser.parse_args()
    regressions = self_test(args.root) if args.self_test else []
    result = build(args.root, args.out, args.adapter)
    if regressions:
        result['structural_regressions'] = regressions
        args.out.with_suffix('.manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'files'}, ensure_ascii=False))
