
from django.conf.urls.defaults import patterns, include

urlpatterns = patterns('',
    (r'^deployment/', include('deployment.urls')),
)
