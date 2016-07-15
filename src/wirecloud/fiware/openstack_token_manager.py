# -*- coding: utf-8 -*-

# Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import requests

from wirecloud.proxy.utils import ValidationError


def first_step_openstack(url, idmtoken):
    payload = {
        "auth": {
            "identity": {
                "methods": ["oauth2"],
                "oauth2": {
                    "access_token_id": idmtoken
                }
            }
        }
    }

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    return requests.post(url, headers=headers, data=json.dumps(payload), verify=False)


def getProjects(url, generalToken, username):
    headers = {
        "X-Auth-Token": generalToken,
        "Accept": "application/json"
    }

    payload = {"user.id": username}

    return requests.get(url, headers=headers, params=payload, verify=False)


def getProjectPermissions(url, token):
    headers = {
        "X-Auth-Token": token,
        "Accept": "application/json"
    }

    return requests.get(url, headers=headers, verify=False)


def get_openstack_project_token(url, projectid, idmtoken):
    payload = {
        "auth": {
            "identity": {
                "methods": ["oauth2"],
                "oauth2": {
                    "access_token_id": idmtoken
                }
            },
            "scope": {
                "project": {
                    "id": projectid
                }
            }
        }
    }

    headers = {"Content-Type": "application/json"}

    return requests.post(url, headers=headers, data=json.dumps(payload), verify=False)


class OpenstackTokenManager(object):

    def __init__(self, url):
        super(OpenstackTokenManager, self).__init__()
        self.url = url

    def get_token(self, user, tenantid=None):
        oauth_info = user.social_auth.get(provider='fiware')
        if oauth_info.access_token is None:
            raise ValidationError("User doesn't have an access token")

        opentok = oauth_info.extra_data.get('openstack_token')
        tenantid = "__default__" if tenantid is None else tenantid
        if opentok is None or opentok.get(tenantid):
            opentok = self.get_openstack_token(user.username, oauth_info.access_token, tenantid)
            oauth_info.extra_data['openstack_token'][tenantid] = opentok
            oauth_info.save()

        return opentok

    def get_openstack_token(self, username, idmtoken, tenantid):
        # We love FIWARE process to get the token <3

        # Fist we get an initial token
        firstResponse = first_step_openstack("{}/keystone/v3/auth/tokens".format(self.url), idmtoken)
        generalToken = firstResponse.headers.get("x-subject-token")

        # Then we ask for all the projects the user have
        projectsResponse = getProjects("{}/keystone/v3/role_assignments".format(self.url), generalToken, username)
        projects = projectsResponse.json()

        for role in projects.get("role_assignments"):
            if role.get("scope") is not None and role["scope"].get("project") is not None:
                projectid = role["scope"]["project"]["id"]

                # Ask for permissions for every project
                response = getProjectPermissions("{}/keystone/v3/projects/{}".format(self.url, projectid), generalToken)
                responseJson = response.json()
                if responseJson.get("project").get("is_cloud_project") and (tenantid is "__default__" or responseJson.get("project").get("id") == tenantid):

                    # And if the project was cloud, we finally ask for the token
                    projectTokenR = get_openstack_project_token("{}/keystone/v3/auth/tokens".format(self.url), projectid, idmtoken)
                    return projectTokenR.headers.get("x-subject-token")

        # if we are here, we didn't detected any openstack token
        raise Exception
