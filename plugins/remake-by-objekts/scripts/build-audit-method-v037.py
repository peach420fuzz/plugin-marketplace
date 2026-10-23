#!/usr/bin/env python3
"""Compile only public authored REMAKE instructions into a read-only Worker module.

No project inputs, sample media, user scripts, credentials or eval outputs belong here.
The supplied plugin root must be the same source used for the saved/reviewed package.
"""
import argparse
import hashlib
import json
from pathlib import Path

FILES = {
    'core': 'skills/creative-companion/SKILL.md',
    'audit_engine': 'skills/creative-companion/references/PRODUCTION_AUDIT_ENGINE.md',
    'departments': 'skills/creative-companion/references/DEPARTMENT_CONTRACTS_22.json',
    'handoffs': 'skills/creative-companion/references/CROSS_DEPARTMENT_HANDOFFS.md',
    'playbook': 'skills/creative-companion/references/DEPARTMENT_AUDIT_PLAYBOOK.md',
    'studio_bridge': 'skills/creative-companion/references/OBJEKTS_BRAND_AND_PRODUCTION_BRIDGE_v017.md',
}

def build(root, output):
    root=Path(root).resolve()
    version=json.loads((root/'plugin.json').read_text())['version']
    method={'version':version, 'source_files':[]}
    for key,name in FILES.items():
        p=root/name
        if p.is_symlink() or not p.resolve().is_relative_to(root):
            raise ValueError('unsafe method source')
        data=p.read_bytes()
        method[key]=json.loads(data) if name.endswith('.json') else data.decode('utf-8')
        method['source_files'].append({'path':name,'sha256':hashlib.sha256(data).hexdigest()})
    if [d['id'] for d in method['departments']['departments']] != [f'{i:02}' for i in range(1,23)]:
        raise ValueError('method department inventory drift')
    canonical=json.dumps(method,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    method['sha256']=hashlib.sha256(canonical).hexdigest()
    body='// Generated from the six allowlisted public method sources. Do not edit by hand.\nexport default '+json.dumps(method,ensure_ascii=False,sort_keys=True,separators=(',',':'))+';\n'
    Path(output).write_text(body)
    return {'version':version,'method_sha256':method['sha256'],'module_sha256':hashlib.sha256(body.encode()).hexdigest(),'source_files':method['source_files']}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    print(json.dumps(build(a.root,a.out),indent=2))
