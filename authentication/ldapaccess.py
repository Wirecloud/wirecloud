from django.contrib.auth.models import User
from django.conf import settings
import ldap

class LDAPBackend:

    def authenticate(self,username=None,password=None):
        if not self.is_valid(username,password):
            return None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User(username=username)
            
        user.set_password(password)
        user.save()

        return user

    def get_user(self,user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def is_valid (self,username=None,password=None):
        if password == None or password == '':
            return False
        try:
            l = ldap.initialize(settings.AD_LDAP_URL)
            l.simple_bind_s(settings.AD_SEARCH_DN % (username), password)
            l.unbind_s()
            return True
        except ldap.LDAPError, e:
            return False