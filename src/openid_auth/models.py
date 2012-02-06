# (c) Copyright 2007 Thomas Bohmbach, Jr.  All Rights Reserved. 
#
# See the LICENSE file that should have been included with this distribution
# for more specific information.

from django.contrib.auth.models import User
from django.db import models
from django.db import IntegrityError
from django.db import transaction
import re


class UserOpenID(models.Model):
    """
    Associates an openid (URL) to a user object
    """
    user = models.ForeignKey(User, related_name="openids")
    openid_url = models.URLField(unique=True)
    
    class Admin:
        search_fields = ['user']
        list_display = ('user', 'openid_url')


class OpenIDBackend:
    """
    Authenticate against models.UserOpenID
    """
    @transaction.commit_manually
    def authenticate(self, openid_url=None, sreg=None):
        if openid_url:
            try:
                user_openid = UserOpenID.objects.get(openid_url=openid_url)
                return user_openid.user
            except UserOpenID.DoesNotExist:
                #let's prepare a secondary name using the openid_url in case we cannot use the user name
                #given by the OpenID server
                #the username is only used to create the User object in the database
                #it isn't important
                secondary_name = re.sub('http\:\/\/', '', openid_url)
                secondary_name = re.sub('[/&?:]', '_', secondary_name)
                if len(secondary_name) > User._meta.get_field('username').max_length :
                    #The secondary_name is too long, use another one
                    import time
                    secondary_name = 'openIDUser'+ unicode(int(time.time()))
                
                if sreg:
                    name = sreg
                else:
                    name = secondary_name
                    
                try:
                    user = User(username=name)
                    user.save()
                except IntegrityError, e:
                    #username is already used. Use the secondary name
                    transaction.rollback() 
                    user.username = secondary_name
                    
                #for OpenID users, their password in Wirecloud isn't important
                #let's use a random one
                import random
                user.set_password(random.randint(0,1000000))
                user.save() 
                
                openID = UserOpenID(user=user, openid_url=openid_url)
                openID.save()
                transaction.commit()
                
                #OpenID authentication isn't compatible with EzSteroids yet.
                #OpenID users won't have any EzSteroids-related policies because they
                #don't have a related user in EzSteroids. To allow using EzSteroids, we should
                #ask EzSteroids to create a new user at this point. 
                
                return user
        else:
            return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
    

