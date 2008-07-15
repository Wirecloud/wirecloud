# -*- coding: utf-8 -*-
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required


@login_required
def index(request, user_name=None):
    """ Vista principal """
    if request.META['HTTP_USER_AGENT'].find("iPhone") >= 0:
        return render_to_response('iphone.html', {}, context_instance=RequestContext(request))
    else:
        return render_to_response('index.html', {'current_tab': 'dragboard'}, context_instance=RequestContext(request))

@login_required
def wiring(request, user_name=None):
    """ Vista del Wiring """
    return render_to_response('wiring.html', {}, context_instance=RequestContext(request))