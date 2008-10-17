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
from django.utils.translation import ugettext as _

class GadgetResource(models.Model):

     short_name = models.CharField(_('Name'), max_length=250)
     vendor= models.CharField(_('Vendor'), max_length=250)
     version = models.CharField(_('Version'), max_length=150)

     author = models.CharField(_('Author'), max_length=250)
     mail = models.CharField(_('Mail'), max_length=30)
           
     description = models.TextField(_('Description'))
     size = models.CharField(_('Size'),max_length=10, null=True)
     license = models.CharField(_('License'),max_length=20, null=True)

     gadget_uri = models.URLField(_('gadgetURI'), null=True)
     creation_date = models.DateTimeField('creation_date', null=True)
     image_uri = models.URLField(_('imageURI'), null=True)
     iphone_image_uri = models.URLField(_('iPhoneImageURI'), null=True)
     wiki_page_uri = models.URLField(_('wikiURI'))
     template_uri= models.URLField(_('templateURI'))
     mashup_id = models.URLField(_('mashupId'), null=True)

     popularity = models.DecimalField(_('popularity'), null=True, max_digits=2, decimal_places=1)

     class Meta:
         unique_together = ("short_name", "vendor", "version")

     def __unicode__(self):
         return self.short_name

class UserRelatedToGadgetResource(models.Model):
    gadget = models.ForeignKey(GadgetResource)
    user = models.ForeignKey(User)
    added_by = models.BooleanField(_('Added by'), null = True)
    preferred_by = models.BooleanField(_('Preferred by'), null = True)
    
    class Meta:
        unique_together = ("gadget", "user")

    def __unicode__(self):
        return str(self.added_by) + " " + str(self.preferred_by)


class GadgetWiring(models.Model):

     friendcode = models.CharField(_('Friend code'), max_length=30, blank=True, null=True)
     wiring  = models.CharField(_('Wiring'), max_length=5)
     idResource = models.ForeignKey(GadgetResource)

     def __unicode__(self):
         return self.friendcode

class UserTag(models.Model):

    tag = models.CharField(max_length=20)
    weight = models.CharField(max_length=20, null = True)
    criteria = models.CharField(max_length=20, null = True)
    value = models.CharField(max_length=20, null = True)
    idUser = models.ForeignKey(User)
    idResource = models.ForeignKey(GadgetResource)

    class Meta:
        unique_together = ("tag", "idUser","idResource")

    def __unicode__(self):
        return self.tag

VOTES = (
    (u'0', 0),
    (u'1', 1),
    (u'1', 2),
    (u'1', 3),
    (u'1', 4),
    (u'1', 5),
)

class UserVote(models.Model):
    """
    A vote on an GadgetResource by a User.
    """
    idUser = models.ForeignKey(User)
    idResource = models.ForeignKey(GadgetResource)
    vote = models.SmallIntegerField(choices=VOTES)

    class Meta:
        # One vote per user per object
        unique_together = (('idUser', 'idResource'),)

    def __unicode__(self):
        return u'%s: %s on %s' % (self.idUser, self.vote, self.idResource)