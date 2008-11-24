# See license file (LICENSE.txt) for info about license terms.

from django.template import Library
from django.utils.translation import ugettext as _

from clms.log import get_and_delete_messages, send_error

register = Library()


def messagebox(context):
    """ Render message box """
    request = context['request']
    portal_messages = context['messages']
    if not portal_messages:
        portal_messages = get_and_delete_messages(request)
    if not portal_messages:
        if 'form' in context:
            form = context['form']
            if getattr(form, 'errors', []):
                if form.non_field_errors():
                    send_error(request, form.non_field_errors())
                send_error(request, _('Form filled has errors. Please correct'))
                portal_messages = get_and_delete_messages(request)
    return { 'portal_messages':  portal_messages }
messagebox = register.inclusion_tag('messagebox.html',
                                   takes_context=True)(messagebox)