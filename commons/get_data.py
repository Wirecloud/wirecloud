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

from django.conf import settings
from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import get_language

from connectable.models import In, Out, RelatedInOut, InOut, Filter
from context.models import Concept, ConceptName, Constant
from gadget.models import XHTML, ContextOption, UserPrefOption, Capability
from igadget.models import Variable, VariableDef, IGadget
from layout.models import ThemeBranding, TYPES, BrandingOrganization, Layout
from preferences.views import get_workspace_preference_values, get_tab_preference_values
from twitterauth.models import TwitterUserProfile
from workspace.models import Tab, WorkSpaceVariable, AbstractVariable, VariableValue, UserWorkSpace, PublishedWorkSpace
from workspace.utils import createTab

import re


def get_abstract_variable(id):
    return AbstractVariable.objects.get(id=id)


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
    data_vars = []
    for var in data_variabledef:
        tvar = var.get_translated_model()
        data_var = {}
        data_var['aspect'] = var.aspect
        data_var['name'] = var.name
        data_var['type'] = var.type
        data_var['label'] = tvar.label
        data_var['action_label'] = tvar.action_label
        data_var['description'] = tvar.description
        data_var['friend_code'] = var.friend_code
        data_var['default_value'] = tvar.default_value
        data_var['shareable'] = var.shared_var_def != None

        if var.aspect == 'PREF' and var.type == 'L':
            options = UserPrefOption.objects.filter(variableDef=var)
            value_options = []
            for option in options:
                toption = option.get_translated_model()
                value_options.append([toption.value, toption.name])
            data_var['value_options'] = value_options

        if var.aspect == 'GCTX' or var.aspect == 'ECTX':
            data_var['concept'] = var.contextoption_set.all().values('concept')[0]['concept']

        data_vars.append(data_var)

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
    workSpaceVariableDAO = inout.workspace_variable
    data_ins = get_input_data(inout=inout)
    data_outs = get_output_data(inout=inout)

    return {
        'id': inout.pk,
        'aspect': 'INOUT',
        'friend_code': inout.friend_code,
        'name': inout.name,
        'value': workSpaceVariableDAO.value,
        'variableId': workSpaceVariableDAO.id,
        'inputs': [d for d in data_ins],
        'outputs': [d for d in data_outs],
    }


def get_filter_data(filter_):
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
        'active': user_workspace.active,
    }


def get_workspace_variables_data(workSpaceDAO, user):
    tab_variables = WorkSpaceVariable.objects.filter(workspace=workSpaceDAO, aspect='TAB')
    ws_variables_data = [get_workspace_variable_data(d, user, workSpaceDAO) for d in tab_variables]

    inout_variables = WorkSpaceVariable.objects.filter(workspace=workSpaceDAO, aspect='CHANNEL')
    ws_inout_variables_data = [get_workspace_variable_data(d, user, workSpaceDAO) for d in inout_variables]

    for inout in ws_inout_variables_data:
        ws_variables_data.append(inout)

    return ws_variables_data


def get_workspace_variable_data(wvariable, user, workspace):
    abstract_var = wvariable.abstract_variable

    data_ret = {
        'id': wvariable.id,
        'name': abstract_var.name,
        'abstract_var_id': wvariable.abstract_variable.id,
        'aspect': wvariable.aspect,
        'type': wvariable.type,
    }

    try:
        variable_value = VariableValue.objects.get(abstract_variable=abstract_var, user=user)
    except VariableValue.DoesNotExist:
        from workspace.views import clone_original_variable_value

        variable_value = clone_original_variable_value(abstract_var, workspace.creator, user)

    data_ret['value'] = variable_value.value

    if wvariable.aspect == 'TAB':
        connectable = Out.objects.get(abstract_variable=abstract_var)
        data_ret['tab_id'] = Tab.objects.filter(abstract_variable=abstract_var)[0].id
    elif wvariable.aspect == 'CHANNEL':
        connectable = InOut.objects.get(workspace_variable=wvariable)

    data_ret['connectable'] = get_connectable_data(connectable)

    return data_ret


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

    res_data['id'] = connectable.id
    res_data['name'] = connectable.name

    if isinstance(connectable, InOut):
        connectable_type = "inout"
        ws_var_id = connectable.workspace_variable.id
        ig_var_id = None

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

        #Locating the filter linked to this conectable!
        res_data['filter'] = connectable.filter_id
        res_data['filter_params'] = connectable.filter_param_values

        #RemoteChannel data
        res_data['remote_subscription'] = get_remote_subscription_data(connectable)

        #ReadOnly data
        res_data['readOnly'] = connectable.readOnly

    elif isinstance(connectable, Out):
        connectable_type = "out"

        #Checking asbtract_variable aspect
        if (connectable.abstract_variable.type == "IGADGET"):
            #It's a Gadget Variable!
            ig_var_id = Variable.objects.get(abstract_variable=connectable.abstract_variable).id
            ws_var_id = None
        elif (connectable.abstract_variable.type == "WORKSPACE"):
            #It's a Workspace Variable!
            ws_var_id = WorkSpaceVariable.objects.get(abstract_variable=connectable.abstract_variable).id
            ig_var_id = None

    elif isinstance(connectable, In):
        connectable_type = "in"
        ig_var_id = connectable.variable.id
        ws_var_id = None

    res_data['connectable_type'] = connectable_type
    res_data['ig_var_id'] = ig_var_id
    res_data['ws_var_id'] = ws_var_id

    return res_data


