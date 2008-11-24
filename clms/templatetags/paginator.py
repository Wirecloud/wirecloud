# See license file (LICENSE.txt) for info about license terms.

from django import template

register = template.Library()

def paginator(context, total_pages=10):
    """
    To be used in conjunction with the object_list generic view.

    Adds pagination context variables for use in displaying first, adjacent and
    last page links in addition to those created by the object_list generic
    view.
    """
    if (context["page"] <= total_pages/2):
        initpage = 1
    elif (context["page"] > context["pages"]-total_pages/2):
        initpage=context["pages"]-total_pages+1
    else:
        initpage = context["page"]-(total_pages/2)+1

    if initpage < 1:
        initpage = 1

    if (initpage + total_pages) > context['pages']:
        page_numbers = range(initpage, context['pages']+1)
    else:
        page_numbers = range(initpage, initpage+total_pages)

    first_item = (context["page"]-1) * context["results_per_page"] + 1
    last_item = (context["page"]-1) * context["results_per_page"] + context["results_per_page"]

    if last_item > context["hits"]:
        last_item = context["hits"]

    if context.get('query_string',None):
        query_string = '?' + context['query_string'] + '&'
    else:
        query_string = '?'

    return {
        "hits": context["hits"],
        "results_per_page": context["results_per_page"],
        "page": context["page"],
        "pages": context["pages"],
        "page_numbers": page_numbers,
        "next": context["next"],
        "previous": context["previous"],
        "has_next": context["has_next"],
        "has_previous": context["has_previous"],
        "show_first": 1 in page_numbers,
        "show_last": context["pages"] in page_numbers,
        "first_item": first_item,
        "last_item": last_item,
        "query_string": query_string
    }

register.inclusion_tag("paginator.html", takes_context=True)(paginator)
