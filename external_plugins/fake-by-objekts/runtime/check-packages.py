"""Inspect the actual candidate ZIPs. This is not a live-host or review certificate."""
import hashlib
import json
import pathlib
import struct
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
source = json.loads((root / 'plugin.json').read_text())
version = source['version']
directory = root / 'releases' / version
receipts = json.loads((directory / 'manifest.json').read_text())
reports = []
for package in receipts['packages']:
    path = directory / package['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == package['sha256'], path
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
        names = archive.namelist()
        assert len(set(names)) == len(names)
        assert all(not n.startswith('/') and '..' not in pathlib.PurePosixPath(n).parts for n in names)
        assert '.app.json' not in names
        assert all(not n.startswith('runtime/') for n in names)
        if package['platform'] in ('openai', 'agent', 'public'):
            manifest = json.loads(archive.read('plugin.json'))
            assert manifest == source, 'ZIP differs from canonical source'
            compat = json.loads(archive.read('.codex-plugin/plugin.json'))
            for m in (manifest, compat):
                assert m.get('apps') is None
                assert m.get('extensions', {}).get('com.openai', {}).get('apps') is None
            openai = manifest['extensions']['com.openai']
            interface = openai['interface']
            assert compat['interface'] == interface
            assert compat['extensions']['com.openai'] == openai
            assert len(interface['displayName']) <= 30
            assert len(interface['shortDescription']) <= 30
            assert len(interface['longDescription']) <= 4000
            assert interface['category'] == 'Creativity'
            prompts = interface['defaultPrompt']
            assert 1 <= len(prompts) <= 3
            assert len({' '.join(p.split()) for p in prompts}) == len(prompts)
            assert all(p.strip() and '\n' not in p and len(p) <= 128 for p in prompts)
            for field in ('websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL'):
                assert interface[field].startswith('https://') and len(interface[field]) <= 1024
            for field, minimum in (('logo', 256), ('composerIcon', 48)):
                icon_path = interface[field].removeprefix('./')
                assert '..' not in pathlib.PurePosixPath(icon_path).parts
                icon = archive.read(icon_path)
                assert icon[:8] == b'\x89PNG\r\n\x1a\n' and len(icon) <= 5 * 1024 * 1024
                width, height = struct.unpack('>II', icon[16:24])
                assert width == height and width >= minimum
            cases = openai['review']['test_cases']
            assert len(cases['positive']) == 5 and len(cases['negative']) == 3
            for kind in ('positive', 'negative'):
                for case in cases[kind]:
                    required = ('description', 'prompt', 'tools_triggered', 'expected_behavior') if kind == 'positive' else ('description', 'prompt')
                    assert all(isinstance(case.get(k), str) and case[k].strip() for k in required)
        reports.append({'platform': package['platform'], 'file': path.name, 'sha256': package['sha256'], 'archive_checks': 'PASS'})
print(json.dumps({'version': version, 'packages': reports, 'scope': 'ARCHIVE_ONLY', 'live_host_tests': 'NOT_RUN_BY_THIS_CHECK', 'review_readiness': 'NOT_CERTIFIED', 'remaining': ['actual production/version agreement', 'real target-host generation and Master reuse', 'current-version reviewer video and public URL verification', 'developer identity and saved portal checks']}, ensure_ascii=False, indent=2))
