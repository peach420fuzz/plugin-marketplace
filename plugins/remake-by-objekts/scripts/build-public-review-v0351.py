#!/usr/bin/env python3
"""Reproducibly build an OpenAI public draft from the full existing REMAKE source.

Repository-owned owner-selected artwork derivative is verified by SHA256. No private compatibility bindings or
review demo URL are invented. This builder does not upload or submit anything.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import zipfile
import zlib

ROOT=Path(__file__).resolve().parents[1]
ARTWORK={
 'objekts-remake-charcoal.png':('objekts-remake-charcoal.png','677e4dd7f5215aaaa5dcada8a4326ec611024a6d9be1d6619435692be566ec44',256),
}
CATEGORIES={'Business & Operations','Communication','Creativity','Data & Analytics','Developer Tools','Education & Research','Entertainment','Finance','Healthcare','Other','Productivity','Scientific Research','Security','Travel'}

def check_png(data,min_size):
 if data[:8]!=b'\x89PNG\r\n\x1a\n' or len(data)>5*1024*1024:raise ValueError('invalid PNG')
 width,height=int.from_bytes(data[16:20],'big'),int.from_bytes(data[20:24],'big')
 if width!=height or width<min_size:raise ValueError('wrong icon dimensions')
 pos=8
 while pos<len(data):
  n=int.from_bytes(data[pos:pos+4],'big');end=pos+12+n
  if end>len(data) or zlib.crc32(data[pos+4:pos+8+n])&0xffffffff!=int.from_bytes(data[pos+8+n:end],'big'):raise ValueError('PNG chunk CRC')
  pos=end
 return {'width':width,'height':height,'bytes':len(data)}

def build(output,assets):
 spec=importlib.util.spec_from_file_location('remake_full_builder',ROOT/'scripts/build-plugin-v035.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 with tempfile.TemporaryDirectory() as temporary:
  private=Path(temporary)/'source.zip';mod.build(private)
  with zipfile.ZipFile(private) as z:sources={n:z.read(n) for n in z.namelist() if n not in {'.codex-plugin/plugin.json','.mcp.json'}}
 manifest=json.loads((ROOT/'distribution/openai/plugin.json').read_text());canonical=json.loads((ROOT/'plugin.json').read_text())
 if manifest['version']!=canonical['version']:raise ValueError('version drift')
 extension=manifest['extensions']['com.openai'];listing=extension['interface'];review=extension['review'];cases=review['test_cases']
 if len(listing['displayName'])>30 or len(listing['shortDescription'])>30 or len(listing['longDescription'])>4000:raise ValueError('listing length')
 if listing['category'] not in CATEGORIES:raise ValueError('unsupported category')
 if len(cases['positive'])!=5 or len(cases['negative'])!=3:raise ValueError('review case count')
 for case in cases['positive']:
  if any(not isinstance(case.get(k),str) or not case[k].strip() for k in ['description','prompt','tools_triggered','expected_behavior']):raise ValueError('invalid review case')
 for case in cases['negative']:
  if any(not isinstance(case.get(k),str) or not case[k].strip() for k in ['description','prompt']):raise ValueError('invalid negative case')
 for key in ['websiteURL','supportURL','privacyPolicyURL','termsOfServiceURL']:
  if not listing[key].startswith('https://'):raise ValueError('missing HTTPS listing URL')
 prompts=listing['defaultPrompt']
 if len(prompts)>3 or len({' '.join(p.split()) for p in prompts})!=len(prompts) or any(not p.strip() or len(p)>128 or '\n' in p for p in prompts):raise ValueError('invalid starter prompt')
 sources['plugin.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
 artwork=[]
 for target,(original,expected,min_size) in ARTWORK.items():
  data=(Path(assets)/original).read_bytes();actual=hashlib.sha256(data).hexdigest()
  if actual!=expected:raise ValueError('source-owned brand hash mismatch')
  sources['assets/'+target]=data;artwork.append({'file':'assets/'+target,'source':original,'sha256':actual,**check_png(data,min_size)})
 for field in ['logo','composerIcon']:
  if listing[field].removeprefix('./') not in sources:raise ValueError('unresolvable icon')
 for path,data in sources.items():
  if path=='.app.json':raise ValueError('private app binding')
  if path.endswith('plugin.json'):
   j=json.loads(data)
   if j.get('apps') is not None or j.get('extensions',{}).get('com.openai',{}).get('apps') is not None:raise ValueError('private app binding')
 output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as z:
  for path,data in sorted(sources.items()):
   info=zipfile.ZipInfo(path,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
 receipt={'schema':'remake.public-draft-build/1','version':manifest['version'],'file_count':len(sources),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'artwork':artwork,'case_count':{'positive':5,'negative':3},'demo_recording_url_present':bool(review.get('demo_recording_url')),'state':'PREPARED_NOT_UPLOADED','ready_for_review_submission':False,'missing':['actual intended-host demo URL','portal publisher identity, domain connection and scans','saved-version host routing tests','developer attestations'],'files':[{'path':p,'sha256':hashlib.sha256(b).hexdigest()} for p,b in sorted(sources.items())]}
 output.with_suffix('.manifest.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');return receipt

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out',required=True,type=Path);parser.add_argument('--assets',required=True,type=Path);a=parser.parse_args();r=build(a.out,a.assets);print(json.dumps({k:v for k,v in r.items() if k!='files'},ensure_ascii=False))
