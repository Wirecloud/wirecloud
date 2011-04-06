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

from django.contrib.auth.models import User, Group
from django.db import models
from django.utils.translation import ugettext as  _


TYPES = (
        ('catalogue', _('Catalogue')),
        ('workspace', _('Workspace')),
    )


class Branding(models.Model):
    logo = models.CharField(_('Logo data'), max_length=500, blank=True, null=True)
    viewer_logo = models.CharField(_('Viewer logo data'), max_length=500, blank=True, null=True)
    link = models.URLField(_('Logo Link'), max_length=500, blank=True, null=True)

    def __unicode__(self):
        return unicode(self.id)


class Theme(models.Model):

    name = models.CharField(_('Name'), max_length=250, unique=True)
    theme_css = models.TextField(_('Theme css'))
    images = models.TextField(_('Images definition'))
    default_brandings = models.ManyToManyField(Branding, through="ThemeBranding", blank=True, null=True)

    def __unicode__(self):
        return self.name


class Layout(models.Model):

    name = models.CharField(_('Name'), max_length=250, unique=True)
    templates = models.TextField(_('templates'))
    elements = models.TextField(_('configurable elements'))
    layout_css = models.TextField(_('layout css'))
    theme = models.ForeignKey(Theme)

    def __unicode__(self):
        return self.name


class SkinTemplate(models.Model):

    properties = models.TextField(_('css default properties'))
    type = models.CharField(_('Type'), max_length=25, choices=TYPES)
    layout = models.ForeignKey(Layout, verbose_name=_('Layout for the skin template'), blank=True, null=True)
    template_file = models.CharField(_('template file'), max_length=25)

    def __unicode__(self):
        return unicode(self.layout) + u"-" + self.type


class Skin(models.Model):
    name = models.CharField(_('Name'), max_length=250)
    creator = models.ForeignKey(User, blank=True, null=True)
    properties = models.TextField(_('css properties'))
    skin_template = models.ForeignKey(SkinTemplate)
    layout = models.ForeignKey(Layout, blank=True, null=True)
    default = models.BooleanField(_('Is this the default Skin for the Layout?'), default=False)

    class Meta:
        unique_together = ('name', 'layout')

    def __unicode__(self):
        return u"'%s' skin for '%s' layout" % (self.name, unicode(self.layout))


class ThemeBranding(models.Model):
    theme = models.ForeignKey(Theme)
    branding = models.ForeignKey(Branding)
    type = models.CharField(_('Type'), max_length=25, choices=TYPES)

    class Meta:
        unique_together = ('theme', 'branding', 'type')

    def __unicode__(self):
        return u"Branding '%s' for '%s' theme. Type: %s" % (
            unicode(self.branding), unicode(self.theme), unicode(self.type))


class SkinOrganization(models.Model):
    skin = models.ForeignKey(Skin)
    organization = models.ForeignKey(Group)
    type = models.CharField(_('Type'), max_length=25, choices=TYPES)

    class Meta:
        unique_together = ('skin', 'organization', 'type')


class BrandingOrganization(models.Model):
    branding = models.ForeignKey(Branding)
    organization = models.ForeignKey(Group)
    type = models.CharField(_('Type'), max_length=25, choices=TYPES)

    class Meta:
        unique_together = ('branding', 'organization', 'type')
