# -*- coding: utf-8 -*-


#
from django.conf.urls.defaults import patterns

from gadget.views import Showcase 


urlpatterns = patterns('gadget.views',

    (r'^/?', Showcase(permitted_methods=('POST',))),
)
