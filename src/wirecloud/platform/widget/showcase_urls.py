# -*- coding: utf-8 -*-

import warnings

from django.conf.urls import patterns, url


warnings.warn('showcase_urls.py has been deprecated. Remove it from your urls.py file.', DeprecationWarning)

urlpatterns = patterns('wirecloud.platform.widget.views')
