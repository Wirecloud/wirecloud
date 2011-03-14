from django.contrib.auth.models import User
from django.test import TransactionTestCase, Client
from django.utils import simplejson

from connectable.models import InOut
from connectable.utils import createChannel
from workspace.views import createEmptyWorkSpace


class WiringTests(TransactionTestCase):

    fixtures = 'test_workspace'

    def setUp(self):
        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.user2 = User.objects.create_user('test2', 'test@example.com', 'test')

        workspace = createEmptyWorkSpace('Testing', self.user)
        self.workspace_id = workspace.pk

        read_only_channel = createChannel(workspace, 'Read-only Channel')
        read_only_channel.readOnly = True
        read_only_channel.save()
        self._read_only_channel_id = read_only_channel.pk

        self.wiring_url = '/workspace/' + str(self.workspace_id) + '/wiring'

    def test_basic_wiring_operations(self):
        client = Client()
        client.login(username='test', password='test')

        # Creating a new channel
        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Read-only Channel',
                },
                -1: {
                    'id': -1,
                    'provisional_id': True,
                    'name': 'Provisional Channel',
                 },
            },
        })
        response = client.post(self.wiring_url, {'json': data})

        self.assertEquals(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue('ids' in response_data and '-1' in response_data['ids'])
        channel_id = response_data['ids']['-1']['new_id']
        InOut.objects.get(id=self._read_only_channel_id)
        InOut.objects.get(id=channel_id, name='Provisional Channel')

        # Renaming "Provisional Channel" to "New Channel"
        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Read-only Channel',
                 },
                channel_id: {
                    'id': channel_id,
                    'provisional_id': False,
                    'name': 'New Channel',
                 },
            },
        })
        response = client.post(self.wiring_url, {'json': data})

        self.assertEquals(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue('ids' in response_data and len(response_data['ids']) == 0)
        InOut.objects.get(id=self._read_only_channel_id)
        InOut.objects.get(id=channel_id, name='New Channel')

        # Remove "New channel"
        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Read-only Channel',
                 },
            },
        })
        response = client.post(self.wiring_url, {'json': data})

        self.assertEquals(response.status_code, 200)
        self.assertRaises(InOut.DoesNotExist, InOut.objects.get, pk=channel_id)

    def test_complex_wiring_operation(self):
        client = Client()
        client.login(username='test', password='test')

        # Create 3 channels
        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Read-only Channel',
                 },
                -1: {
                    'id': -1,
                    'provisional_id': True,
                    'name': 'Provisional Channel 1',
                    'inouts': [{'id': -3, 'provisional_id': True}],
                },
                -2: {
                    'id': -2,
                    'provisional_id': True,
                    'name': 'Provisional Channel 2',
                },
                -3: {
                    'id': -3,
                    'provisional_id': True,
                    'name': 'Provisional Channel 3',
                },
            },
        })
        response = client.post(self.wiring_url, {'json': data})
        self.assertEquals(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue('ids' in response_data and len(response_data['ids']) == 3)
        provisional_channel_id = response_data['ids']['-2']['new_id']

        # Delete two of the channels created in the previous request
        # Rename the remaining one to "Provisional Channel"
        # Create a new channel and link it to the "Provisional Channel"
        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Read-only Channel',
                },
                provisional_channel_id: {
                    'id': provisional_channel_id,
                    'provisional_id': False,
                    'name': 'Provisional Channel',
                },
                -1: {
                    'id': -1,
                    'provisional_id': True,
                    'name': 'New Channel',
                    'inouts': [{'id': provisional_channel_id, 'provisional_id': False}]
                },
            },
        })
        response = client.post(self.wiring_url, {'json': data})
        self.assertEquals(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue('ids' in response_data and '-1' in response_data['ids'])
        new_channel_id = response_data['ids']['-1']['new_id']
        InOut.objects.get(id=self._read_only_channel_id)
        InOut.objects.get(id=provisional_channel_id, name='Provisional Channel')
        InOut.objects.get(id=new_channel_id, name='New Channel')

    def test_wiring_modification_fails_with_incorrect_user(self):
        client = Client()
        client.login(username='test2', password='test')

        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Read-only Channel',
                },
                -1: {
                    'id': -1,
                    'provisional_id': True,
                    'name': 'Provisional Channel',
                },
            },
        })
        response = client.post(self.wiring_url, {'json': data})
        self.assertEquals(response.status_code, 403)

    def test_read_only_channels_cannot_be_modified(self):
        client = Client()
        client.login(username='test', password='test')

        data = simplejson.dumps({
            'inOutList': {
                self._read_only_channel_id: {
                    'id': self._read_only_channel_id,
                    'provisional_id': False,
                    'name': 'Writable Channel',
                },
            },
        })
        response = client.post(self.wiring_url, {'json': data})
        self.assertEquals(response.status_code, 403)
        InOut.objects.get(id=self._read_only_channel_id, name='Read-only Channel')
