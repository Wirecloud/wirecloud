# -*- coding: utf-8 -*-
# urls.py used as base for developing wirecloud.

from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as django_auth
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings

from wirecloud.commons import authentication as wc_auth
import wirecloud.platform.urls


vc_login_enabled = settings.VC_LOGIN_CONFIG['enabled']
if vc_login_enabled:
    from wirecloud.vc_login import views as vc_login_views

admin.autodiscover()

urlpatterns = (

    # Catalogue
    url(r'^catalogue/', include('wirecloud.catalogue.urls')),

    # Proxy
    url(r'^cdp/', include('wirecloud.proxy.urls')),

    # Login/logout
    url(r'^login/?$', django_auth.LoginView.as_view(), name="login"),
    url(r'^logout/?$', wc_auth.logout, name="logout"),
    url(r'^admin/logout/?$', wc_auth.logout),
    # VC login when enabled
    *([
        url(r'^vc/login/?$', vc_login_views.vc_sso_login, name='vc_sso_login'),
        url(r'^vc/callback/?$', vc_login_views.vc_sso_callback, name='vc_sso_callback'),
    ] if vc_login_enabled else []),

    # Admin interface
    url(r'^admin/', admin.site.urls),
)

urlpatterns += wirecloud.platform.urls.urlpatterns
urlpatterns += tuple(staticfiles_urlpatterns())

handler400 = "wirecloud.commons.views.bad_request"
handler403 = "wirecloud.commons.views.permission_denied"
handler404 = "wirecloud.commons.views.page_not_found"
handler500 = "wirecloud.commons.views.server_error"
