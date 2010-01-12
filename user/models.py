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

from django.db import models
from django.contrib.auth.models import User

from django.utils.translation import get_language, ugettext as _
from commons import utils
from django.utils import simplejson 


class UserProfile(models.Model):
    user = models.ForeignKey(User, unique=True)
    
    load_script = models.TextField(_('load_script'), blank=True, null=True)
    
    def execute_server_script(self, request):
        script = simplejson.loads(self.load_script)
        
        for command in script: 
            if (not command.has_key('command')):
                # Bad-formed command!
                continue
            
            if (command['command'] == 'change_language'):
                utils.change_language(request, command['language'])
                continue
    
    def merge_client_scripts(self, script):
        extra_script = simplejson.loads(script)
        
        if (len(extra_script) == 0):
            return  self.load_script
        
        stored_script = simplejson.loads(self.load_script)
        for command in extra_script:
            stored_script.append(command)
            
        #It's not saved! "script" variable is passed when needed and not should be saved in the UserProfile
        
        return simplejson.dumps(stored_script)
    
    def create_load_script(self, profile):
        profile = simplejson.loads(profile)
        script = []
        
        if (profile.has_key('theme')):
            command = {}
            command["command"]="change_theme"
            command["theme"]=profile["theme"]
            
            script.append(command)
        
        if (profile.has_key('localeLanguage')):
            command = {}
            command["command"]="change_language"
            command["language"]=profile["localeLanguage"]
            
            script.append(command)
            
        self.load_script = simplejson.dumps(script)
        self.save()