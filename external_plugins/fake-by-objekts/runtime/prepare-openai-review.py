"""Build draft review/listing corrections from the immutable OpenAI package.

Runtime, package identity, MCP keys, skills and assets stay byte-identical.
This does not replace the published client archives or submit the draft.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
assert args.source.resolve() != args.output.resolve()
description = (
    'FAKE by objekts — character authoring with GNM geometry, versioned state, '
    'explicit identity approval and native portrait handoff. Created by objekts, '
    'a visual production studio.'
)
long_description = (
    'FAKE by objekts authors fictional adult characters with GNM head geometry, '
    'connected facial controls, Russian and English UI, versioned Character State '
    'and explicit Identity Master selection. Structured brief suggestions can '
    'initialize editable morphology; an extended range gives stronger changes '
    'while older projects retain their original calculation. Local photo fitting '
    'provides an approximate starting point. Studio transfers authored geometry '
    'and selected reference images to a compatible conversation for native '
    'portrait generation. Image generation depends on the capabilities of the '
    'current host. Exact likeness and geometry preservation require visual '
    'review. Age and tissue appearance includes generation guidance. Master '
    'import remains explicit. Created by objekts — a visual production studio '
    'creating films, images and visual worlds through direction, AI production, '
    'VFX and animation, from first idea to final frame. Barcelona / Moscow / '
    'Worldwide. https://objekts.ai/'
)
release_notes = (
    '0.4.9: recovered the existing deployed runtime, added Russian/English UI, '
    'structured morphology suggestions, extended versioned controls and MCP Apps '
    'image/context and short-lived reference-ticket handoff. Production source '
    'readback, 21 local tests and a live backend test using a public 1px fixture '
    'passed. The fixture test did not generate a portrait or verify Studio file '
    'selection. In the current cloud web Work trial, project creation was '
    'reported but Studio did not render. Full current in-host portrait generation '
    'and explicit Master reuse remain unverified. The inherited old walkthrough '
    'has been removed pending a verified current recording. This is an incomplete '
    'draft, not a release-ready or submitted product.'
)
changed = []
with zipfile.ZipFile(args.source) as source, zipfile.ZipFile(
    args.output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9
) as output:
    assert source.testzip() is None
    for entry in source.infolist():
        data = source.read(entry.filename)
        if entry.filename in ('plugin.json', '.codex-plugin/plugin.json'):
            manifest = json.loads(data)
            assert manifest['name'] == 'fake-by-objekts-chatgpt'
            assert manifest['version'] == '0.4.9'
            manifest['description'] = description
            metadata = manifest['extensions']['com.openai']
            interfaces = [metadata['interface']]
            if 'interface' in manifest:
                interfaces.append(manifest['interface'])
            for interface in interfaces:
                interface['longDescription'] = long_description
                interface['capabilities'] = [
                    'Edit GNM head geometry and versioned Character State',
                    'Use approximate local photo fitting as an authoring starting point',
                    'Separate anatomy, appearance, wardrobe and capture direction',
                    'Request native portraits through assisted handoff on compatible hosts',
                    'Manually import and approve an Identity Master',
                ]
            metadata['review']['demo_recording_url'] = ''
            metadata['publication']['release_notes'] = release_notes
            data = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
            changed.append(entry.filename)
        output.writestr(entry, data)
with zipfile.ZipFile(args.source) as before, zipfile.ZipFile(args.output) as after:
    assert before.namelist() == after.namelist()
    assert after.testzip() is None
    assert '.app.json' not in after.namelist()
    for name in after.namelist():
        if name not in changed:
            assert before.read(name) == after.read(name)
    for name in changed:
        value = json.loads(after.read(name))
        assert not value.get('apps')
        assert not value['extensions']['com.openai'].get('apps')
print(json.dumps({
    'source_sha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
    'output_sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
    'changed_members': changed,
    'unchanged_members': len(after.namelist()) - len(changed),
    'status': 'DRAFT_REVIEW_CORRECTION_ONLY_NOT_SUBMITTED'
}))
