"""REMAKE pure state-machine regression tests (no host identity or storage)."""
import sys,copy,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'skills/creative-companion/scripts'))
from remake_packet_v023 import create,apply_delta,validate,RevisionConflict

class Tests(unittest.TestCase):
 def setUp(self):
  self.p=create('PROJECT','Untitled','Make a film')
 def ev(self,kind,payload,**kw):
  return dict(kind=kind,payload=payload,expected_revision=self.p['revision'],event_id='E-'+str(self.p['revision']),**kw)
 def do(self,kind,payload,**kw):
  self.p=apply_delta(self.p,self.ev(kind,payload,**kw));return self.p
 def test_create_clean(self):self.assertTrue(validate(self.p)['ok'])
 def test_add_material(self):self.do('material_add',{'id':'A','kind':'idea','provenance':'USER_DESCRIBED','evidence':'USER_STATED','host_inspected':False});self.assertEqual(self.p['revision'],2)
 def test_event_idempotent(self):e=self.ev('material_add',{'id':'A','kind':'idea','provenance':'USER_DESCRIBED','evidence':'USER_STATED','host_inspected':False});first=apply_delta(self.p,e);self.assertEqual(first,apply_delta(first,e))
 def test_replay_changed_payload_rejected(self):
  e=self.ev('material_add',{'id':'A','kind':'idea','provenance':'USER_DESCRIBED','evidence':'USER_STATED','host_inspected':False})
  first=apply_delta(self.p,e)
  e['payload']['id']='B'
  self.assertRaises(ValueError,apply_delta,first,e)
 def test_bad_event_kind_type(self):
  e=self.ev('material_add',{})
  e['kind']=[]
  self.assertRaises(ValueError,apply_delta,self.p,e)
 def test_conflict(self):e=self.ev('material_add',{'id':'A','kind':'idea','provenance':'USER_DESCRIBED','evidence':'USER_STATED','host_inspected':False});e['expected_revision']=999;self.assertRaises(RevisionConflict,apply_delta,self.p,e)
 def test_no_mutation_on_failure(self):p=copy.deepcopy(self.p);e=self.ev('lock_set',{'field':'camera','value':'static'});self.assertRaises(ValueError,apply_delta,self.p,e);self.assertEqual(self.p,p)
 def test_lock_requires_author(self):self.assertRaises(ValueError,self.do,'lock_set',{'field':'camera','value':'static'})
 def test_lock_verified_claim(self):self.do('lock_set',{'field':'camera','value':'static'},actor_claim='USER',approval_ref='user-message-17');self.assertEqual(self.p['locks']['camera'],'static')
 def test_lock_cannot_be_silently_replaced(self):
  self.do('lock_set',{'field':'camera','value':'static'},actor_claim='USER',approval_ref='user-message-17')
  self.assertRaises(ValueError,self.do,'lock_set',{'field':'camera','value':'moving'},actor_claim='USER',approval_ref='user-message-20')
 def test_explicit_unlock(self):
  self.do('lock_set',{'field':'camera','value':'static'},actor_claim='USER',approval_ref='u1')
  self.do('lock_remove',{'field':'camera'},actor_claim='USER',approval_ref='u2')
  self.assertNotIn('camera',self.p['locks'])
 def test_direct_shot_lock(self):
  self.do('lock_set',{'field':'camera','value':'static'},actor_claim='USER',approval_ref='u1')
  self.assertRaises(ValueError,self.do,'shot_add',{'id':'S1','status':'PROPOSED','fields':{'camera':'moving'},'source_ids':[]})
 def test_reject_unauthorized_shot_change(self):
  self.do('shot_add',{'id':'S1','status':'USER_APPROVED','approval_ref':'u1','fields':{},'source_ids':[]})
  self.assertRaises(ValueError,self.do,'shot_field_set',{'shot_id':'S1','field':'camera','value':'moving'})
 def test_preserve_camera_lock_during_revision(self):
  self.do('lock_set',{'field':'camera','value':'static'},actor_claim='USER',approval_ref='u1')
  self.do('shot_add',{'id':'S1','status':'PROPOSED','fields':{'camera':'static'},'source_ids':[]})
  self.do('shot_field_set',{'shot_id':'S1','field':'camera','value':'static'})
  self.assertRaises(ValueError,self.do,'shot_field_set',{'shot_id':'S1','field':'camera','value':'crane'})
 def test_model_cannot_approve(self):self.assertRaises(ValueError,self.do,'decision_propose',{'id':'D1','status':'USER_APPROVED','topic':'style','value':'night','source_ids':[]})
 def test_approve_requires_user(self):
  self.do('decision_propose',{'id':'D1','status':'PROPOSED','topic':'style','value':'night','source_ids':[]})
  self.assertRaises(ValueError,self.do,'decision_approve',{'id':'D1'})
 def test_approve_claimed_user(self):
  self.do('decision_propose',{'id':'D1','status':'PROPOSED','topic':'style','value':'night','source_ids':[]})
  self.do('decision_approve',{'id':'D1'},actor_claim='USER',approval_ref='user-msg-45')
  self.assertEqual(self.p['decisions'][0]['status'],'USER_APPROVED')
 def test_rejected_cannot_repropose_exact(self):
  d={'id':'D1','status':'PROPOSED','topic':'style','value':'night','source_ids':[]}
  self.do('decision_propose',d)
  self.do('decision_reject',{'id':'D1'},actor_claim='USER',approval_ref='no-night')
  self.assertRaises(ValueError,self.do,'decision_propose',dict(d,id='D2'))
 def test_history_stable(self):
  self.do('lock_set',{'field':'camera','value':'static'},actor_claim='USER',approval_ref='ref')
  self.assertEqual(self.p['journal'][0]['revision'],2)
  self.assertTrue(validate(self.p)['ok'])
if __name__=='__main__':unittest.main()
