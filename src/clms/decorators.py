# See license file (LICENSE.txt) for info about license terms.

from urllib import quote
from django.http import HttpResponseRedirect


def is_staff_user(view_func):
    def _decorator(request, *args, **kwargs):
        if not request.user.is_authenticated() or not request.user.is_staff:
            return HttpResponseRedirect('/admin/?next=%s' % quote(request.get_full_path()))
        return view_func(request, *args, **kwargs)
    return _decorator
