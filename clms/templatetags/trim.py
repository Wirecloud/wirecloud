# See license file (LICENSE.txt) for info about license terms.

from django import template
from django.utils.safestring import mark_safe

register = template.Library()


def trim(value):
    return mark_safe(value).replace(' ', '')
register.filter('trim', trim)
