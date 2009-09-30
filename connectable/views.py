# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.core import serializers
from django.utils import simplejson
from django.utils.translation import ugettext as _

from commons.resource import Resource

from django.db import transaction

from commons.authentication import get_user_authentication
from commons.get_data import get_inout_data, get_wiring_data, get_tab_data
from commons.logs import log
from commons.utils import json_encode, get_xml_error

from igadget.models import IGadget, Variable
from workspace.models import WorkSpace, Tab, AbstractVariable, WorkSpaceVariable, VariableValue
from connectable.models import In, Out, RelatedInOut, InOut, Filter, RemoteSubscription

from commons.logs_exception import TracedServerError

class ConnectableEntry(Resource):
    def read(self, request, workspace_id):
        user = get_user_authentication(request)
        wiring = {}

        try:
            igadgets = IGadget.objects.filter(tab__workspace__pk=workspace_id)
            igadget_data_list = get_wiring_data(igadgets)
            wiring['iGadgetList'] = igadget_data_list

            tabs = Tab.objects.filter(workspace__pk=workspace_id)
            tab_data = serializers.serialize('python', tabs, ensure_ascii=False)
            wiring['tabList'] = [get_tab_data(d) for d in tab_data]

        except WorkSpace.DoesNotExist:
            wiring['iGadgetList'] = []
            wiring['tabList'] = []

        # InOut list
        inouts = InOut.objects.filter(workspace__pk=workspace_id)
        inout_data = serializers.serialize('python', inouts, ensure_ascii=False)
        wiring['inOutList'] = [get_inout_data(d) for d in inout_data]

        # Filter list
        filters = Filter.objects.all()
        filter_data = serializers.serialize('python', filters, ensure_ascii=False)
        wiring['filterList'] = [get_filter_data(d) for d in filter_data]

        return HttpResponse(json_encode(wiring), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request, workspace_id):
        user = get_user_authentication(request)

        # Gets all needed parameters from request
        if request.POST.has_key('json'):
            json = simplejson.loads(request.POST['json'])
        else:
            return HttpResponseBadRequest (_(u'JSON parameter expected'))

        try:
            workspace = WorkSpace.objects.get(id=workspace_id)

            # Mapping between provisional ids and database-generated ids!!!
            id_mapping = {}

            # Erasing variables associated with channels deleted explicitly by the user
            channelsDeletedByUser = json['channelsForRemoving']
            for deleted_channel_id in channelsDeletedByUser:
                #Removing workspace_variable and abstract_variable of channels deleted explicitly by user
                deleted_channel = InOut.objects.get(id=deleted_channel_id)

                abstract_variable = deleted_channel.workspace_variable.abstract_variable

                VariableValue.objects.get(user=user, abstract_variable=abstract_variable).delete()

                abstract_variable.delete()
                deleted_channel.workspace_variable.delete()
                
                if deleted_channel.remote_subscription:
                    deleted_channel.remote_subscription.delete()

            # Erasing all channels of the workspace!!
            old_channels = InOut.objects.filter(workspace_variable__workspace=workspace)
            for old_channel in old_channels:
                # Deleting the old relationships between channels
                # First delete the relationships where old_channel is the input
                rel_old_channels = RelatedInOut.objects.filter(in_inout=old_channel)
                for channel_delete in rel_old_channels:
                    channel_delete.delete()

                # And then the relationships where old_channel is the output
                rel_old_channels = RelatedInOut.objects.filter(out_inout=old_channel)
                for channel_delete in rel_old_channels:
                    channel_delete.delete()
                    
                if old_channel.remote_subscription:
                    old_channel.remote_subscription.delete()

                # Now delete the current channel
                old_channel.delete()

            # Adding channels recreating JSON structure!
            new_channels = json['inOutList']
            for new_channel_data in new_channels:
                # Remote subscriptions!
                remote_subscription = None
                if new_channel_data['remote_subscription']:
                        op_code = unicode(new_channel_data['remote_subscription']['op_code'])
                        url = new_channel_data['remote_subscription']['url']
                        
                        if op_code != '0':
                            remote_subscription = RemoteSubscription(operation_code=op_code, url=url)
                            remote_subscription.save()
                
                if (new_channel_data['provisional_id']):
                    #It's necessary to create all objects!

                    #Creating abstract variable
                    new_abstract_variable = AbstractVariable(type="WORKSPACE", name=new_channel_data['name'])
                    new_abstract_variable.save()

                    #Creating variable value
                    new_variable_value = VariableValue(user=user, value="", abstract_variable=new_abstract_variable)
                    new_variable_value.save()

                    new_ws_variable = WorkSpaceVariable(workspace=workspace, abstract_variable=new_abstract_variable, aspect="CHANNEL")
                    new_ws_variable.save()

                    filter = None
                    fparam_values = None
                    if new_channel_data['filter']:
                        try:
                            filter = Filter.objects.get(id=new_channel_data['filter'])
                            fparam_values = json_encode(new_channel_data['filter_params'])
                        except Filter.DoesNotExist:
                            pass

                    channel = InOut(name=new_channel_data['name'], remote_subscription=remote_subscription, workspace_variable=new_ws_variable, filter=filter, filter_param_values=fparam_values, friend_code="")
                    channel.save()

                    # A channel has been generated. It's necessary to correlate provisional and definitive ids!
                    id_mapping[new_channel_data['id']] = {'new_id': channel.id, 'new_wv_id': new_ws_variable.id}

                else:
                    #WorkSpaceVariable objects is still in database, it's only necessary to link it!
                    workspace_variable = WorkSpaceVariable.objects.get(id=new_channel_data['var_id'])

                    workspace_variable.abstract_variable.name = new_channel_data['name']
                    workspace_variable.abstract_variable.save()

                    try:
                        filter = Filter.objects.get(id=new_channel_data['filter'])
                        fparam_values = json_encode(new_channel_data['filter_params'])
                    except Filter.DoesNotExist:
                        filter = None
                        fparam_values = None

                    channel = InOut(id=new_channel_data['id'], remote_subscription=remote_subscription, name=new_channel_data['name'], workspace_variable=workspace_variable, filter=filter, filter_param_values=fparam_values, friend_code="")
                    channel.save()

                # In connections
                # InOut out connections will be created later
                ins = new_channel_data['ins']
                for inputId in ins:
                    connectable = In.objects.get(id=inputId)
                    connectable.inouts.add(channel);
                    connectable.save()

                # Out connections
                # InOut out connections will be created later
                outs = new_channel_data['outs']
                for outputId in outs:
                    connectable = Out.objects.get(id=outputId)
                    connectable.inouts.add(channel);
                    connectable.save()

            # Now it is time to recreate channel to channel connections
            for new_channel_data in new_channels:
                channel = InOut(id=new_channel_data['id'])
                inouts = new_channel_data['inouts']
                for inout_to_add in inouts:
                    inout_id = inout_to_add['id']

                    # search final id if needed
                    if inout_to_add['provisional_id']:
                        inout_id = id_mapping[inout_id]['new_id']

                    relationship = RelatedInOut(in_inout=channel, out_inout=InOut.objects.get(id=inout_id))
                    relationship.save()

            json_result = {'ids': id_mapping}

            return HttpResponse (json_encode(json_result), mimetype='application/json; charset=UTF-8')
        except WorkSpace.DoesNotExist, e:
            msg = _('referred workspace (id: %(workspace_id)s) does not exist.') % {'workspace_id': workspace_id}
            raise TracedServerError(e, json, request, msg)

        except Exception, e:
            msg = _('connectables cannot be saved: %(exc)s') % {'exc': e}
            raise TracedServerError(e, json, request, msg)

        return HttpResponse('ok')

    @transaction.commit_on_success
    def update(self, request, workspace_id):
        user = get_user_authentication(request)

        # Gets all needed parameters from request
        if request.POST.has_key('json'):
            json = simplejson.loads(request.POST['json'])
        else:
            return HttpResponseBadRequest (_(u'JSON parameter expected'))

        try:
            workspace = WorkSpace.objects.get(id=workspace_id)
        except WorkSpace.DoesNotExist:
            msg = _('referred workspace %(workspace_name)s does not exist.') % {'workspace_name': workspace_name}
            raise TracedServerError(e, json, request, msg)

        id_mapping = {}

        # Pashe 1: Additions
        channels_to_add = json['channelsToAdd']
        for new_channel in channels_to_add:
            # Creating the abstract variable for this channel
            new_abstract_variable = AbstractVariable(type="WORKSPACE", name=new_channel_data['name'])
            new_abstract_variable.save()

            # Creating the variable value entry for this channel
            new_variable_value = VariableValue(user=user, value="", abstract_variable=new_abstract_variable)
            new_variable_value.save()

            # And the workspace variable
            new_ws_variable = WorkSpaceVariable(workspace=workspace, abstract_variable=new_abstract_variable, aspect="CHANNEL")
            new_ws_variable.save()

            channel = InOut(name="", workspace_variable=new_ws_variable, filter=None, filter_param_values=None, friend_code="")
            channel.save()

            id_mapping[new_channel['id']] = {'cid': channel.id, 'wvid': new_ws_variable.id}

        # Pashe 2: Updates
        channels_to_update = json['channelsToUpdate']
        for current_channel_data in channels_to_update:
            current_channel_id = current_channel_data['id']

            # search final id if needed
            if current_channel_data['provisional_id']:
                current_channel_id = id_mapping[current_channel_id]['cid']

            current_channel = InOut.objects.get(id=current_channel_data['id'])

            for input_to_add in current_channel_data['inputsToRemove']:
                connectable = In.objects.get(id=input_to_add['id'])
                connectable.inouts.add(current_channel);
                connectable.save()

            for input_to_remove in current_channel_data['inputsToRemove']:
                connectable = In.objects.get(id=input_to_add['id'])
                connectable.inouts.remove(current_channel);
                connectable.save()

            for output_to_add in current_channel_data['outputsToRemove']:
                connectable = Out.objects.get(id=output_to_add['id'])
                connectable.inouts.add(current_channel);
                connectable.save()

            for output_to_remove in current_channel_data['outputsToRemove']:
                connectable = Out.objects.get(id=output_to_add['id'])
                connectable.inouts.remove(current_channel);
                connectable.save()

            for inout_to_add in current_channel_data['inoutsToRemove']:
                inout_id = input_to_add['id']

                # search final id if needed
                if inout_to_add['provisional_id']:
                    inout_id = id_mapping[inout_id]['cid']

                relationship = RelatedInOut(in_inout=current_channel, out_inout=InOut.objects.get(id=inout_id))
                relationship.save()

            for output_to_remove in current_channel_data['outputsToRemove']:
                inout_id = input_to_add['id']

                # search final id if needed
                if inout_to_add['provisional_id']:
                    inout_id = id_mapping[inout_id]['cid']

                relationship = RelatedInOut.objects.get(in_inout=current_channel, out_inout=inout_id)
                relationship.delete()

        # Pashe 3: Deletions
        channels_to_remove = json['channelsToRemove']
        for current_channel_data in channels_to_remove:
            channel = InOut.objects.get(id=current_channel_data['id'])

            abstract_variable = channel.workspace_variable.abstract_variable

            VariableValue.objects.get(user=user, abstract_variable=abstract_variable).delete()

            abstract_variable.delete()
            channel.workspace_variable.delete()
            channel.delete()


        json_result = {'id_mapping': id_mapping}
        return HttpResponse (json_encode(json_result), mimetype='application/json; charset=UTF-8')
