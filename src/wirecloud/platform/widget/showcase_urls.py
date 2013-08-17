# -*- coding: utf-8 -*-


#
try:
    from django.conf.urls import patterns, url
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('wirecloud.platform.widget.views',
    url(r'^media/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/(?P<file_path>.+)$',
        'serve_showcase_media',
        name='wirecloud_showcase.media'
    ),
)