class TemplateValueProcessor:

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
        return re.sub(r'(%+)\(([a-zA-Z]\w*(?:\.[a-zA-Z]\w*)*)\)', self.__repl, value)


def process_forced_values(workspace, user, concept_values, workspace_data):
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
        if param in workspace_data['preferences']:
            param_values[param] = workspace_data['preferences'][param]['value']
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


def get_global_workspace_data(workSpaceDAO, user):
    data_ret = {}
    data_ret['workspace'] = get_workspace_data(workSpaceDAO, user)

    # Context information
    concepts = Concept.objects.all()
    concept_values = get_concept_values(user)
    data_ret['workspace']['concepts'] = [get_concept_data(concept, concept_values) for concept in concepts]

    # Workspace preferences
    data_ret['workspace']['preferences'] = get_workspace_preference_values(workSpaceDAO.pk)

    # Process forced variable values
    forced_values = process_forced_values(workSpaceDAO, user, concept_values, data_ret['workspace'])
    data_ret['workspace']['empty_params'] = forced_values['empty_params']
    data_ret['workspace']['extra_prefs'] = forced_values['extra_prefs']
    if len(forced_values['empty_params']) > 0:
        return data_ret

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
        tab, _junk = createTab('MyTab', user, workSpaceDAO)
        tabs = [tab]

    tabs_data = [get_tab_data(tab) for tab in tabs]
    data_ret['workspace']['tabList'] = tabs_data

    for tab in tabs_data:
        tab_pk = tab['id']
        igadgets = IGadget.objects.filter(tab__id=tab_pk).order_by('id')

        igadget_data = []
        for igadget in igadgets:
            igadget_forced_values = {}
            key = str(igadget.id)
            if 'igadget' in forced_values and key in forced_values['igadget']:
                igadget_forced_values = forced_values['igadget'][key]
            igadget_data.append(get_igadget_data(igadget, user, workSpaceDAO, igadget_forced_values))

        tab['igadgetList'] = igadget_data

    #WorkSpace variables processing
    workspace_variables_data = get_workspace_variables_data(workSpaceDAO, user)
    data_ret['workspace']['workSpaceVariableList'] = workspace_variables_data

    # Filter information
    filters = Filter.objects.all()
    data_ret['workspace']['filters'] = [get_filter_data(f) for f in filters]

    #Branding information
    data_ret["workspace"]["branding"] = get_workspace_branding_data(workSpaceDAO, user)

    # Params
    last_published_workspace = PublishedWorkSpace.objects.filter(workspace=workSpaceDAO).order_by('-pk')
    if len(last_published_workspace) > 0:
        data_ret["workspace"]["params"] = simplejson.loads(last_published_workspace[0].params)

    return data_ret


def get_tab_data(tab):
    return {
        'id': tab.id,
        'name': tab.name,
        'visible': tab.visible,
        'preferences': get_tab_preference_values(tab),
    }


def get_igadget_data(igadget, user, workspace, igadget_forced_values={}):

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

    variables = Variable.objects.filter(igadget=igadget)
    data_ret['variables'] = [get_variable_data(variable, user, workspace, igadget_forced_values) for variable in variables]

    return data_ret


