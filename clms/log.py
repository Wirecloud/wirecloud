# -*- coding: utf-8 -*-
# See license file (LICENSE.txt) for info about license terms.

from django.contrib.sessions.backends.base import SessionBase
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType
from django.utils.encoding import smart_unicode

# If django has implemented anonymous messages (stored in a session)
# See http://code.djangoproject.com/ticket/4604
if hasattr(SessionBase, 'get_messages'):
    HAS_ANONYMOUS_MESSAGES = True
else:
    HAS_ANONYMOUS_MESSAGES = False


def send_msg(request, msg, level='error'):
    message = u'<span class="%smsg">%s</span>' % (level, msg)
    if request.user.is_authenticated():
        request.user.message_set.create(message=message)
    elif HAS_ANONYMOUS_MESSAGES:
        request.session.create_message(message=message)


def send_info(request, msg):
    send_msg(request, msg, 'info')


def send_error(request, msg):
    send_msg(request, msg, 'error')


def get_messages(request):
    if request.user.is_authenticated():
        return request.user.get_messages()
    elif HAS_ANONYMOUS_MESSAGES:
        return request.session.get_messages()
    else:
        return []


def get_and_delete_messages(request):
    if request.user.is_authenticated():
        return request.user.get_and_delete_messages()
    elif HAS_ANONYMOUS_MESSAGES:
        return request.session.get_and_delete_messages()
    else:
        return []


# LogEntry convenience functions
def _log_action(user_id, obj, action, comment):
    content_type_id = ContentType.objects.get_for_model(obj.__class__).id
    LogEntry.objects.log_action(user_id, content_type_id, obj.id,
                                smart_unicode(obj), action,
                                change_message=comment)


def change(user_id, obj, comment=''):
    """Log a message. Model = class defined in models.py."""
    _log_action(user_id, obj, CHANGE, comment)


def create(user_id, obj, comment=''):
    _log_action(user_id, obj, ADDITION, comment)


def delete(user_id, obj, comment=''):
    _log_action(user_id, obj, DELETION, comment)
