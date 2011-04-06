# (c) Copyright 2007 Thomas Bohmbach, Jr.  All Rights Reserved. 
#
# See the LICENSE file that should have been included with this distribution
# for more specific information.

from django import forms
from django.conf import settings
from django.utils.translation import ugettext as _

from openid.consumer.consumer import Consumer
from openid.consumer.discover import DiscoveryFailure
from openid.yadis import xri
from openid_auth.django_openidconsumer.util import DjangoOpenIDStore

from openid_auth import OPENID_ERROR_SESSION_NAME


#Form field name constants
OPENID_FORM_FIELD_NAME = 'openid_url'
NEXT_FORM_FIELD_NAME = 'next'

class OpenIDLoginForm(forms.Form):
    """
    A form (newforms flavor) to collect an OpenID URL to authenticate against.
    """
    openid_url = forms.URLField(required=True, label='', initial='http://',
                                widget=forms.TextInput(attrs={'class' : getattr(settings, 'LOGIN_OPENID_URL_CLASS', 'openid')}))
    next = forms.CharField(required=False, widget=forms.HiddenInput)
    
    def clean(self):
        """
        Checks that the user has cookies enabled.
        """
        openid_error = self.request.session.get(OPENID_ERROR_SESSION_NAME, '')
        if self.request and not self.request.session.test_cookie_worked():
            raise forms.ValidationError(_("Your Web browser doesn't appear to have cookies enabled. Cookies are required for logging in."))
        return self.cleaned_data
    
    def clean_openid_url(self):
        openid_error = self.request.session.get(OPENID_ERROR_SESSION_NAME, '')
        if openid_error:
            self.request.session[OPENID_ERROR_SESSION_NAME] = ''
            raise forms.ValidationError(_(openid_error))
        openid_url = self.cleaned_data['openid_url']
        #Determine if we need to and can support openid inames
        disallow_inames = getattr(settings, 'OPENID_DISALLOW_INAMES', False)
        if disallow_inames and xri.identifierScheme(openid_url) == 'XRI':
            raise forms.ValidationError(_('i-names are not allowed'))
        #Set up the openid authorization request
        consumer = Consumer(self.request.session, DjangoOpenIDStore())
        try:
            auth_request = consumer.begin(openid_url)
        except DiscoveryFailure, df:
            raise forms.ValidationError("%s: %s" % (_("OpenID Discovery Failure"), df))
        return openid_url
        
    def is_valid(self, request=None):
        """
        Add the request object to the form and call parent's is_valid() method.
        """
        self.request = request
        return super(OpenIDLoginForm, self).is_valid()
    

