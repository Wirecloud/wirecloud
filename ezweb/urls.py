from django.conf.urls.defaults import patterns

urlpatterns = patterns('ezweb.views',
    (r'^$', 'index'),
    (r'^wiring$', 'wiring'),

)
