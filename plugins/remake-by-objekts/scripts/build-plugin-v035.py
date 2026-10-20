#!/usr/bin/env python3
"""Build the complete Plugin Creator package from an explicit file inventory.

No media, Worker secrets, staging code or developer-only files are packaged.
Static packaging verification is not public-directory or creative acceptance.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def build(output):
    paths = json.loads((ROOT / 'package-files.json').read_text())['files']
    if len(paths) != len(set(paths)):
        raise ValueError('duplicate package path')
    manifest = json.loads((ROOT / 'plugin.json').read_text())
    overlay = json.loads((ROOT / '.codex-plugin/plugin.json').read_text())
    if overlay.get('version') != manifest['version']:
        raise ValueError('manifest version drift')
    if overlay.get('interface') != manifest['extensions']['com.openai']['interface']:
        raise ValueError('manifest interface drift')
    sources = {}
    for name in paths:
        target = ROOT / name
        if target.is_symlink() or not target.resolve().is_relative_to(ROOT) or not target.is_file():
            raise ValueError('missing or unsafe package path: ' + name)
        if '__pycache__' in name or name.endswith(('.pyc', '.mp4', '.mov')):
            raise ValueError('non-source package file: ' + name)
        sources[name] = target.read_bytes()
    for name, data in sources.items():
        if name.endswith('.md'):
            for link in re.findall(rb'`((?:references/|scripts/)[^` ]+)`', data):
                parent = Path(name).parent
                relative = (parent / link.decode()).as_posix()
                skill_root = Path(*Path(name).parts[:2])
                root_relative = (skill_root / link.decode()).as_posix()
                if relative not in sources and root_relative not in sources:
                    raise ValueError(f'missing skill dependency: {name}: {link.decode()}')
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(sources.items()):
            info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    receipt = {'schema':'remake.build/1', 'version':manifest['version'],
               'file_count':len(sources), 'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
               'files':[{'path':n,'sha256':hashlib.sha256(d).hexdigest(),'bytes':len(d)}
                        for n,d in sorted(sources.items())],
               'public_release_accepted':False, 'host_verified':False}
    output.with_suffix('.manifest.json').write_text(json.dumps(receipt, indent=2) + '\n')
    return receipt


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    result = build(parser.parse_args().out)
    print(json.dumps({k:v for k,v in result.items() if k != 'files'}))
