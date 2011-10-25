#-*- coding: utf-8 -*-

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
import random
import re

from django.conf import settings
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import get_language
from django.utils.translation import ugettext as _

from commons.cache import CacheableData
from connectable.models import In, Out, RelatedInOut, InOut, Filter
from context.models import Concept, ConceptName, Constant
from context.utils import get_user_context_providers
from gadget.models import XHTML, UserPrefOption, Capability, VariableDef
from igadget.models import Variable, IGadget
from preferences.views import get_workspace_preference_values, get_tab_preference_values
from workspace.models import Tab, VariableValue, UserWorkSpace, PublishedWorkSpace
from workspace.utils import createTab, decrypt_value, encrypt_value


def _variable_cache_key(igadget):
    return '_variable_cache/' + str(igadget.id)


def _get_cached_variables(igadget):
    key = _variable_cache_key(igadget)

    variables = cache.get(key)
    if variables == None:
        variable_query = Variable.objects.filter(igadget__id=igadget.id).select_related('igadget', 'vardef')
        variables = variable_query[::1]
        cache.set(key, variables)

    return variables


def _invalidate_cached_variables(igadget):
    key = _variable_cache_key(igadget)
    cache.delete(key)
    _invalidate_cached_variable_values(igadget.tab.workspace)


def _populate_variables_values_cache(workspace, user, key, forced_values=None):
    """ populates VariableValue cached values for that user """
    values_by_varid = {}
    values_by_varname = {}

    if forced_values == None:
        concept_values = get_concept_values(user)
        preferences = get_workspace_preference_values(workspace)
        forced_values = process_forced_values(workspace, user, concept_values, preferences)

    var_values = VariableValue.objects.filter(user__id=user.id, variable__igadget__tab__workspace=workspace)
    for var_value in var_values.select_related('variable__vardef'):
        varigadget = var_value.variable.igadget.id
        varname = var_value.variable.vardef.name
        # forced_values uses string keys
        svarigadget = str(varigadget)

        if not varigadget in values_by_varname:
            values_by_varname[varigadget] = {}

        entry = {}
        if svarigadget in forced_values['igadget'] and varname in forced_values['igadget'][svarigadget]:
            fv_entry = forced_values['igadget'][svarigadget][varname]

            entry['value'] = fv_entry['value']
            if var_value.variable.vardef.secure:
                entry['value'] = encrypt_value(entry['value'])

            if 'hidden' in fv_entry:
                entry['hidden'] = fv_entry['hidden']

            entry['forced'] = True
        else:
            if not var_value.variable.vardef.secure:
                entry['value'] = var_value.get_variable_value()
            else:
                entry['value'] = var_value.value

        entry['secure'] = var_value.variable.vardef.secure

        values_by_varname[varigadget][varname] = entry
        values_by_varid[var_value.variable.id] = entry

    values = {
        'by_varid': values_by_varid,
        'by_varname': values_by_varname,
    }
    cache.set(key, values)

    return values


def _get_workspace_version(workspace):
    version = cache.get('_workspace_version/' + str(workspace.id))
    if version is None:
        version = random.randrange(1, 100000)
        cache.set('_workspace_version/' + str(workspace.id), version)
    return version


def _variable_values_cache_key(workspace, user):
    version = _get_workspace_version(workspace)
    return '/'.join(('_variables_values_cache', str(workspace.id), str(version), str(user.id)))


def _workspace_cache_key(workspace, user):
    version = _get_workspace_version(workspace)
    return '/'.join(('_workspace_global_data', str(workspace.id), str(version), str(user.id)))


def get_variable_value_from_varname(user, igadget, var_name):

    if 'id' in igadget:
        igadget_id = igadget.id
        igadget = IGadget.objects.get(id=igadget_id)
    elif not isinstance(igadget, IGadget):
        igadget_id = int(igadget)
        igadget = IGadget.objects.get(id=igadget_id)
    else:
        igadget_id = igadget

    workspace = igadget.tab.workspace
    key = _variable_values_cache_key(workspace, user)
    values = cache.get(key)
    if values == None:
        values = _populate_variables_values_cache(workspace, user, key)

    entry = values['by_varname'][igadget_id][var_name]
    if entry['secure'] == True:
        return decrypt_value(entry['value'])
    else:
        return entry['value']


