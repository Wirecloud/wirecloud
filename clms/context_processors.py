# See license file (LICENSE.txt) for info about license terms.

from django.conf import settings
def server_url(request):
    """ user, year & month for the calendar """
    return {'AUTHENTICATION_SERVER_URL': settings.AUTHENTICATION_SERVER_URL }

def is_anonymous(request):
    is_anonymous = False
    if hasattr(request, 'anonymous_id') and request.anonymous_id and request.anonymous_id==request.user.id:
        is_anonymous = True
    return {'is_anonymous': is_anonymous }