#!/usr/bin/env python3
"""Rehearse actual MCP backends for five prepared reviewer cases.

Uses synthetic text fixtures. It does not test model tool routing, negative
prompt abstention, installed-host media, professional quality or approval.
"""
import argparse
import datetime
import json
from pathlib import Path
import subprocess


def rehearse(output):
 traces=[]
 def call(case,name,args):
  request={'jsonrpc':'2.0','id':len(traces)+1,'method':'tools/call','params':{'name':name,'arguments':args}}
  process=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','20','--header','content-type: application/json','--data-binary','@-','https://remake.objekts.ai/mcp'],input=json.dumps(request).encode(),capture_output=True,check=True)
  response=json.loads(process.stdout);traces.append({'case':case,'request':request,'response':response})
  result=response['result'];assert result.get('isError') is False,(name,result)
  return result['structuredContent']
 outcomes=[]
 p=call('positive1','remake_project_create',{'project_id':'review-0351-idea','title':'Last Light','author_intent':'A caretaker switches off an empty theatre; no source attachments.'})
 assert p['persisted'] is False and p['project']['revision']==1 and not p['project']['materials'];outcomes.append({'id':'positive1','backend':'PASS'})
 materials=[{'id':'S1','kind':'script','description':'User-described caretaker story'},{'id':'I1','kind':'image','description':'User description of empty theatre; no pixels attached','observed':False},{'id':'A1','kind':'audio','description':'User description of electric hum; no audio attached','observed':False}]
 inv=call('positive2','inventory_creative_materials',{'materials':materials});assert inv['material_ids']==['S1','I1','A1'] and inv['unseen_media']==['I1','A1'];outcomes.append({'id':'positive2','backend':'PASS'})
 locks=[{'key':'CAMERA','value':'static'}]
 checked=call('positive3','check_explicit_project_locks',{'locks':locks,'proposed_changes':[{'key':'CAMERA','new_value':'dolly'}]});assert checked['allow_edit'] is False and len(checked['conflicts'])==1;outcomes.append({'id':'positive3','backend':'PASS'})
 packet=call('positive4','compile_portable_director_packet',{'title':'Last Light','intent':'Silent empty theatre; caretaker switches off a light. Shot is proposed.','materials':[{'id':'IDEA1','kind':'idea','description':'Creator-supplied text brief'}],'shots':[{'id':'SHOT1','action':'PROPOSED: caretaker switches off one light','source_ids':['IDEA1'],'camera':'static','sound':'PROPOSED silence'}],'locks':locks})
 assert packet['approvals']=='UNVERIFIED' and packet['studio_handoff']=='NOT_REQUESTED' and packet['sent'] is False;outcomes.append({'id':'positive4','backend':'PASS'})
 p=call('positive5','remake_project_create',{'project_id':'review-0351-revision','title':'Last Light'})['project']
 for event_id,kind,payload in [('shot1','shot_add',{'id':'S1','status':'PROPOSED','source_ids':[],'fields':{'camera':'static'},'visible_action':'PROPOSED: switch off light','entry':'PROPOSED: empty theatre','exit':'PROPOSED: darkness','cut':'PROPOSED: after gesture','sound':'PROPOSED silence'}),('camera1','shot_field_set',{'shot_id':'S1','field':'camera','value':'static wide'})]:
  p=call('positive5','remake_project_apply_delta',{'project':p,'event':{'event_id':event_id,'expected_revision':p['revision'],'kind':kind,'payload':payload,'actor_claim':'MODEL'}})['project']
 valid=call('positive5','remake_project_validate',{'project':p});assert valid['ok'] and p['revision']==3 and p['shots'][0]['status']=='PROPOSED' and p['shots'][0]['fields']['camera']=='static wide';outcomes.append({'id':'positive5','backend':'PASS'})
 result={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'test_class':'SYNTHETIC_TEXT_FIXTURES_OVER_REAL_PUBLIC_HTTP','positive_backend_cases':outcomes,'tool_calls':len(traces),'saved_openai_host_routing':'NOT_RUN','negative_prompt_abstention':'NOT_RUN','intended_host_demo_recording':'NOT_RECORDED','independent_professional_quality':'NOT_TESTED','private_source_media_transmitted':False,'traces':traces}
 output=Path(output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');return {k:v for k,v in result.items() if k!='traces'}

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out',type=Path,required=True);print(json.dumps(rehearse(parser.parse_args().out),ensure_ascii=False))
