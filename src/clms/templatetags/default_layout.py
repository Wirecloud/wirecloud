# See license file (LICENSE.txt) for info about license terms.

from django.conf import settings
from django.template import Library

from clms.models import DefaultUserLayout

register = Library()


def default_layout(context, user, layout, view):
    default_layout = DefaultUserLayout.objects.filter(user=user, layout=layout)

    return {
        'layout': layout,
        'is_default': default_layout,
        'view': view,
        'MEDIA_URL': settings.MEDIA_URL,
        }

register.inclusion_tag("default_layout.html", takes_context=True)(default_layout)
