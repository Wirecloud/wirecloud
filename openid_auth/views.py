# (c) Copyright 2007 Thomas Bohmbach, Jr.  All Rights Reserved. 
#
# See the LICENSE file that should have been included with this distribution
# for more specific information.

import re, urllib, urlparse

from django.utils.translation import ugettext as _
from django.conf import settings
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.contrib.auth import views as auth_views
from django.contrib.sites.models import Site, RequestSite
from django.db.models import permalink
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils.encoding import iri_to_uri
from openid.consumer.consumer import Consumer, SUCCESS, CANCEL, FAILURE, SETUP_NEEDED
from openid.sreg import SRegResponse
from openid_auth.django_openidconsumer.util import DjangoOpenIDStore, from_openid_response

from openid_auth import OPENIDS_SESSION_NAME, OPENID_ERROR_SESSION_NAME
from openid_auth.forms import OpenIDLoginForm, OPENID_FORM_FIELD_NAME, NEXT_FORM_FIELD_NAME

try:
    # The mod_python version is more efficient, so try importing it first.
    from mod_python.util import parse_qsl
except ImportError:
    from cgi import parse_qsl


SREG= 'nickname'

redirect_url_re = re.compile('^/[-\w/]+$')
def is_valid_redirect_url(redirect):
    """
    Restrict the URL to being a local path, not a complete URL.
    """
    return bool(redirect_url_re.match(redirect))

def get_openid_return_host(request):
    """
    Get the complete host URL.
    """
    host = getattr(settings, 'OPENID_RETURN_HOST', None)
    if not host:
        if request.is_secure():
            scheme = 'https'
        else:
            scheme = 'http'
        host = urlparse.urlunsplit((scheme, request.get_host(), '', '', ''))
    return host

@permalink
def get_openid_return_path(return_view_name):
    """
    Reverse URL lookup (permalink) for a given OpenID return view.
    """
    return (return_view_name,)

def get_openid_return_url(request,
                          return_view_name='openid_auth.views.complete_openid_login',
                          redirect_field_name=REDIRECT_FIELD_NAME,
                          redirect=None):
    """
    Get the URL to tell the openid server to redirect back to and, if
    available, append the redirect query parameter.
    """
    url = urlparse.urljoin(get_openid_return_host(request),
                           get_openid_return_path(return_view_name))
    (scheme, location, path, query, fragment) = urlparse.urlsplit(url)
    #If a 'redirect' attribute is provided, append that to the openid_return_url
    if redirect and is_valid_redirect_url(redirect):
        query_kv = parse_qsl(query)
        query_kv.append((redirect_field_name, redirect))
        query = urllib.urlencode(query_kv)
    return iri_to_uri(urlparse.urlunsplit((scheme, location, path, query, fragment)))

def login(request, template_name='registration/login.html', redirect_field_name=REDIRECT_FIELD_NAME):
    if request.POST:
        username = request.POST.get('username', None)
        password = request.POST.get('password', None)
        if username or password:
            return login_auth(request, template_name=template_name, redirect_field_name=redirect_field_name)
        else:
            return login_openid(request, template_name=template_name, redirect_field_name=redirect_field_name)
    else:
 #       openid_url = request.GET.get(OPENID_FORM_FIELD_NAME, '')
 #       if openid_url:
 #           return login_openid(request, template_name=template_name, redirect_field_name=redirect_field_name)
 #       else:
 #           return login_auth(request, template_name=template_name, redirect_field_name=redirect_field_name)
        return login_openid(request, template_name=template_name, redirect_field_name=redirect_field_name)
def login_auth(request, template_name='registration/login.html', redirect_field_name=REDIRECT_FIELD_NAME):
    """
    This starts the auth (traditional) login process.
    """
    return auth_views.login(request, template_name=template_name, redirect_field_name=redirect_field_name)