def _invalidate_cached_variable_values(workspace, user=None):
    if user is not None:
        key = _variable_values_cache_key(workspace, user)
        cache.delete(key)

        key = _workspace_cache_key(workspace, user)
        cache.delete(key)
    else:
        try:
            cache.incr('_workspace_version/' + str(workspace.id))
        except ValueError:
            pass


class VariableValueCacheManager():

    workspace = None
    user = None
    values = None
    forced_values = None

    def __init__(self, workspace, user, forced_values=None):
        self.workspace = workspace
        self.user = user
        self.forced_values = forced_values

    def _process_entry(self, entry):

        if entry['secure'] == True:
            return decrypt_value(entry['value'])
        else:
            return entry['value']

    def get_variable_values(self):
        if self.values == None:
            key = _variable_values_cache_key(self.workspace, self.user)
            self.values = cache.get(key)
            if self.values == None:
                self.values = _populate_variables_values_cache(self.workspace, self.user, key, self.forced_values)

        return self.values

    def get_variable_value_from_var(self, variable):
        values = self.get_variable_values()
        entry = values['by_varid'][variable.id]
        return self._process_entry(entry)

    def get_variable_value_from_varname(self, igadget, var_name):

        if 'id' in igadget:
            igadget_id = igadget.id
            igadget = IGadget.objects.get(id=igadget_id)
        elif not isinstance(igadget, IGadget):
            igadget_id = int(igadget)
            igadget = IGadget.objects.get(id=igadget_id)
        else:
            igadget_id = igadget

        values = self.get_variable_values()
        entry = values['by_varname'][igadget_id][var_name]
        return self._process_entry(entry)

    def get_variable_data(self, variable):
        values = self.get_variable_values()
        entry = values['by_varid'][variable.id]
        data_ret = {}

        if entry['secure']:
            data_ret['value'] = ''
            data_ret['secure'] = True
        else:
            data_ret['value'] = entry['value']

        if 'forced' in entry and entry['forced'] == True:
            data_ret['readOnly'] = True
            if 'hidden' in entry:
                data_ret['hidden'] = entry['hidden']

        return data_ret

    def invalidate(self):
        _invalidate_cached_variable_values(self.workspace, self.user)


def get_wiring_variable_data(var, ig):
    res_data = {}

    res_data['id'] = var.vardef.pk
    res_data['name'] = var.vardef.name
    res_data['aspect'] = var.vardef.aspect
    res_data['type'] = var.vardef.type
    res_data['value'] = var.value
    res_data['friend_code'] = var.vardef.friend_code
    res_data['igadget_id'] = ig.id

    return res_data


def get_wiring_data(igadgets):
    res_data = []

    for ig in igadgets:
        variables = Variable.objects.filter(igadget=ig)

        igObject = {}
        list = []

        igObject['id'] = ig.pk

        #Searching wiring variables
        for var in variables:
            varDef = var.vardef

            if varDef.aspect == 'SLOT' or varDef.aspect == 'EVEN':
                list.append(get_wiring_variable_data(var, ig))

        igObject['list'] = list

        res_data.append(igObject)

    return res_data


