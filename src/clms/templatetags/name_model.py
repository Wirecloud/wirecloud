# See license file (LICENSE.txt) for info about license terms.

from django import template
from django.utils.safestring import mark_safe

register = template.Library()


def name_model(value):
    app_name = mark_safe(value).split('/')
    if len(app_name) > 2:
        return mark_safe(app_name[1]).replace(' ', '')
    elif len(app_name) == 2:
        return mark_safe(app_name[0]).replace(' ', '')
    else:
        return ''
register.filter('name_model', name_model)
