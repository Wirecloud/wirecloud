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
from django.contrib.auth.models import User, Group
from django.utils.translation import ugettext as  _

from catalogue.models import GadgetResource
from django.contrib.auth.models import User

from django.utils import simplejson

CONTRACT_STATES = (
    (u'CANCELED', 'Canceled'),
    (u'SUBSCRIBED', 'Subscribed'),
    (u'EXPIRED', 'Expired'),
)

class Contract(models.Model):
    free = models.BooleanField(_('Free'))
    #start_date = models.DateTimeField(_('Start Date'))
    #end_date = models.DateTimeField(_('End Date'), null=True, blank=True)
    
    times_used = models.IntegerField(_('Used times'), default=0)
    
    gadget_resource = models.ForeignKey(GadgetResource, verbose_name=_('Gadget Resource'))
    user = models.ForeignKey(User, verbose_name=_('User'))
    
    state = models.CharField(_('State'), choices=CONTRACT_STATES, max_length=20)
    
    def get_info(self):
        result = {}
        
        result['free'] = self.free
        result['times_used'] = self.times_used
        
        return result
    
    def update_info(self, contract_info):
        contract_info = simplejson.loads(contract_info)
        
        if (not contract_info):
            return None
        
        if (contract_info['free']):
            self.free = contract_info['free']
        
        if (contract_info['times_used']):    
            self.times_used = contract_info['times_used']
        
        self.save()
