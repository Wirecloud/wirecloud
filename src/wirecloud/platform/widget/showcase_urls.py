# -*- coding: utf-8 -*-


#
from django.conf.urls.defaults import patterns, url

from wirecloud.platform.widget.views import Showcase


urlpatterns = patterns('wirecloud.platform.widget.views',
    (r'^$', Showcase(permitted_methods=('POST',))),

    url(r'^media/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/(?P<file_path>.+)$',
        'serve_showcase_media',
        name='wirecloud_showcase.media'
    ),
)