def login_openid(request, template_name='registration/login.html', redirect_field_name=REDIRECT_FIELD_NAME):
    """
    Displays the OpenID login form and handles the OpenID login action.
    
    ``redirect_field_name`` must be set to the same value as that passed into
    the ``complete_openid_login`` view.
    """
    openid_error = request.session.get(OPENID_ERROR_SESSION_NAME, '')
    openid_url = request.REQUEST.get(OPENID_FORM_FIELD_NAME, 'http://')
    #Was the form submitted?
    if request.POST:
        redirect = request.POST.get(NEXT_FORM_FIELD_NAME, '')
        request.session[OPENID_ERROR_SESSION_NAME] = ''
        openid_form = OpenIDLoginForm(request.POST)
        if openid_form.is_valid(request=request):
            request.session.delete_test_cookie()
            return begin_openid_login(request, openid_url, redirect_field_name=redirect_field_name, redirect=redirect, sreg=SREG)
    #Did we submit the form, go to the OpenID server, and return with an error?
    elif openid_error:
        request.session.set_test_cookie()
        redirect = request.GET.get(redirect_field_name, '')
        openid_form = OpenIDLoginForm({OPENID_FORM_FIELD_NAME : openid_url,
                                       NEXT_FORM_FIELD_NAME : redirect})
        openid_form.is_valid(request=request)    #This will result in the openid_error becoming a form error
        request.session[OPENID_ERROR_SESSION_NAME] = ''
    #We're displaying this page for the first time
    else:
        request.session.set_test_cookie()
        redirect = request.GET.get(redirect_field_name, '')
        openid_form = OpenIDLoginForm(initial={OPENID_FORM_FIELD_NAME : openid_url,
                                               NEXT_FORM_FIELD_NAME : redirect})
    
    return render_to_response(template_name,
                              {'openid_form' : openid_form,
                                redirect_field_name : redirect},
                                context_instance=RequestContext(request))

def begin_openid_login(request, openid_url,
                       redirect_field_name=REDIRECT_FIELD_NAME,
                       redirect=None,
                       return_view_name='openid_auth.views.complete_openid_login',
                       sreg=None, extension_args=None):
    """
    Setup the openid Consumer and redirect to the openid URL.
    """
    #Set up the openid authorization request
    consumer = Consumer(request.session, DjangoOpenIDStore())
    openid_auth = consumer.begin(openid_url)
    
    #Check if the openId provider is allowed
    if hasattr(settings, 'OPENID_PROVIDERS') and settings.OPENID_PROVIDERS:
        found = False
        for provider_name in settings.OPENID_PROVIDERS:
            if provider_name in openid_auth.endpoint.server_url:
                found = True
                break
            
        if not found:
            error_message = "%s: %s" % (_("Not allowed OpenID provider"), openid_auth.endpoint.server_url)
            return failure_openid_login(request, openid_url, error_message, redirect_field_name=redirect_field_name)
    
    #Add openid extension args (for things like simple registration)
    extension_args = extension_args or {}
    #If we want simple registration, set the correct extension argument
    if sreg:
        extension_args['sreg.optional'] = sreg
    for name, value in extension_args.items():
        namespace, key = name.split('.', 1)
        openid_auth.addExtensionArg(namespace, key, value)
    #Get the host to authenticate for
    trust_root = getattr(settings, 'OPENID_TRUST_ROOT', get_openid_return_host(request) + '/')
    #Make sure we have a full return URL and that we append any redirect parameters to it
    openid_return_url = get_openid_return_url(request,
                                              return_view_name=return_view_name,
                                              redirect_field_name=redirect_field_name,
                                              redirect=redirect)
    #Redirect to the authentication service
    openid_redirect_url = openid_auth.redirectURL(trust_root, openid_return_url)
    return HttpResponseRedirect(openid_redirect_url)