def get_gadget_data(gadget):
    tgadget = gadget.get_translated_model()
    data_ret = {}
    data_variabledef = VariableDef.objects.filter(gadget=gadget)
    data_vars = {}
    for var in data_variabledef:
        tvar = var.get_translated_model()
        data_var = {}
        data_var['aspect'] = var.aspect
        data_var['name'] = var.name
        data_var['type'] = var.type
        data_var['label'] = tvar.label
        data_var['description'] = tvar.description

        if var.aspect == 'PREF':
            data_var['default_value'] = tvar.default_value

            if var.type == 'L':
                options = UserPrefOption.objects.filter(variableDef=var)
                value_options = []
                for option in options:
                    toption = option.get_translated_model()
                    value_options.append([toption.value, toption.name])
                data_var['value_options'] = value_options

        elif var.aspect == 'SLOT':
            data_var['action_label'] = tvar.action_label

        if var.aspect in ('PREF', 'PROP', 'EVEN', 'SLOT'):

            data_var['order'] = var.order

        if var.aspect == 'PREF' or var.aspect == 'PROP':

            data_var['secure'] = var.secure

        elif var.aspect == 'GCTX' or var.aspect == 'ECTX':

            data_var['concept'] = var.contextoption_set.all().values('concept')[0]['concept']

        elif var.aspect == 'EVEN' or var.aspect == 'SLOT':

            data_var['friend_code'] = var.friend_code

        data_vars[var.name] = data_var

    data_code = get_object_or_404(XHTML.objects.all().values('uri'), id=gadget.xhtml.id)

    data_ret['name'] = gadget.name
    if tgadget.display_name and tgadget.display_name != "":
        data_ret['displayName'] = tgadget.display_name
    else:
        data_ret['displayName'] = gadget.name
    data_ret['vendor'] = gadget.vendor
    data_ret['description'] = tgadget.description
    data_ret['uri'] = gadget.uri
    data_ret['wikiURI'] = tgadget.wikiURI
    data_ret['imageURI'] = tgadget.imageURI
    data_ret['iPhoneImageURI'] = tgadget.iPhoneImageURI
    data_ret['menuColor'] = gadget.menuColor
    data_ret['version'] = gadget.version
    data_ret['mail'] = gadget.mail
    data_ret['shared'] = gadget.shared
    data_ret['last_update'] = gadget.last_update
    data_ret['size'] = {}
    data_ret['size']['width'] = gadget.width
    data_ret['size']['height'] = gadget.height
    data_ret['variables'] = data_vars
    data_ret['xhtml'] = data_code

    data_ret['capabilities'] = get_gadget_capabilities(gadget_id=gadget.id)

    return data_ret


def get_gadget_capabilities(gadget_id):
    data_ret = []

    try:
        capability_list = Capability.objects.filter(gadget__id=gadget_id)

        for capability in capability_list:
            cap = {}

            cap['name'] = capability.name
            cap['value'] = capability.value

            data_ret.append(cap)
    except Capability.DoesNotExist:
        data_ret = {}

    return data_ret


def get_input_data(inout):
    all_inputs = []
    inputs = In.objects.filter(inout=inout)
    for ins in inputs:
        input_data = {}
        input_data['id'] = ins.pk
        input_data['name'] = ins.name
        var = ins.variable
        input_data['varId'] = var.pk
        input_data['type'] = var.vardef.aspect
        all_inputs.append(input_data)
    return all_inputs


def get_output_data(inout):
    all_outputs = []
    outputs = Out.objects.filter(inout=inout)
    for outs in outputs:
        output_data = {}
        output_data['id'] = outs.pk
        output_data['name'] = outs.name
        var = outs.variable
        output_data['varId'] = var.pk
        output_data['type'] = var.vardef.aspect
        all_outputs.append(output_data)
    return all_outputs


def get_inout_data(inout):
    """
        deprecated!!!!
    """
    data_ins = get_input_data(inout=inout)
    data_outs = get_output_data(inout=inout)

    return {
        'id': inout.pk,
        'aspect': 'INOUT',
        'friend_code': inout.friend_code,
        'name': inout.name,
        'inputs': [d for d in data_ins],
        'outputs': [d for d in data_outs],
    }


def get_filter_data(filter__):
    filter_ = filter__.get_translated_model()

    return {
        'id': filter_.pk,
        'name': filter_.name,
        'nature': filter_.nature,
        'label': filter_.label,
        'category': filter_.category,
        'help_text': filter_.help_text,
        'code': filter_.code,
        'params': filter_.params,
    }


