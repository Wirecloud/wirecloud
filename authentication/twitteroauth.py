
"""Twitter Authentication backend for Django

Requires:
AUTH_PROFILE_MODULE to be defined in settings.py

The profile models should have following fields:
        access_token
        "screen_name (EzWeb requirement)"
        url
        location
        description
        profile_image_url
"""

import time

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction

from twitterauth.oauthtwitter import OAuthApi
from twitterauth.models import TwitterUserProfile


CONSUMER_KEY = getattr(settings, 'TWITTER_CONSUMER_KEY', 'YOUR_KEY')
CONSUMER_SECRET = getattr(settings, 'TWITTER_CONSUMER_SECRET', 'YOUR_SECRET')


class TwitterBackend:
    """TwitterBackend for authentication
    """
    @transaction.commit_on_success
    def authenticate(self, access_token):
        '''authenticates the token by requesting user information from twitter
        '''
        twitter = OAuthApi(CONSUMER_KEY, CONSUMER_SECRET, access_token)
        try:
            userinfo = twitter.GetUserInfo()
        except:
            # If we cannot get the user information, user cannot be authenticated
            return None

        screen_name = userinfo.screen_name

        try:
            userprofile = TwitterUserProfile.objects.get(screen_name=screen_name)
            user = userprofile.user

        except Exception:
            user = User(username=screen_name + unicode(int(time.time())))
            # create and set a random password so user cannot login using django built-in authentication
            user.set_unusable_password()

            user.first_name = userinfo.name
            user.save()

            # Get the user profile
            userprofile = TwitterUserProfile()

            userprofile.user = user

        userprofile.access_token = access_token.to_string()
        userprofile.screen_name = screen_name
        userprofile.url = userinfo.url
        userprofile.location = userinfo.location
        userprofile.description = userinfo.description
        userprofile.profile_image_url = userinfo.profile_image_url
        userprofile.save()
        return user

    def get_user(self, id):
        try:
            return User.objects.get(pk=id)
        except:
            return None

    def get_screen_name(self, request):
        return TwitterUserProfile.objects.get(user=request.user).screen_name
