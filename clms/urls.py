# See license file (LICENSE.txt) for info about license terms.
from django.conf.urls.defaults import *

urlpatterns = patterns('clms.views',
    (r'^$', 'default'),
    (r'^catalogue/$', 'layout_catalogue_view'),
    (r'^view/(?P<layout_id>\d+)/$', 'layout_detail'),
    (r'favourite/$', 'favourite_catalogue_view'),
    (r'favourite/(?P<layout_id>\d+)/add/$', 'add_favourite'),
    (r'favourite/(?P<layout_id>\d+)/delete/$', 'del_favourite'),
    (r'default/(?P<layout_id>\d+)/add/$', 'add_default'),
    (r'default/(?P<layout_id>\d+)/delete/$', 'del_default'),
    (r'favourite/view/(?P<layout_id>\d+)/$', 'favourite_layout_detail'),
    (r'^language_setting/$', 'language_setting'),

)