def get_workspace_data(workspace, user):
    user_workspace = UserWorkSpace.objects.get(user=user, workspace=workspace)

    return {
        'id': workspace.id,
        'name': workspace.name,
        'shared': workspace.is_shared(),
        'owned': workspace.creator == user,
        'removable': workspace.creator == user and user_workspace.manager == '',
        'active': user_workspace.active,
    }


def get_workspace_variables_data(workSpaceDAO, user):
    inout_variables = InOut.objects.filter(workspace=workSpaceDAO)
    return [get_connectable_data(inout) for inout in inout_variables]


def get_remote_subscription_data(connectable):
    if connectable.remote_subscription:
        subscription = {}

        subscription['url'] = connectable.remote_subscription.remote_channel.url
        subscription['op_code'] = connectable.remote_subscription.operation_code
        subscription['id'] = connectable.remote_subscription.id
        subscription['remote_channel_id'] = connectable.remote_subscription.remote_channel.id

        return subscription
    else:
        return None


def get_connectable_data(connectable):
    res_data = {}

    if isinstance(connectable, InOut):
        connectable_type = "inout"
        res_data['id'] = connectable.id
        res_data['name'] = connectable.name

        # Locating IN connectables linked to this connectable
        res_data['ins'] = []

        ins = In.objects.filter(inouts__id=connectable.id)
        for input in ins:
            res_data['ins'].append(get_connectable_data(input))

        # Locating OUT connectables linked to this connectable
        res_data['outs'] = []

        outs = Out.objects.filter(inouts__id=connectable.id)
        for output in outs:
            res_data['outs'].append(get_connectable_data(output))

        # Locating INOUT connectables linked to this connectable as output
        res_data['out_inouts'] = []
        related_inouts = RelatedInOut.objects.filter(in_inout=connectable)
        for related_inout in related_inouts:
            res_data['out_inouts'].append(related_inout.out_inout_id)

        # Locating the filter linked to this conectable!
        res_data['filter'] = connectable.filter_id
        res_data['filter_params'] = connectable.filter_param_values

        # RemoteChannel data
        res_data['remote_subscription'] = get_remote_subscription_data(connectable)

        # ReadOnly data
        res_data['readOnly'] = connectable.readOnly

    elif isinstance(connectable, Out):
        connectable_type = "out"
        res_data['var_id'] = connectable.variable.id

    elif isinstance(connectable, In):
        connectable_type = "in"
        res_data['var_id'] = connectable.variable.id

    res_data['connectable_type'] = connectable_type

    return res_data


class TemplateValueProcessor:

    _RE = re.compile(r'(%+)\(([a-zA-Z][\w-]*(?:\.[a-zA-Z\][\w-]*)*)\)')

    def __init__(self, context):
        self._context = context

    def __repl(self, matching):
        plen = len(matching.group(1))
        if (plen % 2) == 0:
            return '%' * (plen / 2) + '(' + matching.group(1) + ')'

        var_path = matching.group(2).split('.')
        current_context = self._context

        while len(var_path) > 0:
            current_path = var_path.pop(0)

            if hasattr(current_context, current_path):
                current_context = getattr(current_context, current_path)
            elif current_path in current_context:
                current_context = current_context[current_path]
            else:
                current_context = self._context
                break

        if current_context != self._context:
            return current_context
        else:
            return matching.group(0)

    def process(self, value):
        return self._RE.sub(self.__repl, value)


def process_forced_values(workspace, user, concept_values, preferences):
    try:
        forced_values = simplejson.loads(workspace.forcedValues)
    except:
        forced_values = {
            'igadget': {},
        }

    if not 'extra_prefs' in forced_values:
        forced_values['extra_prefs'] = {}

    if not 'igadget' in forced_values:
        forced_values['igadget'] = {}

    if len(forced_values['igadget']) == 0:
        forced_values['empty_params'] = []
        return forced_values

    param_values = {}
    empty_params = []
    for param in forced_values['extra_prefs']:
        if param in preferences:
            param_values[param] = preferences[param]['value']
        else:
            empty_params.append(param)
            param_values[param] = ''
    forced_values['empty_params'] = empty_params

    processor = TemplateValueProcessor({'user': user, 'context': concept_values, 'params': param_values})

    collection = forced_values['igadget']
    for key in collection:
        values = collection[key]
        for var_name in values:
            collection[key][var_name]['value'] = processor.process(values[var_name]['value'])

    return forced_values


