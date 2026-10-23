#!/usr/bin/env python3
"""REMAKE by objekts 0.23: canonical, dependency-free project/shot packet guard.

This is NOT a media parser, a consent validator, an identity system, an LLM,
proof of human creative judgment, or a delivery receipt. It validates only
self-reported fields and deterministic cross-references.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path

SCHEMA = 'remake.project/0.23'
KINDS = {'idea','image','video','audio','video_frame','script','text','storyboard','document','other'}
EVIDENCE = {'OBSERVED','USER_STATED','MODEL_HYPOTHESIS','UNKNOWN'}
PROVENANCE = {'USER_PROVIDED','USER_DESCRIBED','EXTERNAL_VERIFIED','MODEL_PROPOSED','UNKNOWN'}
STATUSES = {'PROPOSED','USER_APPROVED','LOCKED','REJECTED','SUPERSEDED'}
HANDOFF = {'NOT_SENT','SENT_VERIFIED'}


def create(project_id: str, title: str = '', author_intent: str = '') -> dict:
    if not isinstance(project_id,str) or not project_id.strip():
        raise ValueError('project_id must be a nonempty string')
    return {'schema_version':SCHEMA,'project_id':project_id,'revision':1,
            'title':title,'author_intent':author_intent,'materials':[],
            'locks':{},'decisions':[],'shots':[],
            'handoff':{'status':'NOT_SENT','consent':False,'recipient':None,
                       'delivery_receipt':None,'selected_material_ids':[]},
            'migration':{'from':None,'warnings':[]},'journal':[]}


def validate(packet: object) -> dict:
    errors=[]; warnings=[]
    def is_one(value, allowed):return isinstance(value,str) and value in allowed
    def source_known(value, known):return isinstance(value,str) and value in known
    def add(code,path,detail='',warn=False):
        (warnings if warn else errors).append({'code':code,'path':path,'detail':detail})
    if not isinstance(packet,dict):
        add('INVALID_ROOT','$'); return {'ok':False,'errors':errors,'warnings':warnings}
    if packet.get('schema_version')!=SCHEMA: add('SCHEMA_MISMATCH','schema_version')
    if not isinstance(packet.get('project_id'),str) or not packet['project_id'].strip():add('PROJECT_ID_REQUIRED','project_id')
    if type(packet.get('revision')) is not int or packet.get('revision',0)<1:add('INVALID_REVISION','revision')
    for k in ('title','author_intent'):
        if not isinstance(packet.get(k),str):add('INVALID_TEXT',k)
    for k in ('materials','shots','decisions'):
        if not isinstance(packet.get(k),list):add('INVALID_ARRAY',k)
    mats=packet.get('materials') if isinstance(packet.get('materials'),list) else []
    material_ids=set()
    for i,m in enumerate(mats):
        path=f'materials[{i}]'
        if not isinstance(m,dict):add('INVALID_MATERIAL',path);continue
        mid=m.get('id')
        if not isinstance(mid,str) or not mid.strip(): add('MATERIAL_ID_REQUIRED',path+'.id')
        elif mid in material_ids:add('DUPLICATE_MATERIAL',path+'.id',mid)
        else:material_ids.add(mid)
        if not is_one(m.get('kind'),KINDS):add('INVALID_MATERIAL_KIND',path+'.kind')
        if not is_one(m.get('provenance'),PROVENANCE):add('INVALID_PROVENANCE',path+'.provenance')
        if not is_one(m.get('evidence'),EVIDENCE):add('INVALID_EVIDENCE',path+'.evidence')
        if type(m.get('host_inspected')) is not bool:add('INVALID_INSPECTION_FLAG',path+'.host_inspected')
        if m.get('evidence')=='OBSERVED' and m.get('host_inspected') is not True:
            add('UNINSPECTED_OBSERVATION',path+'.evidence')
        if m.get('evidence')=='OBSERVED' and not is_one(m.get('kind'),{'image','video','video_frame','audio','document','text','script','storyboard'}):
            add('UNSUPPORTED_OBSERVATION',path+'.kind')
        if m.get('host_inspected') is True and m.get('provenance')=='MODEL_PROPOSED':
            add('PROPOSED_ASSET_INSPECTED',path+'.host_inspected')
    locks=packet.get('locks')
    if not isinstance(locks,dict):add('INVALID_LOCKS','locks');locks={}
    else:
        for k,v in locks.items():
            if not isinstance(k,str) or not k.strip() or not isinstance(v,str) or not v.strip():add('INVALID_LOCK',f'locks.{k}')
    decisions=packet.get('decisions') if isinstance(packet.get('decisions'),list) else []
    decision_ids=set()
    for i,d in enumerate(decisions):
        p=f'decisions[{i}]'
        if not isinstance(d,dict):add('INVALID_DECISION',p);continue
        x=d.get('id')
        if not isinstance(x,str) or not x.strip():add('DECISION_ID_REQUIRED',p+'.id')
        elif x in decision_ids:add('DUPLICATE_DECISION',p+'.id')
        else:decision_ids.add(x)
        if not is_one(d.get('status'),STATUSES):add('INVALID_DECISION_STATUS',p+'.status')
        if is_one(d.get('status'),{'USER_APPROVED','LOCKED'}) and not d.get('approval_ref'):
            add('DECISION_APPROVAL_REFERENCE_REQUIRED',p+'.approval_ref')
        refs=d.get('source_ids',[])
        if not isinstance(refs,list):add('INVALID_SOURCE_IDS',p+'.source_ids');refs=[]
        for source in refs:
            if not source_known(source,material_ids):add('UNRESOLVED_SOURCE',p+'.source_ids',str(source))
        if d.get('status')=='REJECTED' and d.get('approved') is True:
            add('REJECTED_MARKED_APPROVED',p)
    shots=packet.get('shots') if isinstance(packet.get('shots'),list) else []
    shot_ids=set()
    for i,s in enumerate(shots):
        p=f'shots[{i}]'
        if not isinstance(s,dict):add('INVALID_SHOT',p);continue
        x=s.get('id')
        if not isinstance(x,str) or not x.strip():add('SHOT_ID_REQUIRED',p+'.id')
        elif x in shot_ids:add('DUPLICATE_SHOT',p+'.id')
        else:shot_ids.add(x)
        if not is_one(s.get('status'),STATUSES):add('INVALID_SHOT_STATUS',p+'.status')
        if is_one(s.get('status'),{'USER_APPROVED','LOCKED'}) and not s.get('approval_ref'):
            add('SHOT_APPROVAL_REFERENCE_REQUIRED',p+'.approval_ref')
        refs=s.get('source_ids',[])
        if not isinstance(refs,list):add('INVALID_SOURCE_IDS',p+'.source_ids');refs=[]
        for source in refs:
            if not source_known(source,material_ids):add('UNRESOLVED_SOURCE',p+'.source_ids',str(source))
        fields=s.get('fields',{})
        if not isinstance(fields,dict):add('INVALID_SHOT_FIELDS',p+'.fields');fields={}
        for key,value in fields.items():
            if not isinstance(key,str) or not isinstance(value,str):add('INVALID_SHOT_FIELD',p+'.fields')
            elif key in locks and value!=locks[key]:add('LOCK_CONFLICT',p+'.fields.'+key,f'expected project LOCK: {locks[key]}')
        if not s.get('visible_action'):
            add('NO_VISIBLE_ACTION',p+'.visible_action','May be valid deliberate stillness',True)
        for key in ('entry','exit','cut','sound'):
            if not s.get(key):add('SHOT_FIELD_UNSPECIFIED',p+'.'+key,'Incomplete filmable packet',True)
    handoff=packet.get('handoff')
    if not isinstance(handoff,dict):add('INVALID_HANDOFF','handoff');handoff={}
    if not is_one(handoff.get('status'),HANDOFF):add('INVALID_HANDOFF_STATUS','handoff.status')
    if type(handoff.get('consent')) is not bool:add('INVALID_CONSENT','handoff.consent')
    if handoff.get('status')=='SENT_VERIFIED':
        if handoff.get('consent') is not True or not handoff.get('delivery_receipt') or not handoff.get('recipient'):
            add('UNVERIFIED_DELIVERY','handoff','Need consent, recipient and actual receipt')
    else:
        if handoff.get('delivery_receipt'):add('RECEIPT_WITHOUT_SEND','handoff.delivery_receipt')
        if handoff.get('recipient') and handoff.get('consent') is not True:add('CONTACT_WITHOUT_CONSENT','handoff.recipient')
    selected=handoff.get('selected_material_ids',[])
    if not isinstance(selected,list):add('INVALID_SELECTED_MATERIALS','handoff.selected_material_ids');selected=[]
    for source in selected:
        if not source_known(source,material_ids):add('UNRESOLVED_HANDOFF_SOURCE','handoff.selected_material_ids',str(source))
    if selected and handoff.get('consent') is not True:
        add('HANDOFF_SCOPE_WITHOUT_CONSENT','handoff.selected_material_ids')
    if not isinstance(packet.get('journal',[]),list):add('INVALID_JOURNAL','journal')
    return {'ok':not errors,'errors':errors,'warnings':warnings,
            'scope':'Static field consistency only; not real perception, identity verification, approval or submission.'}


def migrate(packet: dict) -> dict:
    """Explicit, conservative migration. No synthetic user approval or inspection evidence."""
    if not isinstance(packet,dict):raise ValueError('legacy packet must be an object')
    if packet.get('schema_version')==SCHEMA:return copy.deepcopy(packet)
    tag=packet.get('schema_version') or ('legacy.guard/0.20' if 'assets' in packet else None)
    if tag not in {'cc.production-packet/0.16','legacy.guard/0.20'}:
        raise ValueError('unsupported legacy packet schema; manual review required')
    output=create(packet.get('project_id') or 'IMPORTED_UNVERIFIED',packet.get('title','') or '',packet.get('author_intent','') or '')
    warns=output['migration']['warnings'];output['migration']['from']=tag
    revision=packet.get('revision')
    if type(revision) is int and revision>=1:output['revision']=revision
    else:
        warns.append('Original revision not a positive integer; original preserved as legacy_revision, new revision 1 requires user confirmation.')
        output['migration']['legacy_revision']=str(revision)
    oldm=packet.get('materials',[]) if tag.startswith('cc.') else packet.get('assets',[])
    for i,m in enumerate(oldm):
        if not isinstance(m,dict): warns.append(f'materials[{i}] invalid and ignored');continue
        aid=m.get('asset_id') if tag.startswith('cc.') else m.get('id')
        if not aid:warns.append(f'materials[{i}] has no ID; skipped');continue
        kind=m.get('kind','other');kind=kind if kind in KINDS else 'other'
        provenance='USER_PROVIDED' if m.get('provenance')=='user_provided' else ('USER_DESCRIBED' if m.get('provenance') in {'described_only',None} else 'UNKNOWN')
        raw_observed=m.get('observed') is True or m.get('observation_status')=='OBSERVED'
        # Legacy inspection flag is not an auditable media-perception receipt. Never certify it after migration.
        if raw_observed:warns.append(f'{aid}: old observed/inspected claim downgraded to UNKNOWN pending re-inspection in actual AI host')
        output['materials'].append({'id':aid,'kind':kind,'provenance':provenance,'host_inspected':False,'evidence':('UNKNOWN' if raw_observed else ('USER_STATED' if provenance=='USER_DESCRIBED' else 'UNKNOWN')),'description':m.get('description') or m.get('role') or ''})
    rawlocks=packet.get('locks',{})
    if isinstance(rawlocks,dict):output['locks']={str(k):str(v) for k,v in rawlocks.items() if v is not None}
    else:warns.append('Legacy locks not a dictionary; manual migration required')
    for i,d in enumerate(packet.get('decisions',[])):
        if not isinstance(d,dict):continue
        status={'author_approved':'USER_APPROVED','locked':'LOCKED','rejected':'REJECTED','superseded':'SUPERSEDED'}.get(d.get('status'),'PROPOSED')
        if status in {'USER_APPROVED','LOCKED'} and not d.get('approval_ref'):
            warns.append(f'decision[{i}] approval unverified; downgraded to PROPOSED')
            status='PROPOSED'
        output['decisions'].append({'id':d.get('id') or f'D{i+1:03}','topic':d.get('topic',''), 'value':d.get('value',''),'status':status,'approval_ref':d.get('approval_ref') or None,'source_ids':[]})
    for i,shot in enumerate(packet.get('shots',[])):
        if not isinstance(shot,dict):continue
        id_=shot.get('shot_id') or shot.get('id') or f'S{i+1:03}'
        status=shot.get('status','PROPOSED')
        if status not in STATUSES:status='PROPOSED'
        if status in {'USER_APPROVED','LOCKED'} and not shot.get('user_approval_ref'):
            warns.append(f'{id_} approval unverified; downgraded to PROPOSED')
            status='PROPOSED'
        fields={}
        for f in ('camera','product','character','wardrobe','location','lighting','framing'):
            if f in shot:fields[f]=str(shot[f])
        src=shot.get('source_asset_ids',shot.get('source_ids',[]));src=src if isinstance(src,list) else []
        output['shots'].append({'id':id_,'status':status,'approval_ref':shot.get('user_approval_ref') or None,
            'source_ids':src,'fields':fields,'entry':shot.get('entry',''),'visible_action':shot.get('visible_action',shot.get('action','')),
            'exit':shot.get('exit',''),'cut':shot.get('cut',''),'sound':shot.get('sound','')})
    oldh=packet.get('handoff') or {}
    if oldh.get('status') in {'SENT','SENT_VERIFIED'}:
        warns.append('Legacy outbound delivery flag intentionally reset: requires independent actual delivery receipt and user reconsent.')
    if oldh.get('recipient') or oldh.get('contact'):
        warns.append('Legacy recipient/contact intentionally cleared until user reconfirms exact transfer scope.')
    return output



class RevisionConflict(ValueError):
    """Optimistic-lock conflict; refresh current project state before retrying."""


def apply_delta(packet: dict, event: dict) -> dict:
    """Apply one explicit operation to an exported packet, never mutating input.

    This validates structure and claimed provenance, NOT an authenticated identity.
    Host MUST independently verify author actions; approval_ref alone is just text.
    No network, storage, mail, LLM, or model-side execution occurs here.
    """
    if not isinstance(packet,dict) or not validate(packet)['ok']:
        raise ValueError('invalid canonical packet; repair/migrate and validate first')
    if not isinstance(event,dict):raise ValueError('event must be an object')
    event_id=event.get('event_id')
    if not isinstance(event_id,str) or not event_id.strip():raise ValueError('event_id required')
    history=packet.get('journal',[])
    if not isinstance(history,list):raise ValueError('invalid journal')
    try:
        event_digest=hashlib.sha256(json.dumps(event,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode('utf-8')).hexdigest()
    except (TypeError,ValueError) as exc:
        raise ValueError('event must be finite JSON data') from exc
    previous=next((h for h in history if isinstance(h,dict) and h.get('event_id')==event_id),None)
    if previous is not None:
        if previous.get('event_digest')==event_digest:
            return copy.deepcopy(packet)  # exact duplicate command, no double mutation
        raise ValueError('event_id replayed with different command')
    if type(event.get('expected_revision')) is not int or event['expected_revision']!=packet['revision']:
        raise RevisionConflict('expected_revision mismatch; no mutation')
    kind=event.get('kind')
    if not isinstance(kind,str) or kind not in {'material_add','shot_add','shot_field_set','lock_set','lock_remove','decision_propose','decision_approve','decision_reject'}:
        raise ValueError('unsupported event kind')
    payload=event.get('payload')
    if not isinstance(payload,dict):raise ValueError('payload must be an object')
    out=copy.deepcopy(packet)
    def by_id(records,id_):
        return next((item for item in records if isinstance(item,dict) and item.get('id')==id_),None)
    def author_claim():
        if event.get('actor_claim')!='USER' or not isinstance(event.get('approval_ref'),str) or not event['approval_ref'].strip():
            raise ValueError('claimed user action and host-supplied approval_ref required; NOT proof of identity')
    if kind=='material_add':
        if not isinstance(payload.get('id'),str) or by_id(out['materials'],payload.get('id')):raise ValueError('missing or duplicate material ID')
        out['materials'].append(payload)
    elif kind=='shot_add':
        if not isinstance(payload.get('id'),str) or by_id(out['shots'],payload.get('id')):raise ValueError('missing or duplicate shot ID')
        out['shots'].append(payload)
    elif kind=='shot_field_set':
        shot=by_id(out['shots'],payload.get('shot_id'))
        field=payload.get('field');value=payload.get('value')
        if shot is None or not isinstance(field,str) or not field.strip() or not isinstance(value,str):raise ValueError('shot / field / value invalid')
        if shot.get('status') in {'USER_APPROVED','LOCKED'}:raise ValueError('approved shot immutable; separate explicit author revision required')
        if field in out['locks'] and value!=out['locks'][field]:raise ValueError('project LOCK conflict')
        shot.setdefault('fields',{})[field]=value
    elif kind=='lock_set':
        author_claim()
        field=payload.get('field');value=payload.get('value')
        if not isinstance(field,str) or not field.strip() or not isinstance(value,str) or not value.strip():raise ValueError('lock field and value required')
        if field in out['locks'] and out['locks'][field]!=value:raise ValueError('cannot replace LOCK; author must remove it explicitly first')
        for shot in out['shots']:
            if field in shot.get('fields',{}) and shot['fields'][field]!=value:raise ValueError('existing shot contradicts proposed new lock')
        out['locks'][field]=value
    elif kind=='lock_remove':
        author_claim()
        field=payload.get('field')
        if field not in out['locks']:raise ValueError('cannot remove nonexistent lock')
        out['locks'].pop(field)
    elif kind=='decision_propose':
        proposed=copy.deepcopy(payload)
        if not isinstance(proposed.get('id'),str) or by_id(out['decisions'],proposed.get('id')):raise ValueError('missing/duplicate decision id')
        if proposed.get('status')!='PROPOSED':raise ValueError('model proposals cannot self-approve')
        if any(d.get('status')=='REJECTED' and d.get('topic')==proposed.get('topic') and d.get('value')==proposed.get('value') for d in out['decisions']):
            raise ValueError('exact author-rejected proposal cannot be silently repeated')
        out['decisions'].append(proposed)
    elif kind in {'decision_approve','decision_reject'}:
        author_claim()
        d=by_id(out['decisions'],payload.get('id'))
        if d is None:raise ValueError('unknown decision')
        if d.get('status')!='PROPOSED':raise ValueError('decision no longer proposed')
        d['status']='USER_APPROVED' if kind=='decision_approve' else 'REJECTED'
        if kind=='decision_approve':d['approval_ref']=event['approval_ref']
        else:d['rejection_ref']=event['approval_ref']
    out['revision']+=1
    out['journal'].append({'event_id':event_id,'kind':kind,'revision':out['revision'],
        'actor_claim':event.get('actor_claim','MODEL'),
        'approval_ref':event.get('approval_ref') if kind in {'lock_set','lock_remove','decision_approve','decision_reject'} else None,
        'event_digest':event_digest})
    result=validate(out)
    if not result['ok']:
        raise ValueError('operation violates project schema: '+','.join(x['code'] for x in result['errors']))
    return out

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation',choices=('validate','migrate'))
    parser.add_argument('packet',type=Path)
    parser.add_argument('--output',type=Path,default=None)
    args=parser.parse_args()
    try:
        data=json.loads(args.packet.read_text(encoding='utf-8'))
        result=migrate(data) if args.operation=='migrate' else validate(data)
    except (OSError,ValueError,UnicodeError,json.JSONDecodeError) as exc:
        print(json.dumps({'error':type(exc).__name__,'message':str(exc)},ensure_ascii=False),file=sys.stderr)
        return 2
    text=json.dumps(result,indent=2,ensure_ascii=False)
    if args.output:args.output.write_text(text+'\n',encoding='utf-8')
    else: print(text)
    return 0 if args.operation=='migrate' or result['ok'] else 1

if __name__=='__main__':sys.exit(main())
