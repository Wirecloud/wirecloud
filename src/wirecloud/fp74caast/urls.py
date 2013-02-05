from django.conf.urls.defaults import patterns, url
from wirecloud.fp74caast.views import TenantCollection


urlpatterns = patterns('wirecloud.fp74caast.views',
    url(r'^(?P<creator>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/add_saas_tenant$',
        TenantCollection(permitted_methods=('GET',)),
        name='wirecloud.4caast.add_saas_tenant'),

    url(r'^(?P<creator>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/remove_saas_tenant$',
        'remove_saas_tenant',
        name='wirecloud.4caast.remove_saas_tenant'),
)
