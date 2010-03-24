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
from django.conf import settings

from django.utils.translation import get_language, ugettext as _
from django.utils import simplejson

from django.core.exceptions import ObjectDoesNotExist

###### Translation Section ######
from commons.translation_utils import get_trans_index
class TransModel(models.Model):
    
    def __getattribute__(self, attr):
        language_ = get_language()[:2]
        value = object.__getattribute__(self, attr)
        index = get_trans_index(value)
        if index:
            # retrieve the translation
            try:
                id_ = object.__getattribute__(self, "id")
                table_ = object.__getattribute__(self, "__class__").__module__+"."+object.__getattribute__(self, "__class__").__name__
                attr_trans = Translation.objects.filter(text_id=index,element_id=id_, table=table_, language=language_)
                if (attr_trans.count() > 0):
                    return attr_trans[0].value
                else:
                    #get the default value
                    attr_trans = Translation.objects.filter(text_id=index, element_id=id_, table=table_, default=True)
                    if (attr_trans.count() > 0):
                        return attr_trans[0].value
                    # there isn't a default value -> it musn't be possible because it is ensured during the template parser 
                    return value
            except ObjectDoesNotExist, e:
                # this attribute doesn't exist
                raise AttributeError
        else:
             # the element don't need to be translated
             return value
    
    class Meta:
        abstract = True
            

class Translation(models.Model):
    text_id = models.CharField(_('Text Identifier'), max_length=250)
    element_id = models.IntegerField(_('Object Identifier'))
    table = models.CharField(_('Model'), max_length=250)
    language = models.CharField(_('Language'), choices=settings.LANGUAGES, max_length=2)
    value = models.TextField(_('Value'), null=True)
    default = models.BooleanField(_('Default Value'), default=False)
    
    def __unicode__(self):
         return self.text_id + " - " + self.table + "." + str(self.element_id) + " -> " + self.language

###### Catalogue section ######
            
class GadgetResource(TransModel):

     short_name = models.CharField(_('Name'), max_length=250)
     display_name = models.CharField(_('Display Name'), max_length=250, null=True, blank=True)
     vendor= models.CharField(_('Vendor'), max_length=250)
     version = models.CharField(_('Version'), max_length=150)

     author = models.CharField(_('Author'), max_length=250)
     mail = models.CharField(_('Mail'), max_length=100)

     #Person how added the resource to catalogue!
     creator = models.ForeignKey(User, null=True, blank=True)

     description = models.TextField(_('Description'))
     size = models.CharField(_('Size'),max_length=10, null=True, blank=True)
     license = models.CharField(_('License'),max_length=20, null=True, blank=True)

     gadget_uri = models.URLField(_('gadgetURI'), null=True, blank=True)
     creation_date = models.DateTimeField('creation_date', null=True)
     image_uri = models.URLField(_('imageURI'), null=True)
     iphone_image_uri = models.URLField(_('iPhoneImageURI'), null=True, blank=True)
     wiki_page_uri = models.URLField(_('wikiURI'), verify_exists=False)
     template_uri= models.URLField(_('templateURI'))
     mashup_id = models.IntegerField(_('mashupId'), null=True, blank=True)

     #For implementing "private gadgets" only visible for users that belongs to some concrete organizations
     organization = models.ManyToManyField(Group, related_name='organization', null=True, blank=True)

     #Certification status
     #Done via User groups!
     certification = models.ForeignKey(Group, related_name='certification', null=True, blank=True)

     popularity = models.DecimalField(_('popularity'), null=True, max_digits=2, decimal_places=1)
     fromWGT = models.BooleanField(_('fromWGT'), default=False)

     def resource_type(self):
         if (self.mashup_id):
            return 'mashup'
        
         return 'gadget'

     class Meta:
         unique_together = ("short_name", "vendor", "version")

     def __unicode__(self):
         return self.short_name
     
class Capability(models.Model):
    name = models.CharField(_('Name'), max_length=50)
    value = models.CharField(_('Value'), max_length=50)
    resource = models.ForeignKey(GadgetResource)
    
    class Meta:
        unique_together = ('name', 'value', 'resource')
        
    def __unicode__(self):
        return self.name
        

class UserRelatedToGadgetResource(models.Model):
    gadget = models.ForeignKey(GadgetResource)
    user = models.ForeignKey(User)
    added_by = models.NullBooleanField(_('Added by'), null = True)
    preferred_by = models.NullBooleanField(_('Preferred by'), null = True)
    
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

class Tag(models.Model):

    name = models.CharField(max_length=20, unique = True)
    
    def __unicode__(self):
        return self.name

class UserTag(models.Model):

    tag = models.ForeignKey(Tag)
    weight = models.CharField(max_length=20, null = True)
    criteria = models.CharField(max_length=20, null = True)
    value = models.CharField(max_length=20, null = True)
    idUser = models.ForeignKey(User)
    idResource = models.ForeignKey(GadgetResource)

    class Meta:
        unique_together = ("tag", "idUser","idResource")

    #def __unicode__(self):
    #   return self.tag
    
class Category(TransModel):
    name = models.CharField(max_length=50, unique = True)
    tags = models.ManyToManyField(Tag)
    parent = models.ForeignKey('self', blank=True, null = True)
    organizations = models.ManyToManyField(Group, related_name='organizations', null=True, blank=True)

    def __unicode__(self):
        return self.name

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

###### MarketPlace section ######

class Application(TransModel):
    resources = models.ManyToManyField(GadgetResource, related_name='resources', null=True, blank=True)
    tag = models.ForeignKey(Tag, verbose_name=_('Tag'))
    app_code = models.IntegerField(_('application_code'), primary_key=True)
    template_uri = models.URLField(_('templateURI'), null=True, blank=True)
    
    name = models.CharField(_('Name'), max_length=250)
    short_name = models.CharField(_('Shortname'), max_length=100)
    description = models.TextField(_('Description'))
    image_uri = models.URLField(_('imageURI'), null=True)
    vendor = models.CharField(_('Vendor'), max_length=250)
    
    subscription_price = models.CharField(_('Subscription Price'), max_length=100)
    monthly_price = models.CharField(_('Monthly Price'), max_length=100)
    
    def get_gadget_list(self):
        gadget_list = ""
        
        gadgets = self.resources.all().order_by( 'short_name' )
        for gadget in gadgets:
            if (gadget_list):
                gadget_list += ','
            
            gadget_signature = "%s %s" % (gadget.short_name, gadget.version)
            
            gadget_list += gadget_signature
        
        return gadget_list
    
    def get_info(self):
        result = {}
        
        result["gadget_list"] = self.get_gadget_list()
        result["app_code"] = self.app_code
        result["name"] = self.name
        result["short_name"] = self.short_name
        result["description"] = self.description
        result["image_uri"] = self.image_uri
        result["vendor"] = self.vendor
        result["template_uri"] = self.template_uri
        result["subscription_price"] = self.subscription_price
        result["monthly_price"] = self.monthly_price
        
        return result
    
    def add_resource(self, resource):
        self.resources.add(resource)
        self.save()
        
        user_tag, created = UserTag.objects.get_or_create(idUser=resource.creator, idResource=resource, tag=self.tag)
        user_tag.save()

    def remove_resource(self, resource):
        self.resources.remove(resource)
        self.save()
        
        usertags = UserTag.objects.filter(idResource=resource)
        for utag in usertags:
            if (utag.tag.name == self.tag.name):
                utag.delete()
                utag.save()
    
    def __unicode__(self):
        return unicode(self.tag)
