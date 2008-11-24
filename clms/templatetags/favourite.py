# See license file (LICENSE.txt) for info about license terms.

from django import template
from django.core.urlresolvers import reverse
from django.conf import settings
from django.template import Context, Library, Template, Variable

from clms.models import Layout, FavouriteLayout


register = Library()

class FavouriteNode(template.Node):

    def __init__(self, user, layout, view):
        self.user = Variable(user)
        self.layout = Variable(layout)
        self.view = Variable(view)

    def render(self, context):
        user = self.user.resolve(context)
        layout = self.layout.resolve(context)
        view = self.view.resolve(context)
        favourite_layout = FavouriteLayout.objects.filter(user=user)
        add_redirect_url = reverse('clms.views.add_favourite', args=(layout.id,))
        add_gif =  'add_favourites.gif' 
        del_redirect_url = reverse('clms.views.del_favourite', args=(layout.id,))
        del_gif =  'del_favourites.gif'
        output = "<img style='margin-right:10px' id='plus' src='%sclms/images/%s' onClick=\"javascript:{favourite_ajax('%s',%s, '%s');}\">" 
        add_output = output % (settings.MEDIA_URL, add_gif, add_redirect_url, layout.id, view)
        del_output = output % (settings.MEDIA_URL, del_gif, del_redirect_url, layout.id, view)
        if not favourite_layout or not layout in favourite_layout[0].layout.all():
            html_output = "<div style='display:inline' id='add_layout_%s'>%s</div><div style='display:none' id='del_layout_%s'>%s</div>" % ( layout.id, add_output, layout.id, del_output)
        else:
            html_output = "<div style='display:none' id='add_layout_%s'>%s</div><div style='display:inline' id='del_layout_%s'>%s</div>" % ( layout.id, add_output, layout.id, del_output)
        return html_output


def do_favourite(parser, token):
    bits = token.split_contents()
    bits_length = len(bits)
    if bits_length == 4:
        return FavouriteNode(bits[1], bits[2],  bits[3])
    else:
        raise template.TemplateSyntaxError, "%s tag requires none argument. %s" % (token.contents.split()[0])

register.tag('favourite', do_favourite)

