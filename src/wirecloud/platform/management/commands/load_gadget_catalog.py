import urllib

from django.contrib.auth.models import User
from django.core.management.base import LabelCommand


class DummyRequest(object):

    def __init__(self, user, widget_url):
        self.POST = {'template_uri': widget_url}
        self.REQUEST = self.POST
        self.user = user


class Command(LabelCommand):
    """
    Load widgets from a catalog URL
    """
    label = 'catalog'
    args = '<url_to_catalog>'
    help = "Load widgets from a catalog URL. Catalog URL will be a URL list to the widgets (separated by \\n)"

    def handle(self, *labels, **options):
        from wirecloud.catalogue.views import WidgetsCollection
        user = User.objects.filter(is_superuser=True)[0]
        print 'Using user %s as widget creator...' % user
        url = urllib.urlopen(labels[0])
        lines = url.read().splitlines()
        widgets = WidgetsCollection()
        for widget_url in lines:
            print '\tFetching widget from %s...' % widget_url
            request = DummyRequest(user, widget_url)
            widgets.create(request, user.username, fromWGT=False)
        print 'Process finished.'
