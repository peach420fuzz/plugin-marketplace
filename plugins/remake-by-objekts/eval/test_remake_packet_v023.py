"""REMAKE v0.23 canonical packet regression contract. Synthetic deterministic tests only."""
import copy
import json
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'skills/creative-companion/scripts'))
from remake_packet_v023 import create,validate,migrate,SCHEMA

class PacketTests(unittest.TestCase):
  def setUp(self):
    self.p=create('TEST-01','Draft','Meaningful viewer choice')
    self.p['materials']=[{'id':'A','kind':'image','provenance':'USER_PROVIDED','evidence':'UNKNOWN','host_inspected':False,'description':'not seen'}]
    self.p['locks']={'camera':'static','product':'unchanged'}
    self.p['shots']=[{'id':'S01','status':'PROPOSED','source_ids':['A'],'fields':{'camera':'static','product':'unchanged'},'entry':'hand on desk','visible_action':'hand opens drawer','exit':'drawer open','cut':'on the pull','sound':'room tone'}]
  def issues(self,obj):return [x['code'] for x in validate(obj)['errors']]
  def err(self,modify,code):
    p=copy.deepcopy(self.p);modify(p);self.assertIn(code,self.issues(p))
  def test_clean(self):self.assertTrue(validate(self.p)['ok'])
  def test_schema_version(self):self.assertEqual(self.p['schema_version'],SCHEMA)
  def test_empty_materials(self):p=copy.deepcopy(self.p);p['materials']=[];p['shots']=[];self.assertTrue(validate(p)['ok'])
  def test_two_images(self):self._many(2)
  def test_seven_images(self):self._many(7)
  def test_hundred_images(self):self._many(100)
  def test_150_images(self):self._many(150)
  def _many(self,n):
    p=create('COUNT',author_intent='Reference study');p['materials']=[{'id':f'F{i}','kind':'image','provenance':'USER_PROVIDED','evidence':'UNKNOWN','host_inspected':False} for i in range(n)];self.assertTrue(validate(p)['ok'])
  def test_unseen_observed(self):self.err(lambda p:p['materials'][0].update(evidence='OBSERVED'),'UNINSPECTED_OBSERVATION')
  def test_real_inspected_selfreport(self):p=copy.deepcopy(self.p);p['materials'][0].update(evidence='OBSERVED',host_inspected=True);self.assertTrue(validate(p)['ok'])
  def test_proposed_inspected(self):self.err(lambda p:p['materials'][0].update(provenance='MODEL_PROPOSED',host_inspected=True),'PROPOSED_ASSET_INSPECTED')
  def test_idea_observed(self):self.err(lambda p:p['materials'][0].update(kind='idea',evidence='OBSERVED',host_inspected=True),'UNSUPPORTED_OBSERVATION')
  def test_duplicate_asset(self):self.err(lambda p:p['materials'].append(copy.deepcopy(p['materials'][0])),'DUPLICATE_MATERIAL')
  def test_duplicate_shot(self):self.err(lambda p:p['shots'].append(copy.deepcopy(p['shots'][0])),'DUPLICATE_SHOT')
  def test_bad_rev_zero(self):self.err(lambda p:p.update(revision=0),'INVALID_REVISION')
  def test_bad_rev_bool(self):self.err(lambda p:p.update(revision=True),'INVALID_REVISION')
  def test_bad_rev_text(self):self.err(lambda p:p.update(revision='r3'),'INVALID_REVISION')
  def test_missing_schema(self):self.err(lambda p:p.pop('schema_version'),'SCHEMA_MISMATCH')
  def test_unknown_material_ref(self):self.err(lambda p:p['shots'][0].update(source_ids=['X']),'UNRESOLVED_SOURCE')
  def test_lock_conflict(self):self.err(lambda p:p['shots'][0]['fields'].update(camera='crane'),'LOCK_CONFLICT')
  def test_keep_lock(self):self.assertTrue(validate(self.p)['ok'])
  def test_approved_shot_without_receipt(self):self.err(lambda p:p['shots'][0].update(status='USER_APPROVED'),'SHOT_APPROVAL_REFERENCE_REQUIRED')
  def test_approved_shot_with_receipt_claim(self):p=copy.deepcopy(self.p);p['shots'][0].update(status='USER_APPROVED',approval_ref='user-confirmation-turn-7');self.assertTrue(validate(p)['ok'])
  def test_missing_decision_receipt(self):self.err(lambda p:p['decisions'].append({'id':'D1','status':'USER_APPROVED','source_ids':[],'value':'x'}),'DECISION_APPROVAL_REFERENCE_REQUIRED')
  def test_rejected_marked_approved(self):self.err(lambda p:p['decisions'].append({'id':'D1','status':'REJECTED','source_ids':[],'approved':True}),'REJECTED_MARKED_APPROVED')
  def test_unknown_decision_source(self):self.err(lambda p:p['decisions'].append({'id':'D1','status':'PROPOSED','source_ids':['X']}),'UNRESOLVED_SOURCE')
  def test_malformed_decision_sources_report_error(self):
    # Import boundaries must reject wrong JSON types even when their keys/characters match real IDs.
    for value in (None,17,True,'A',{'A':True}):
      with self.subTest(source_ids=value):
        p=copy.deepcopy(self.p)
        p['decisions']=[{'id':'D1','status':'PROPOSED','source_ids':value}]
        before=copy.deepcopy(p)
        result=validate(p)
        self.assertFalse(result['ok'])
        self.assertIn({'code':'INVALID_SOURCE_IDS','path':'decisions[0].source_ids','detail':''},result['errors'])
        self.assertEqual(p,before)
  def test_delta_rejects_malformed_import_without_mutation(self):
    from remake_packet_v023 import apply_delta
    p=copy.deepcopy(self.p)
    p['decisions']=[{'id':'D1','status':'PROPOSED','source_ids':None}]
    before=copy.deepcopy(p)
    with self.assertRaisesRegex(ValueError,'invalid canonical packet'):
      apply_delta(p,{'event_id':'e1','expected_revision':1,'kind':'shot_add','payload':{}})
    self.assertEqual(p,before)
  def test_handoff_not_sent(self):self.assertEqual(self.p['handoff']['status'],'NOT_SENT')
  def test_handoff_forged_sent(self):self.err(lambda p:p['handoff'].update(status='SENT_VERIFIED'),'UNVERIFIED_DELIVERY')
  def test_handoff_unsolicited_recipient(self):self.err(lambda p:p['handoff'].update(recipient='a@example.com'),'CONTACT_WITHOUT_CONSENT')
  def test_handoff_receipt_without_send(self):self.err(lambda p:p['handoff'].update(delivery_receipt='fake'),'RECEIPT_WITHOUT_SEND')
  def test_handoff_source_without_consent(self):self.err(lambda p:p['handoff'].update(selected_material_ids=['A']),'HANDOFF_SCOPE_WITHOUT_CONSENT')
  def test_handoff_unknown_source(self):self.err(lambda p:p['handoff'].update(selected_material_ids=['X']),'UNRESOLVED_HANDOFF_SOURCE')
  def test_structure_not_requiring_script(self):self.assertNotIn('script',self.p)
  def test_stillness_warning_not_failure(self):p=copy.deepcopy(self.p);p['shots'][0]['visible_action']='';r=validate(p);self.assertTrue(r['ok']);self.assertTrue(any(x['code']=='NO_VISIBLE_ACTION' for x in r['warnings']))
  def test_legacy_guard_migration(self):
    old={'project_id':'X','revision':'r3','author_intent':'A','assets':[{'id':'i','kind':'image','observation_status':'OBSERVED','pixels_inspected':True}], 'locks':{'camera':'static'},'shots':[{'id':'S','camera':'static','status':'USER_APPROVED','source_asset_ids':['i'],'visible_action':'still'}],'handoff':{'status':'SENT','recipient':'private@example.com','consent':True}}
    q=migrate(old);r=validate(q);self.assertTrue(r['ok'],r);self.assertEqual(q['revision'],1);self.assertEqual(q['shots'][0]['status'],'PROPOSED');self.assertEqual(q['handoff']['status'],'NOT_SENT');self.assertEqual(q['materials'][0]['evidence'],'UNKNOWN');self.assertTrue(q['migration']['warnings'])
  def test_legacy_v016_migration(self):
    old={'schema_version':'cc.production-packet/0.16','project_id':'old','revision':2,'title':'X','author_intent':'Y','materials':[{'asset_id':'a','kind':'video','observed':True,'provenance':'user_provided'}],'shots':[{'shot_id':'S1','entry':'a','action':'jump','cut':'match','sound':'x'}], 'handoff':{'status':'SENT_VERIFIED','receipt':'fake'}}
    q=migrate(old);self.assertTrue(validate(q)['ok']);self.assertEqual(q['materials'][0]['evidence'],'UNKNOWN');self.assertEqual(q['handoff']['status'],'NOT_SENT');self.assertEqual(q['shots'][0]['visible_action'],'jump')
  def test_no_unknown_legacy_schema(self):
    with self.assertRaises(ValueError):migrate({'schema_version':'other.v9'})
  def test_migration_idempotent(self):self.assertEqual(migrate(self.p),self.p)
  def test_json_roundtrip(self):self.assertTrue(validate(json.loads(json.dumps(self.p)))['ok'])
  def test_bad_arrays(self):self.err(lambda p:p.update(materials='bad'),'INVALID_ARRAY')
  def test_bad_shot_fields(self):self.err(lambda p:p['shots'][0].update(fields=[]),'INVALID_SHOT_FIELDS')

if __name__=='__main__':unittest.main()
