# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import json
import jsonpatch
import re

from django.core.cache import cache
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from copy import deepcopy

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import CacheableData
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_absolute_reverse_url, get_current_domain, consumes, parse_json_request
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.platform.models import Workspace
from wirecloud.platform.workspace.utils import encrypt_value, VariableValueCacheManager
from wirecloud.platform.wiring.utils import generate_xhtml_operator_code, get_operator_cache_key


class WiringEntry(Resource):

    # Build multiuser structure with the new value, keeping the other users values
    def handleMultiuser(self, request, secure, new_variable, old_variable):
        if secure:
            new_value = encrypt_value(new_variable["value"])
        else:
            new_value = new_variable["value"]

        new_variable = deepcopy(old_variable)

        new_variable["value"]["users"]["%s" % request.user.id] = new_value
        return new_variable

    # Checks if two objects are the same
    def checkSameWiring(self, object1, object2):
        if len(object1.keys()) != len(object2.keys()):
            return False
        for key in set(object1.keys()):
            if key == "value":
                pass
            elif isinstance(object1[key], dict):
                if not self.checkSameWiring(object1[key], object2[key]):
                    return False
            else:
                if not object1[key] == object2[key]:
                    return False

        return True

    def checkMultiuserWiring(self, request, new_wiring_status, old_wiring_status, owner, can_update_secure=False):
        if not self.checkSameWiring(new_wiring_status, old_wiring_status):
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        for operator_id, operator in new_wiring_status['operators'].items():
            old_operator = old_wiring_status['operators'][operator_id]

            vendor, name, version = operator["name"].split("/")
            try:
                resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info(process_variables=True)
                operator_preferences = resource["variables"]["preferences"]
                operator_properties = resource["variables"]["properties"]
            except CatalogueResource.DoesNotExist:
                # Missing operator variables can't be updated
                operator['properties'] = old_operator["properties"]
                operator['preferences'] = old_operator["preferences"]
                continue

            # Check preferences
            for preference_name in operator['preferences']:
                old_preference = old_operator['preferences'][preference_name]
                new_preference = operator['preferences'][preference_name]

                if preference_name in operator_preferences:
                    pref = operator_preferences[preference_name]
                    preference_secure = pref.get("secure", False)
                else:
                    preference_secure = False

                # Only multiuser variables can can be updated
                if not preference_secure or can_update_secure:
                    if old_preference != new_preference and old_preference["value"]["users"]["%s" % owner.id] != new_preference["value"]:
                        return build_error_response(request, 403, _('You are not allowed to update this workspace'))

                operator['preferences'][preference_name] = old_preference

            # Check properties
            for property_name in operator['properties']:
                old_property = old_operator['properties'][property_name]
                new_property = operator['properties'][property_name]

                # Check if its multiuser
                if property_name in operator_properties:
                    prop = operator_properties[property_name]
                    property_secure = prop.get("secure", False)
                    property_multiuser = prop.get("multiuser", False)
                else:
                    property_secure = False
                    property_multiuser = False

                # Update variable value
                if property_secure and not can_update_secure:
                    new_property["value"] = old_property["value"]
                else:
                    if new_property.get('readonly', False) and new_property.get('value') != old_property.get('value'):
                        return build_error_response(request, 403, _('Read only properties cannot be updated'))
                    # Variables can only be updated if multisuer
                    if not property_multiuser:
                        if old_property != new_property and old_property["value"]["users"]["%s" % owner.id] != new_property["value"]:
                            return build_error_response(request, 403, _('You are not allowed to update this workspace'))
                        else:
                            new_property["value"] = old_property["value"]
                    else:
                        # Handle multiuser
                        try:
                            if new_property["value"].get("users", None) is not None:
                                value = new_property["value"]["users"].get(request.user.id, None)
                                if value is not None:
                                    new_property["value"] = value
                                else:
                                    new_property = old_property
                                    continue
                        except:
                            pass
                        new_property = self.handleMultiuser(request, property_secure, new_property, old_property)

                operator['properties'][property_name] = new_property

        return True

    def checkWiring(self, request, new_wiring_status, old_wiring_status, can_update_secure=False):
        # Check read only connections
        old_read_only_connections = [connection for connection in old_wiring_status['connections'] if connection.get('readonly', False)]
        new_read_only_connections = [connection for connection in new_wiring_status['connections'] if connection.get('readonly', False)]

        if len(old_read_only_connections) > len(new_read_only_connections):
            return build_error_response(request, 403, _('You are not allowed to remove or update read only connections'))

        for connection in old_read_only_connections:
            if connection not in new_read_only_connections:
                return build_error_response(request, 403, _('You are not allowed to remove or update read only connections'))

        # Check operator preferences and properties
        for operator_id, operator in new_wiring_status['operators'].items():
            old_operator = None
            if operator_id in old_wiring_status['operators']:
                old_operator = old_wiring_status['operators'][operator_id]
                added_preferences = set(operator['preferences'].keys()) - set(old_operator['preferences'].keys())
                removed_preferences = set(old_operator['preferences'].keys()) - set(operator['preferences'].keys())
                updated_preferences = set(operator['preferences'].keys()).intersection(old_operator['preferences'].keys())

                added_properties = set(operator.get('properties', {}).keys()) - set(old_operator['properties'].keys())
                removed_properties = set(old_operator['properties'].keys()) - set(operator.get('properties', {}).keys())
                updated_properties = set(operator.get('properties', {}).keys()).intersection(old_operator['properties'].keys())
            else:
                # New operator
                added_preferences = operator['preferences'].keys()
                removed_preferences = ()
                updated_preferences = ()
                added_properties = operator['properties'].keys()
                removed_properties = ()
                updated_properties = ()

            try:
                vendor, name, version = operator["name"].split("/")
                resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info(process_variables=True)
                operator_preferences = resource["variables"]["preferences"]
                operator_properties = resource["variables"]["properties"]
            except CatalogueResource.DoesNotExist:
                # Missing operator variables can't be updated
                operator['properties'] = old_operator["properties"]
                operator['preferences'] = old_operator["preferences"]
                continue

            # Handle preferences
            for preference_name in added_preferences:
                if operator['preferences'][preference_name].get('readonly', False) or operator['preferences'][preference_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden preferences cannot be created using this API'))

                # Handle multiuser
                new_preference = operator['preferences'][preference_name]
                preference_secure = operator_preferences.get(preference_name, {}).get("secure", False)
                if preference_secure:
                    new_value = encrypt_value(new_preference["value"])
                else:
                    new_value = new_preference["value"]
                new_preference["value"] = {"users": {"%s" % request.user.id: new_value}}
                operator['preferences'][preference_name] = new_preference

            for preference_name in removed_preferences:
                if old_operator['preferences'][preference_name].get('readonly', False) or old_operator['preferences'][preference_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden preferences cannot be removed'))

            for preference_name in updated_preferences:
                old_preference = old_operator['preferences'][preference_name]
                new_preference = operator['preferences'][preference_name]
                # Using patch means no change at all on non-modified preferences
                if old_preference == new_preference:
                    continue

                # Check if its multiuser
                preference_secure = operator_preferences.get(preference_name, {}).get("secure", False)

                if old_preference.get('readonly', False) != new_preference.get('readonly', False) or old_preference.get('hidden', False) != new_preference.get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden status cannot be changed using this API'))

                if new_preference.get('readonly', False) and new_preference.get('value') != old_preference.get('value'):
                    return build_error_response(request, 403, _('Read only preferences cannot be updated'))

                if preference_secure and not can_update_secure:
                    new_preference["value"] = old_preference["value"]
                else:
                    # Handle multiuser
                    new_preference = self.handleMultiuser(request, preference_secure, new_preference, old_preference)
                operator['preferences'][preference_name] = new_preference

            # Handle properties
            for property_name in added_properties:
                if operator['properties'][property_name].get('readonly', False) or operator['properties'][property_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden properties cannot be created using this API'))

                # Handle multiuser
                new_property = operator['properties'][property_name]
                new_property["value"] = {"users": {"%s" % request.user.id: new_property["value"]}}
                operator['properties'][property_name] = new_property

            for property_name in removed_properties:
                if old_operator['properties'][property_name].get('readonly', False) or old_operator['properties'][property_name].get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden properties cannot be removed'))

            for property_name in updated_properties:
                old_property = old_operator['properties'][property_name]
                new_property = operator['properties'][property_name]
                # Using patch means no change at all on non-modified properties
                if old_property == new_property:
                    continue

                # Check if its multiuser
                if property_name in operator_properties:
                    prop = operator_properties[property_name]
                    property_secure = prop.get("secure", False)
                else:
                    property_secure = False
                if old_property.get('readonly', False) != new_property.get('readonly', False) or old_property.get('hidden', False) != new_property.get('hidden', False):
                    return build_error_response(request, 403, _('Read only and hidden status cannot be changed using this API'))

                if new_property.get('readonly', False) and new_property.get('value') != old_property.get('value'):
                    return build_error_response(request, 403, _('Read only properties cannot be updated'))

                if property_secure and not can_update_secure:
                    new_property["value"] = old_property["value"]
                else:
                    # Handle multiuser
                    new_property = self.handleMultiuser(request, property_secure, new_property, old_property)
                operator['properties'][property_name] = new_property

        return True

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        new_wiring_status = parse_json_request(request)
        old_wiring_status = workspace.wiringStatus

        if workspace.creator == request.user or request.user.is_superuser:
            result = self.checkWiring(request, new_wiring_status, old_wiring_status, can_update_secure=False)
        elif workspace.is_available_for(request.user):
            result = self.checkMultiuserWiring(request, new_wiring_status, old_wiring_status, workspace.creator, can_update_secure=False)
        else:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        if result is not True:
            return result

        workspace.wiringStatus = new_wiring_status
        workspace.save()

        return HttpResponse(status=204)

    @authentication_required
    @consumes(('application/json-patch+json',))
    @commit_on_http_success
    def patch(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        old_wiring_status = workspace.wiringStatus

        req = parse_json_request(request)

        # Cant explicitly update missing operator preferences / properties
        # Check if its modifying directly a preference / property
        regex = re.compile(r'^/?operators/(?P<operator_id>[0-9]+)/(preferences/|properties/)', re.S)
        for p in req:
            try:
                if p["op"] is "test":
                    continue
            except:
                return build_error_response(request, 400, _('Invalid JSON patch'))

            result = regex.match(p["path"])
            if result is not None:

                try:
                    vendor, name, version = workspace.wiringStatus["operators"][result.group("operator_id")]["name"].split("/")
                except:
                    raise Http404

                # If the operator is missing -> 403
                try:
                    CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
                except:
                    return build_error_response(request, 403, _('Missing operators variables cannot be updated'))

        try:
            new_wiring_status = jsonpatch.apply_patch(old_wiring_status, req)
        except jsonpatch.JsonPointerException:
            return build_error_response(request, 422, _('Failed to apply patch'))
        except jsonpatch.InvalidJsonPatch:
            return build_error_response(request, 400, _('Invalid JSON patch'))

        if workspace.creator == request.user or request.user.is_superuser:
            result = self.checkWiring(request, new_wiring_status, old_wiring_status, can_update_secure=True)
        elif workspace.is_available_for(request.user):
            result = self.checkMultiuserWiring(request, new_wiring_status, old_wiring_status, workspace.creator, can_update_secure=True)
        else:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        if result is not True:
            return result
        workspace.wiringStatus = new_wiring_status
        workspace.save()

        return HttpResponse(status=204)


def process_requirements(requirements):

    return dict((requirement['name'], {}) for requirement in requirements)


class OperatorEntry(Resource):

    def read(self, request, vendor, name, version):

        operator = get_object_or_404(CatalogueResource, type=2, vendor=vendor, short_name=name, version=version)
        # For now, all operators are freely accessible/distributable
        # if not operator.is_available_for(request.user):
        #    return HttpResponseForbidden()

        mode = request.GET.get('mode', 'classic')

        key = get_operator_cache_key(operator, get_current_domain(request), mode)
        cached_response = cache.get(key)
        if cached_response is None:
            options = operator.json_description
            js_files = options['js_files']

            base_url = get_absolute_reverse_url('wirecloud.showcase_media', kwargs={
                'vendor': operator.vendor,
                'name': operator.short_name,
                'version': operator.version,
                'file_path': operator.template_uri
            }, request=request)

            xhtml = generate_xhtml_operator_code(js_files, base_url, request, process_requirements(options['requirements']), mode)
            cache_timeout = 31536000  # 1 year
            cached_response = CacheableData(xhtml, timeout=cache_timeout, content_type='application/xhtml+xml; charset=UTF-8')

            cache.set(key, cached_response, cache_timeout)

        return cached_response.get_response()


class OperatorVariablesEntry(Resource):

    @authentication_required
    def read(self, request, workspace_id, operator_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        if not workspace.is_available_for(request.user):
            return build_error_response(request, 403, _("You don't have permission to access this workspace"))

        cache_manager = VariableValueCacheManager(workspace, request.user)

        try:
            operator = workspace.wiringStatus["operators"][operator_id]
            vendor, name, version = operator["name"].split("/")
        except:
            raise Http404

        # Check if operator resource exists
        try:
            resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
            # Check if the resource is available, if not, variables should not be retrieved
            if not resource.is_available_for(workspace.creator):
                raise CatalogueResource.DoesNotExist
        except CatalogueResource.DoesNotExist:
            return HttpResponse(json.dumps({"preferences": {}, "properties": {}}), content_type='application/json; charset=UTF-8')

        data = {
            "preferences": {},
            "properties": {},
        }

        for preference_name, preference in operator.get('preferences', {}).items():
            data["preferences"][preference_name] = cache_manager.get_variable_data("ioperator", operator_id, preference_name)

        for property_name, prop in operator.get('properties', {}).items():
            data["properties"][property_name] = cache_manager.get_variable_data("ioperator", operator_id, property_name)

        return HttpResponse(json.dumps(data, sort_keys=True), content_type='application/json; charset=UTF-8')
