# See license file (LICENSE.txt) for info about license terms.

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.db import models
from django.db.models import permalink
from django.utils.translation import get_language, ugettext_lazy as _

from stdimage import StdImageField
#from transmeta import TransMeta
from sorl.thumbnail.main import DjangoThumbnail

from clients.python.ezsteroids_real_api import evaluate_category, get_category

class Content(models.Model):
    #__metaclass__ = TransMeta
    #class Meta:
        #translate = ('html','url' )

    CONTENT_TYPES = (
        ('H', _('HTML')),
        ('O', _('Object-URL')),
        ('I', _('Image-URL')),
        ('IF', _('Image-File')),
        ('E', _('EzWeb')),
    )
    name = models.CharField(_('name'), max_length=200,
                            help_text=_('Enter the name'))

    type_content = models.CharField(_('Type Content'), max_length=2, choices=CONTENT_TYPES, default='H' ,
                                    help_text=_('Select a type content'))

    url = models.URLField(_('Url'), max_length=200, null=True, blank=True,
                               help_text=_('Enter url'))

    html = models.TextField( max_length=50000, null=True, blank=True,
                                 help_text=_('Enter HTML'))

    image = StdImageField(upload_to='content/',
                    null=True, blank=True,
                    help_text=_('Image File '))


    preview = StdImageField(upload_to='panel/',
                       null=True, blank=True,
                       help_text=_('Image Preview'))


    def thumbnail(self):
        """ Used in list_display """
        try:
            th=DjangoThumbnail(self.image.name, (100,100))
            return '<img src="%s" />' % th.absolute_url
        except:
            return ''
    thumbnail.short_description = 'Image thumbnail'
    thumbnail.allow_tags = True

    def __unicode__(self):
        return unicode(self.name)

    def print_html(self, user):
        if self.type_content =='H':
            return self.html
        elif self.type_content in ['I', 'IF']:
            url = self.url or self.image.url
            return '<img id="panel_%s"  name="img_reload" src="%s"/>' %(self.pk, url)
        elif self.type_content == 'O': 
            return '<iframe id="panel_%s" src="%s"  width="100%%" height="100%%" border="0" frameborder="0" style="margin:0px;border:none;"></iframe>' % (self.pk, self.url)
        elif self.type_content == 'E': 
            return '<iframe id="panel_%s" src="%s"  width="100%%" height="100%%" border="0" frameborder="0" style="margin:0px;border:none;"></iframe>' % (self.pk, settings.EZWEB_URL)


class Panel(models.Model):
    lang = models.CharField(_('name'), max_length=200, null=True, blank=True,
                            help_text=_('Enter the name'))

    content = models.ForeignKey(Content, verbose_name=_('Content'), null=True, blank=True,
                                help_text=_('Select a Content'))

    category_id = models.PositiveIntegerField(verbose_name=_('Category Id'), null=True, blank=True,
                                help_text=_('Select a Category'))

    def get_tag_id(self):
        return "%s#%s&%s" %(self.content.pk, self.category_id, self.lang)


    def __unicode__(self):
        return unicode(self.content)


class PanelDispatcher(models.Model):
    panels = models.ManyToManyField(Panel, verbose_name=_('Panels'))
    panel_default = models.ForeignKey(Panel, verbose_name=_('Panel Default'), null=True, blank=True, related_name="default",
                                help_text=_('This is the panel default'))
    token_number = models.PositiveIntegerField(_('positive integer'), max_length=10)

    def __unicode__(self):
        return unicode(self.panels)


class LayoutTemplate(models.Model):

    name = models.CharField(_('name'), max_length=200,
                            help_text=_('Enter the name'))
    html = models.TextField(_('HTML'), max_length=50000,
                            help_text=_('Enter the html'))
    tokens = models.CommaSeparatedIntegerField(_('Tokens'), max_length=200)

    image = StdImageField(upload_to='layout/',
                       null=True, blank=True,
                       help_text=_('Image'))

    def thumbnail(self):
        """ Used in list_display """
        try:
            th=DjangoThumbnail(self.image.name, (100,100))
            return '<img src="%s" />' % th.absolute_url
        except:
            return ''
    thumbnail.short_description = 'Image thumbnail'
    thumbnail.allow_tags = True

    def __unicode__(self):
        return self.name

    def layout_create(self):
        return '<a href="%s/add/"> <img src="/media/img/admin/icon_addlink.gif"/> </a>' %self.pk
    layout_create.allow_tags = True

def get_main_language():
    if '-' in get_language():
        result = get_language().split('-')[0]
    else:
        result = get_language()
    return result

class Layout(models.Model):

    name  = models.CharField(_('name'), max_length=200,
                            help_text=_('Enter the name'))

    panels_dispatched = models.ManyToManyField(PanelDispatcher, verbose_name=_('Panels Dispatched'), 
                                               help_text=_('Select some panels'))

    layout_template = models.ForeignKey(LayoutTemplate, verbose_name=_('Layout Template'), null=True, blank=True,
                                help_text=_('Select a layout template'))

    image = StdImageField(upload_to='layout_instance/',
                       null=True, blank=True,
                       help_text=_('Image'))

    categories = models.CommaSeparatedIntegerField(_('Categories'), max_length=200, null=True, blank=True)

    def thumbnail(self):
        """ Used in list_display """
        try:
            th = DjangoThumbnail(self.image.name, (100,100))
            return '<img src="%s" />' % th.absolute_url
        except:
            return ''
    thumbnail.short_description = 'Image thumbnail'
    thumbnail.allow_tags = True

    def __unicode__(self):
        return self.name

    def print_html(self, user):
        html = self.layout_template.html

        for pd in  self.panels_dispatched.all():
            token = "<!-- token%s -->" % pd.token_number
            panels = pd.panels.exclude(id=pd.panel_default.id)
            pd_find = False
            for panel in panels:
                category = None
                if panel.category_id:
                    category = get_category(panel.category_id)
                if (not panel.lang or get_main_language() == panel.lang) and (not category or evaluate_category(user, category)):
                    html = html.replace(token, panel.content.print_html(user))
            if not pd_find:
                html = html.replace(token, pd.panel_default.content.print_html(user))
        return html


class FavouriteLayout(models.Model):

    user = models.ForeignKey(User, unique=True)

    layout = models.ManyToManyField(Layout, verbose_name=_('Layout'))

    def __unicode__(self):
        layouts_names = ', '.join([l.name for l in self.layout.all()])
        return "%s: %s" % (self.user.username, layouts_names)


class DefaultUserLayout(models.Model):
    user = models.ForeignKey(User, unique=True, null=False, blank=False)
    layout = models.ForeignKey(Layout, verbose_name=_('Layout'))


