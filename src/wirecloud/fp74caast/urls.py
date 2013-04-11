from django.conf.urls.defaults import patterns, url
from wirecloud.fp74caast.views import TenantCollection


urlpatterns = patterns('wirecloud.fp74caast.views',

    url(r'^api/4caast-enabling/add_tenant$',
        'add_tenant',
        name='wirecloud.4caast.add_tenant'),

    url(r'^api/4caast-enabling/remove_tenant$',
        'remove_tenant',
        name='wirecloud.4caast.remove_tenant'),

    url(r'^api/4caast-enabling/deploy_tenant_ac$',
        'deploy_tenant_ac',
        name='wirecloud.4caast.deploy_tenant_ac'),

    url(r'^api/4caast-enabling/undeploy_tenant_ac$',
        'undeploy_tenant_ac',
        name='wirecloud.4caast.undeploy_tenant_ac'),

    url(r'^(?P<creator>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/add_saas_tenant$',
        TenantCollection(permitted_methods=('GET',)),
        name='wirecloud.4caast.add_saas_tenant'),

    url(r'^(?P<creator>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/remove_saas_tenant$',
        'remove_saas_tenant',
        name='wirecloud.4caast.remove_saas_tenant'),
)
