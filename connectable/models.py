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
from django.utils.translation import ugettext as _

from igadget.models import Variable
from workspace.models import WorkSpaceVariable, AbstractVariable

class Filter(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    code = models.TextField(_('Code'), blank=True, null=True)
    label = models.CharField(_('Label'), max_length=50, null=True) 
    NATURE = (
        ('NATIVE', _('Object Native')),
        ('JSLIB', _('JavaScript Lib')),
        ('USER', _('User')),
        ('PATT', _('Patterns')),
    )
    nature = models.CharField(_('Nature'), max_length=6, choices=NATURE)
    CATEGORY = (
        ('COND', _('Conditional')),
        ('TRANS', _('Transformation')),
        ('STR', _('String')),
    )
    category = models.CharField(_('Category'), max_length=6, choices=CATEGORY, null=True)
    help_text = models.TextField(_('Help text'), blank=True, null=True)
    params = models.TextField(_('Parameters'), blank=True, null=True) 

    def __unicode__(self):
        return str(self.pk) + " " + self.name

class RemoteSubscription(models.Model):

    url = models.URLField(verify_exists=False)
    
    REMOTE_OPERATION = (
        ('0', 'DISABLED'),
        ('1', 'READ'),
        ('2', 'WRITE'),
    )
    operation_code = models.CharField(_('Operation'), max_length=1, choices=REMOTE_OPERATION)
    
    def __unicode__(self):
        return self.url


class InOut(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    workspace_variable = models.ForeignKey(WorkSpaceVariable, verbose_name=_('WorkSpaceVariable'))
    friend_code = models.CharField(_('Friend code'), max_length=30, blank=True, null=True)
    filter = models.ForeignKey(Filter, verbose_name=_('Filter'), null=True)
    filter_param_values = models.TextField(_('Filter parameter values'), blank=True, null=True)
    remote_subscription = models.ForeignKey(RemoteSubscription, verbose_name=_('Subscription'), null=True)

    def __unicode__(self):
        return str(self.pk) + " " + self.name


class In(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    variable = models.ForeignKey(Variable, verbose_name=_('Variable'))  
    inouts = models.ManyToManyField(InOut, verbose_name=_('InOut'))

    def __unicode__(self):
        return str(self.pk) + " " + self.name


class Out(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))
    inouts = models.ManyToManyField(InOut, verbose_name=_('InOut'))

    def __unicode__(self):
        return str(self.pk) + " " + self.name

class RelatedInOut(models.Model):

    in_inout = models.ForeignKey(InOut, related_name='in_inouts', verbose_name=_('In InOut'))
    out_inout = models.ForeignKey(InOut, related_name='out_inouts', verbose_name=_('Out InOut'))

    def __unicode__(self):
        return str(self.pk)
