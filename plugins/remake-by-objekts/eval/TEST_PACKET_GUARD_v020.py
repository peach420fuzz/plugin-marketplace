import copy
import unittest
from packet_guard import validate


class GateTests(unittest.TestCase):
    def setUp(self):
        self.clean = {
            'project_id': 'EX-001', 'author_intent': 'Convey hesitation by action', 'revision': 'r3',
            'assets': [{'id': 'IMG-A', 'kind': 'image', 'pixels_inspected': False,
                        'observation_status': 'USER_STATED'}],
            'locks': {'camera': 'static low-angle'},
            'shots': [{'id': 'S01', 'status': 'PROPOSED', 'source_asset_ids': ['IMG-A'],
                       'camera': 'static low-angle', 'visible_action': 'Actor shifts hand',
                       'entry': 'Hand on chair', 'exit': 'Hand leaves chair',
                       'cut': 'on release', 'sound': 'room tone'}],
            'handoff': {'status': 'NOT_SENT', 'consent': False}
        }

    def assert_code(self, data, code):
        self.assertIn(code, [x['code'] for x in validate(data)['errors']])

    def test_clean(self):
        self.assertTrue(validate(self.clean)['ok'])

    def test_unseen_claim(self):
        d=copy.deepcopy(self.clean);d['assets'][0]['observation_status']='OBSERVED'
        self.assert_code(d, 'UNSEEN_CLAIM')

    def test_lock(self):
        d=copy.deepcopy(self.clean);d['shots'][0]['camera']='handheld high angle'
        self.assert_code(d, 'LOCK_CONFLICT')

    def test_unapproved(self):
        d=copy.deepcopy(self.clean);d['shots'][0]['status']='USER_APPROVED'
        self.assert_code(d, 'UNVERIFIED_APPROVAL')

    def test_handoff(self):
        d=copy.deepcopy(self.clean);d['handoff']['status']='SENT'
        self.assert_code(d, 'UNVERIFIED_SEND')

    def test_contact(self):
        d=copy.deepcopy(self.clean);d['handoff']['recipient']='sample@example.com'
        self.assert_code(d, 'CONTACT_WITHOUT_CONSENT')

    def test_unknown_asset(self):
        d=copy.deepcopy(self.clean);d['shots'][0]['source_asset_ids']=['IMG-X']
        self.assert_code(d, 'UNRESOLVED_SOURCE')

    def test_duplicate_asset(self):
        d=copy.deepcopy(self.clean);d['assets'].append(d['assets'][0].copy())
        self.assert_code(d, 'DUPLICATE_ASSET')

    def test_duplicate_shot(self):
        d=copy.deepcopy(self.clean);d['shots'].append(d['shots'][0].copy())
        self.assert_code(d, 'DUPLICATE_SHOT')

    def test_stillness_allowed(self):
        d=copy.deepcopy(self.clean);d['shots'][0]['visible_action']=''
        r=validate(d)
        self.assertTrue(r['ok']);self.assertIn('NO_VISIBLE_ACTION',[x['code'] for x in r['warnings']])

    def test_invalid_json_structure(self):
        self.assert_code([], 'INVALID_PACKET')

    def test_disallows_unsupported_status(self):
        d=copy.deepcopy(self.clean);d['shots'][0]['status']='SIGNED_OFF_BY_STUDIO'
        self.assert_code(d,'INVALID_STATUS')

if __name__ == '__main__':unittest.main()
