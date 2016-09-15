# -*- coding: utf-8 -*-

from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as django_auth
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from wirecloud.commons import authentication as wc_auth
import wirecloud.platform.urls

admin.autodiscover()

urlpatterns = (

    # Catalogue
    url(r'^catalogue/', include('wirecloud.catalogue.urls')),

    # Proxy
    url(r'^cdp/', include('wirecloud.proxy.urls')),

    # Login/logout
    url(r'^login/?$', django_auth.login, name="login"),
    url(r'^logout/?$', wc_auth.logout, name="logout"),
    url(r'^admin/logout/?$', wc_auth.logout),

    # Admin interface
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += wirecloud.platform.urls.urlpatterns
urlpatterns += tuple(staticfiles_urlpatterns())

handler400 = "wirecloud.commons.views.bad_request"
handler403 = "wirecloud.commons.views.permission_denied"
handler404 = "wirecloud.commons.views.page_not_found"
handler500 = "wirecloud.commons.views.server_error"