def get_variable_data(variable, user, workspace, forced_values={}):

    var_def = variable.vardef
    trans_var_def = var_def.get_translated_model()

    data_ret = {
        'id': variable.id,
        'aspect': var_def.aspect,
        'type': var_def.type,
        'igadgetId': variable.igadget.id,
        'vardefId': var_def.pk,
        'name': var_def.name,
        'label': trans_var_def.label,
        'action_label': trans_var_def.action_label,
        'friend_code': var_def.friend_code,
    }

    # Variable info is splited into 2 entities: AbstractVariable and Variable
    abstract_var = variable.abstract_variable

    if variable.vardef.name in forced_values:
        data_ret['value'] = forced_values[variable.vardef.name]['value']
        data_ret['readOnly'] = True
        if var_def.aspect == 'PREF':
            data_ret['hidden'] = forced_values[variable.vardef.name]['hidden']
    else:
        data_ret[''] = 'normal'
        try:
            data_ret['value'] = VariableValue.objects.get(abstract_variable=abstract_var, user=user).value
        except VariableValue.DoesNotExist:
            from workspace.views import clone_original_variable_value

            data_ret['value'] = clone_original_variable_value(abstract_var, workspace.creator, user).value

    if var_def.shared_var_def:
        data_ret['shared'] = data_ret['value'].shared_var_value != None

    # Context management
    if var_def.aspect == 'GCTX' or var_def.aspect == 'ECTX':
        context = ContextOption.objects.get(varDef=variable.vardef)
        data_ret['concept'] = context.concept

    # Connectable management
    # Only SLOTs and EVENTs
    connectable = False
    if var_def.aspect == 'SLOT':
        try:
            connectable = Out.objects.get(abstract_variable=abstract_var)
        except Out.DoesNotExist:
            connectable = Out.objects.create(abstract_variable=abstract_var, name=var_def.name)
    if var_def.aspect == 'EVEN':
        try:
            connectable = In.objects.get(variable=variable)
        except In.DoesNotExist:
            connectable = In.objects.create(variable=variable, name=var_def.name)

    if connectable:
        connectable_data = get_connectable_data(connectable)
        data_ret['connectable'] = connectable_data

    return data_ret


def get_constant_values():
    res = {}

    constants = Constant.objects.all()
    for constant in constants:
        res[constant.concept.concept] = constant.value

    return res


def get_concept_values(user):
    concepts = Concept.objects.all()

    concept_values = get_constant_values()
    data = {}
    data['user'] = user
    try:
        if 'twitterauth' in settings.INSTALLED_APPS:
            data['twitterauth'] = TwitterUserProfile.objects.get(user__id=user.id)
        else:
            data['twitterauth'] = None
    except Exception:
        data['twitterauth'] = None

    for concept in concepts:
        if concept.source == 'PLAT':
            concept_values[concept.concept] = get_concept_value(concept, data)

    return concept_values


def get_concept_data(concept, concept_values):

    cnames = ConceptName.objects.filter(concept=concept).values('name')

    data_ret = {
        'concept': concept.pk,
        'type': concept.type,
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


def get_workspace_branding_data(workspace, user):
    ws_type = TYPES[1][0]
    branding = None

    #Get the Branding object
    if workspace:
        branding = workspace.branding
    if not branding:
        #get the organization branding
        orgs = Group.objects.filter(user=user)
        for org in orgs:
            try:
                branding = BrandingOrganization.objects.filter(type=ws_type, organization=org)[0].branding
                break
            except:
                pass
    if not branding:
        #get the default branding
        current_theme = Layout.objects.get(name=settings.LAYOUT).theme
        branding = ThemeBranding.objects.get(theme=current_theme, type=ws_type).branding

    # Format branding response
    return get_branding_response(branding)


def get_catalogue_branding_data(user):
    branding = None
    catalogue_type = TYPES[0][0]

    # Get the Branding object
    #get the organization branding
    orgs = Group.objects.filter(user=user)
    for org in orgs:
        try:
            branding = BrandingOrganization.objects.filter(type=catalogue_type, organization=org)[0].branding
            break
        except:
            pass
    if not branding:
        #get the default branding
        current_theme = Layout.objects.get(name=settings.LAYOUT).theme
        branding = ThemeBranding.objects.get(theme=current_theme, type=catalogue_type).branding

    # Format branding response
    return get_branding_response(branding)


def get_branding_response(branding):
    data_ret = {}
    elements = simplejson.loads(Layout.objects.get(name=settings.LAYOUT).elements)

    data_ret["logo"] = {}
    data_ret["logo"]["url"] = branding.logo
    data_ret["logo"]["class"] = elements["logo"]
    data_ret["viewer_logo"] = {}
    data_ret["viewer_logo"]["url"] = branding.viewer_logo
    data_ret["viewer_logo"]["class"] = elements["viewer_logo"]
    if branding.link:
        data_ret["link"] = branding.link
    return data_ret