def complete_openid_login(request, redirect_field_name=REDIRECT_FIELD_NAME):
    """
    The openid callback view.
    
    ``redirect_field_name`` must be set to the same value as that passed into
    the ``login_openid`` view.
    """
    #Get the openid response
    consumer = Consumer(request.session, DjangoOpenIDStore())
    openid_response = consumer.complete(dict(request.GET.items()), request.build_absolute_uri())
    #Deal with the response based on status
    if openid_response.status == SUCCESS:
        return success_openid_login(request, openid_response, redirect_field_name=redirect_field_name)
    else:
        openid_url = openid_response.identity_url
        if openid_response.status == CANCEL:
            error_message = _("The request was cancelled.")
        elif openid_response.status == FAILURE:
            error_message = _(openid_response.message)
        elif openid_response.status == SETUP_NEEDED:
            error_message = _("Setup needed.  Please check your OpenID provider and try again.")
        else:
            error_message = "%s: %s" % (_("Bad openid status"), openid_response.status)
        return failure_openid_login(request, openid_url, error_message, redirect_field_name=redirect_field_name)

def success_openid_login(request, openid_response, redirect_field_name=REDIRECT_FIELD_NAME):
    """
    A view-helper to handle a successful OpenID authentication response.  Note that this
    doesn't mean we've found a matching user yet.  That's what this method
    does.  This view-helper requires adding ``openid_auth.models.OpenIDBackend`` to the
    ``settings.AUTHENTICATION_BACKENDS`` list.
    """
    #Get the OpenID URL
    openid_url = openid_response.identity_url
    
    sreg = SRegResponse.fromSuccessResponse(openid_response)

    nickname = None
    if sreg and sreg.has_key('nickname'):
        nickname = sreg.get('nickname')
    
    #Call the built in django auth function
    #(NOTE: this call won't work without adding 'openid_auth.models.OpenIDBackend' to the settings.AUTHENTICATION_BACKENDS list)
    user = authenticate(openid_url=openid_url, sreg=nickname)
    if user:
        #Log in the user with the built-in django function
        auth_login(request, user)
        #Do we not yet have any openids in the session?
        if OPENIDS_SESSION_NAME not in request.session.keys():
            request.session[OPENIDS_SESSION_NAME] = []
        #Eliminate any duplicate openids in the session
        request.session[OPENIDS_SESSION_NAME] = [o for o in request.session[OPENIDS_SESSION_NAME] if o.openid != openid_url]
        #Add this new openid to the list
        request.session[OPENIDS_SESSION_NAME].append(from_openid_response(openid_response))
        #Get the page to redirect to
        redirect = request.REQUEST.get(redirect_field_name, None)
        if not redirect or not is_valid_redirect_url(redirect):
            redirect = settings.LOGIN_REDIRECT_URL
        return HttpResponseRedirect(redirect)
    else:
        #TODO: This should start the registration process
        return failure_openid_login(request, openid_url, _("The OpenID doesn't match any registered user."))

def failure_openid_login(request, openid_url, error_message, redirect_field_name=REDIRECT_FIELD_NAME):
    """
    A view-helper to handle a failed openid authentication.
    """
    login_url = settings.LOGIN_URL
    (scheme, location, path, query, fragment) = urlparse.urlsplit(login_url)
    query_kv = []
    if openid_url:
        query_kv.append((OPENID_FORM_FIELD_NAME, openid_url))
    redirect = request.GET.get(redirect_field_name, None)
    if redirect:
        query_kv.append((redirect_field_name, redirect))
    query = urllib.urlencode(query_kv)
    login_url = urlparse.urlunsplit((scheme, location, path, query, fragment))
    request.session[OPENID_ERROR_SESSION_NAME] = error_message
    return HttpResponseRedirect(login_url)

def logout(request, next_page=None, template_name='registration/logged_out.html'):
    """
    View to handle loging a user out.
    """
    if OPENIDS_SESSION_NAME in request.session.keys():
        request.session[OPENIDS_SESSION_NAME] = []
    return auth_views.logout(request, next_page=next_page, template_name=template_name)