def _get_global_workspace_data(workSpaceDAO, user):
    data_ret = {}
    data_ret['workspace'] = get_workspace_data(workSpaceDAO, user)

    # Context information
    concept_values = get_concept_values(user)
    data_ret['workspace']['concepts'] = get_concepts_data(concept_values)

    # Workspace preferences
    preferences = get_workspace_preference_values(workSpaceDAO.pk)
    data_ret['workspace']['preferences'] = preferences

    # Process forced variable values
    forced_values = process_forced_values(workSpaceDAO, user, concept_values, preferences)
    data_ret['workspace']['empty_params'] = forced_values['empty_params']
    data_ret['workspace']['extra_prefs'] = forced_values['extra_prefs']
    if len(forced_values['empty_params']) > 0:
        return data_ret

    cache_manager = VariableValueCacheManager(workSpaceDAO, user, forced_values)

    # Tabs processing
    # Check if the workspace's tabs have order
    tabs = Tab.objects.filter(workspace=workSpaceDAO).order_by('id')
    if tabs.count() > 0:
        if tabs[0].position != None:
            tabs = tabs.order_by('position')
        else:
            #set default order
            for i in range(len(tabs)):
                tabs[i].position = i
                tabs[i].save()
    else:
        tabs = [createTab(_('Tab'), user, workSpaceDAO)]

    tabs_data = [get_tab_data(tab) for tab in tabs]

    data_ret['workspace']['tabList'] = tabs_data

    for tab in tabs_data:
        tab_pk = tab['id']
        igadgets = IGadget.objects.filter(tab__id=tab_pk).order_by('id')

        igadget_data = []
        for igadget in igadgets:
            igadget_data.append(get_igadget_data(igadget, user, workSpaceDAO, cache_manager))

        tab['igadgetList'] = igadget_data

    workspace_variables_data = get_workspace_variables_data(workSpaceDAO, user)
    data_ret['workspace']['channels'] = workspace_variables_data

    # Filter information
    filters = Filter.objects.all()
    data_ret['workspace']['filters'] = [get_filter_data(f) for f in filters]

    # Params
    last_published_workspace = PublishedWorkSpace.objects.filter(workspace=workSpaceDAO).order_by('-pk')
    if len(last_published_workspace) > 0:
        data_ret["workspace"]["params"] = simplejson.loads(last_published_workspace[0].params)

    return data_ret


def get_global_workspace_data(workspace, user):
    key = _workspace_cache_key(workspace, user)
    data = cache.get(key)
    if data is None:
        data = CacheableData(_get_global_workspace_data(workspace, user))
        cache.set(key, data)

    return data


def get_tab_data(tab):
    return {
        'id': tab.id,
        'name': tab.name,
        'visible': tab.visible,
        'preferences': get_tab_preference_values(tab),
    }


def get_igadget_data(igadget, user, workspace, cache_manager=None):

    data_ret = {'id': igadget.id,
        'name': igadget.name,
        'tab': igadget.tab.id,
        'layout': igadget.layout,
        'menu_color': igadget.menu_color,
        'refused_version': igadget.refused_version,
        'gadget': igadget.gadget.uri,
        'top': igadget.position.posY,
        'left': igadget.position.posX,
        'zIndex': igadget.position.posZ,
        'width': igadget.position.width,
        'height': igadget.position.height,
        'fulldragboard': igadget.position.fulldragboard,
        'minimized': igadget.position.minimized,
        'transparency': igadget.transparency,
        'readOnly': igadget.readOnly,
    }

    if igadget.icon_position:
        data_ret['icon_top'] = igadget.icon_position.posY
        data_ret['icon_left'] = igadget.icon_position.posX
    else:
        data_ret['icon_top'] = 0
        data_ret['icon_left'] = 0

    if cache_manager == None:
        cache_manager = VariableValueCacheManager(workspace, user)

    variables = _get_cached_variables(igadget)
    data_ret['variables'] = {}
    for variable in variables:
        var_data = get_variable_data(variable, user, workspace, cache_manager)
        data_ret['variables'][variable.vardef.name] = var_data

    return data_ret


