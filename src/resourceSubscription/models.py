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
from django.utils.translation import ugettext as  _

from catalogue.models import Application


class Contract(models.Model):

    free = models.BooleanField(_('Free'))
    #start_date = models.DateTimeField(_('Start Date'))
    #end_date = models.DateTimeField(_('End Date'), null=True, blank=True)

    times_used = models.IntegerField(_('Used times'), default=0)

    application = models.ForeignKey(Application, verbose_name=_('Application'))
    user = models.ForeignKey(User, verbose_name=_('User'))

    def get_info(self):
        return {
            "free": self.free,
            "times_used": self.times_used,
            "app_tag": self.application.tag,
            "app_code": self.application.app_code,
            "id": self.id,
            }

    def update_info(self, contract_info):
        if (not contract_info):
            return None

        if (contract_info['free']):
            self.free = contract_info['free']

        times_used = 0
        try:
            times_used = contract_info['times_used']
        except KeyError:
            pass

        self.times_used = times_used

        self.save()

        return self

    def __unicode__(self):
        return unicode(self.application) + u" - " + unicode(self.user)
