# -*- coding: utf-8 -*-
# See license file (LICENSE.txt) for info about license terms.

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.views.generic import list_detail
from django.views.i18n import set_language

from clients.python.ezsteroids_real_api import get_category, evaluate_category
from clms.models import Layout, FavouriteLayout, DefaultUserLayout


def language_setting(request):
    """ Call default django set_language but set language cookie to advise caching middleware """
    lang_code = request.POST.get('language', None)
    response = set_language(request)
    if lang_code:
        response.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang_code)
    return response


def default(request):
    layout_default = None
    try:
        layout_default = DefaultUserLayout.objects.get(user=request.user).layout
    except DefaultUserLayout.DoesNotExist:
        layout_list = Layout.objects.all()
        layout_query = get_allowed_layouts(request.user, layout_list)
        try:
            layout_default = layout_query[0]
        except IndexError:
            pass
    return layout_detail(request, layout_default.id, {'hide': True})


def get_allowed_layouts(user, layout_list):
    allowed_layouts_ids = []
    for layout in layout_list:
        if not layout.categories:
            allowed_layouts_ids.append(layout.id)
        else:
            layout_categories = layout.categories.split(' ,')
            for category_id in layout_categories:
                category = get_category(int(category_id))
                if evaluate_category(user, category):
                    allowed_layouts_ids.append(layout.id)
                    break
    layout_query = Layout.objects.filter(id__in=allowed_layouts_ids)
    return layout_query


def check_allowed_layout(user, layout):
    if not layout.categories:
            return True
    else:
        layout_categories = layout.categories.split(' ,')
        for category_id in layout_categories:
                category = get_category(int(category_id))
                if evaluate_category(user, category):
                    return True
    return False


def layout_catalogue_view(request):
    layout_list = Layout.objects.all()
    layout_query = get_allowed_layouts(request.user, layout_list)
    return list_detail.object_list(request, layout_query,
                                   allow_empty=True,
                                   paginate_by=6,
                                   template_name='layout_catalogue_view.html',
                                   template_object_name='layout',
                                   )


def layout_detail(request, layout_id=None, context={}):

    layout = get_object_or_404(Layout, pk=layout_id)
    if not context.get('hidden', False) and not check_allowed_layout(request.user, layout):
        return HttpResponseForbidden()

    layout_list = Layout.objects.all()
    layout_query = get_allowed_layouts(request.user, layout_list)
    try:
        prev_layout_id = layout_query.filter(id__lt=layout.id).order_by('-id')[0].id
    except:
        prev_layout_id = None
    try:
        next_layout_id = layout_query.filter(id__gt=layout.id).order_by('id')[0].id
    except:
        next_layout_id = None

    context_default = {
            'layout': layout,
            'hide': False,
            'prev_layout_id': prev_layout_id,
            'next_layout_id': next_layout_id,
            'layout_html': layout.print_html(request.user)
            }
    context_default.update(context)
    return render_to_response('layout_detail.html', context_default,
                              context_instance=RequestContext(request))


@login_required
def add_favourite(request, layout_id):
    try:
        layout = get_object_or_404(Layout, id=layout_id)
        favourite_layout = FavouriteLayout.objects.get_or_create(user=request.user)[0]
        if not layout in favourite_layout.layout.all():
            favourite_layout.layout.add(layout)
            favourite_layout.save()
            return HttpResponse(simplejson.dumps({
                        'action': 'add',
                        'done': True,
                        'message': _('Layout added to favourites'),
                        }))
        else:
            return HttpResponse(simplejson.dumps({
                        'action': 'add',
                        'done': True,
                        'message': _('Layout already in favourites'),
                        }))
    except:
        return HttpResponse(simplejson.dumps({
                    'action': 'add',
                    'done': False,
                    'message': _('Error when trying to set layout as favourite'),
                    }))


@login_required
def add_default(request, layout_id):
    layout = get_object_or_404(Layout, id=layout_id)
    try:
        default_layout = DefaultUserLayout.objects.get(user=request.user)
        default_layout.layout = layout
        default_layout.save()
    except DefaultUserLayout.DoesNotExist:
        default_layout = DefaultUserLayout.objects.create(user=request.user, layout=layout)
    return HttpResponse(simplejson.dumps({
                'action': 'add',
                'done': True,
                'message': _('Layout added to default'),
                }))


@login_required
def del_default(request, layout_id):
    layout = get_object_or_404(Layout, id=layout_id)
    try:
        default_layout = DefaultUserLayout.objects.get(user=request.user, layout=layout)
        default_layout.delete()
    except DefaultUserLayout.DoesNotExist:
        return HttpResponse(simplejson.dumps({
                    'action': 'del',
                    'done': False,
                    'message': _('Layout is not default layout'),
                    }))
    return HttpResponse(simplejson.dumps({
                'action': 'del',
                'done': True,
                'message': _('Layout deleted to default'),
                }))


@login_required
def del_favourite(request, layout_id):
    try:
        layout = get_object_or_404(Layout, id=layout_id)
        favourite_layout = FavouriteLayout.objects.get(user=request.user)
        if layout in favourite_layout.layout.all():
            favourite_layout.layout.remove(layout)
            favourite_layout.save()
            return HttpResponse(simplejson.dumps({
                        'action': 'del',
                        'done': True,
                        'message': _('Layout deleted from favourites'),
                        }))
        else:
            return HttpResponse(simplejson.dumps({
                        'action': 'del',
                        'done': True,
                        'message': _('Layout is not in favourites'),
                        }))
    except:
        return HttpResponse(simplejson.dumps({
                    'action': 'del',
                    'done': False,
                    'message': _('Error when trying to delete Layout as favourite'),
                    }))


@login_required
def favourite_catalogue_view(request):
    favourite_layout_objects = FavouriteLayout.objects.get_or_create(user=request.user)[0]
    favourite_layout_list = favourite_layout_objects.layout.all()
    favourite_layout_query = get_allowed_layouts(request.user, favourite_layout_list)
    return list_detail.object_list(request, favourite_layout_query,
                                   allow_empty=True,
                                   paginate_by=12,
                                   template_name='favourite_layout_catalogue_view.html',
                                   template_object_name='layout')


@login_required
def favourite_layout_detail(request, layout_id):
    favourite_layout = get_object_or_404(Layout, id=layout_id)
    if not check_allowed_layout(request.user, favourite_layout):
        return HttpResponseForbidden()
    favourite_layout_object = get_object_or_404(FavouriteLayout, user=request.user)
    favourite_layout_list = favourite_layout_object.layout.all()
    favourite_layout_query = get_allowed_layouts(request.user, favourite_layout_list)
    try:
        prev_favourite_layout_id = favourite_layout_query.filter(id__lt=layout_id).order_by('-id')[0].id
    except:
        prev_favourite_layout_id = None
    try:
        next_favourite_layout_id = favourite_layout_query.filter(id__gt=layout_id).order_by('id')[0].id
    except:
        next_favourite_layout_id = None
    return render_to_response('favourite_layout_detail.html',
                            {'layout': favourite_layout,
                             'prev_layout_id': prev_favourite_layout_id,
                             'next_layout_id': next_favourite_layout_id,
                             'layout_html': favourite_layout.print_html(request.user)},
                             context_instance=RequestContext(request))
