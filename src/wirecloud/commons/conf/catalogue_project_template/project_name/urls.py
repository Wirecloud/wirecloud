# -*- coding: utf-8 -*-

try:
    from django.conf.urls import patterns, include, url
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

admin.autodiscover()

urlpatterns = patterns('',

    # Catalogue
    (r'^catalogue', include('wirecloud.catalogue.urls')),

    # Login/logout
    url(r'^login/?$', 'django.contrib.auth.views.login', name="login"),
    url(r'^logout/?$', 'wirecloud.commons.authentication.logout', name="logout"),
    url(r'^admin/logout/?$', 'wirecloud.commons.authentication.logout'),

    # Admin interface
    (r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()

handler404 = "django.views.defaults.page_not_found"
handler500 = "wirecloud.commons.views.server_error"
