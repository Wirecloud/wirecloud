# -*- coding: utf-8 -*-
# See license file (LICENSE.txt) for info about license terms.

import math
import re
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import HttpResponse 
from django.shortcuts import render_to_response
from django.template.loader import render_to_string
from django.template import RequestContext
from django.utils import simplejson
from django.utils.translation import ugettext_lazy as _
from django.views.generic import list_detail

from clients.python.ezsteroids_real_api import get_category_list

from clms.decorators import is_staff_user
from clms.forms import ContentForm
from clms.models import Content, Layout, PanelDispatcher
from clms.adminfilters import QueryStringManager


content_re = re.compile(r'(?P<token>[\d]+)~(?P<content>[\d]+)@(?P<category_id>[\w]+)?!(?P<lang>[\w]+)?\*(?P<default>[\w]+)?')

@login_required
@is_staff_user
def panel_list_popup(request, layout_id=None):
    categories = get_category_list()
    langs = settings.LANGUAGES 
    panels_db = ''  
    panels = []
    def contents(match):
        content = {}
        content['token'] = match.group('token')
        content['content'] = Content.objects.get(pk=match.group('content'))
        content['category_id'] = match.group('category_id')
        content['default'] = match.group('default') is not None
        if content['category_id'] is None:
            content['category_id'] = ''
        else:
            content['category_id'] = int(content['category_id'])
        content['lang'] = match.group('lang')

        if content['lang'] is None:
            content['lang'] = ''

        panels.append(content)

    content_re.sub(contents, request.GET['contents'])
    token_id = request.GET.get("token_id")
    panels_db = render_to_string('panels_db.html',{'panels':panels,'langs':langs,'categories':categories})

    contents = Content.objects.all().order_by('name')
    return render_to_response('panel_list_popup.html',
                              {'is_popup': True,
                               'categories':categories,
                               'langs':langs,
                               'panels_db':panels_db,
                               'page_numbers': range(1,int(math.ceil(len(contents)/float(settings.NUMBER_CONTENTS)))+1),
                               'page_num':1,
                               'content_number': len(contents),
                               'number_contents':settings.NUMBER_CONTENTS,
                               'contents':contents[:settings.NUMBER_CONTENTS],
                              },
                              context_instance=RequestContext(request))

@login_required
@is_staff_user
def contents_filter(request):
    qsm = QueryStringManager(request)
    filters = qsm.get_filters()
    page = 1
    if 'page' in filters:
        page = int(filters.pop('page'))

    queryset = Content.objects.all()

    queryset = queryset.filter(**filters).order_by('name')
    contents = [(c.id, c.name) for c in queryset]

    queryset_json = simplejson.dumps({
                                    'page_numbers': math.ceil(len(contents)/float(settings.NUMBER_CONTENTS)),
                                    'content_number': len(contents),
                                    'query':contents[(page-1)*settings.NUMBER_CONTENTS:page*settings.NUMBER_CONTENTS],
                                    })
    return HttpResponse(queryset_json, mimetype='application/json')