def get_variable_data(variable, user, workspace, cache_manager=None):
    data_ret = {
        'id': variable.id,
        'name': variable.vardef.name,
    }

    if variable.vardef.aspect != 'PREF' and variable.vardef.aspect != 'PROP':
        return data_ret

    if cache_manager == None:
        cache_manager = VariableValueCacheManager(workspace, user)

    # Variable info is splited into 2 entities: VariableDef and VariableValue
    data_ret.update(cache_manager.get_variable_data(variable))

    return data_ret


def get_constant_values():
    res = {}

    constants = Constant.objects.all()
    for constant in constants:
        res[constant.concept.concept] = constant.value

    return res


def get_extra_concepts():
    extra_concepts = []

    user_context_providers = get_user_context_providers()
    for provider in user_context_providers:
        extra_concepts += provider.get_concepts()

    return extra_concepts


def get_concept_values(user):
    concepts = Concept.objects.all()

    cache_key = 'constant_context/' + str(user.id)
    constant_context = cache.get(cache_key)
    if constant_context == None:
        constant_context = {}

        user_context_providers = get_user_context_providers()
        for provider in user_context_providers:
            context_values = provider.get_context_values(user)
            constant_context.update(context_values)

        constant_context.update(get_constant_values())
        cache.set(cache_key, constant_context)

    concept_values = constant_context

    data = {}
    data['user'] = user
    try:
        if 'twitterauth' in settings.INSTALLED_APPS:
            from twitterauth.models import TwitterUserProfile
            data['twitterauth'] = TwitterUserProfile.objects.get(user__id=user.id)
        else:
            data['twitterauth'] = None
    except Exception:
        data['twitterauth'] = None

    for concept in concepts:
        if concept.source == 'PLAT':
            concept_values[concept.concept] = get_concept_value(concept, data)

    return concept_values


def get_concepts_data(concept_values):
    concepts = Concept.objects.all()
    data = [get_concept_data(concept, concept_values) for concept in concepts]

    extra_concepts = get_extra_concepts()
    for concept in extra_concepts:
        concept['type'] = 'ECTX'
        if concept['concept'] in concept_values:
            concept['value'] = concept_values[concept['concept']]
        else:
            concept['value'] = ''
        data.append(concept)

    return data


def get_concept_data(concept, concept_values):

    cnames = ConceptName.objects.filter(concept=concept).values('name')

    data_ret = {
        'concept': concept.pk,
        'type': concept.type,
        'label': concept.label,
        'description': concept.description,
        'names': [cname['name'] for cname in cnames],
    }

    if concept.source == 'PLAT':
        if concept.concept in concept_values:
            data_ret['value'] = concept_values[concept.concept]
        else:
            data_ret['value'] = ''
    else:
        data_ret['adaptor'] = concept.adaptor

    return data_ret


# Only for extenal/constant context values (no igadget context values)
def get_concept_value(concept, data):
    res = ''

    if concept.type == 'CCTX':
        try:
            constant = Constant.objects.get(concept=concept)
            res = constant.value
        except Constant.DoesNotExist:
            pass

    elif concept.concept == 'username':
        res = data['user'].username

    elif concept.concept == 'language':
        res = get_language()

    elif concept.concept == 'twitterauth' and data['twitterauth']:
        res = "&".join(['user_screen_name=%s' % data['twitterauth'].screen_name,
            'oauth_consumer_key=%s' % getattr(settings, 'TWITTER_CONSUMER_KEY', 'YOUR_KEY'),
            'oauth_consumer_secret=%s' % getattr(settings, 'TWITTER_CONSUMER_SECRET', 'YOUR_SECRET'),
            data['twitterauth'].access_token])

    return res
