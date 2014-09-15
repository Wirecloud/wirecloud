# -*- coding: utf-8 -*-

from django.conf.urls import patterns, include, url
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

handler404 = "wirecloud.commons.views.page_not_found"
handler500 = "wirecloud.commons.views.server_error"
