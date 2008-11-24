# -*- coding: utf-8 -*-
# See license file (LICENSE.txt) for info about license terms.

import re
import datetime
from django import forms
from django.conf import settings
from django.contrib import admin
from django.contrib.admin import helpers
from django.contrib.admin.util import unquote
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction

from django.forms.util import ErrorList
from django.http import HttpResponseRedirect
from django.utils.translation import ugettext_lazy as _
from django.utils.safestring import mark_safe
from django.utils.encoding import force_unicode
from django.forms.formsets import all_valid


from clms import widgets

from clients.python.ezsteroids_real_api import get_category, get_category_list
from clms.widgets import PanelWidget
from clms.table_parser import TableParser
from clms.models import LayoutTemplate, Layout, PanelDispatcher, Panel, \
                        Content, FavouriteLayout, DefaultUserLayout, DefaultSettingsClms


class CLMSSite(admin.AdminSite):
    index_template = 'admin/index_clms.html'
    app_index_template = 'admin/app_index_clms.html'


class ModelAdmin(admin.ModelAdmin):
    def response_add(self, request, obj, post_url_continue='../%s/'):
        """
        Determines the HttpResponse for the add_view stage.
        """
        opts = obj._meta
        pk_value = obj._get_pk_val()

        msg = _('The %(name)s "%(obj)s" was added successfully.') % {'name': force_unicode(opts.verbose_name), 'obj': force_unicode(obj)}
        # Here, we distinguish between different save types by checking for
        # the presence of keys in request.POST.
        if request.POST.has_key("_continue"):
            self.message_user(request, _("You may edit it again below."))
            if request.POST.has_key("_popup"):
                post_url_continue += "?_popup=1"
            return HttpResponseRedirect(post_url_continue % pk_value)

        if request.POST.has_key("_popup"):
            return HttpResponse('<script type="text/javascript">opener.dismissAddAnotherPopup(window, "%s", "%s");</script>' % \
                # escape() calls force_unicode.
                (escape(pk_value), escape(obj)))
        elif request.POST.has_key("_addanother"):
            self.message_user(request, msg + ' ' + (_("You may add another %s below.") % force_unicode(opts.verbose_name)))
            return HttpResponseRedirect(request.path)
        else:
            self.message_user(request, msg)

            # Figure out where to redirect. If the user has change permission,
            # redirect to the change-list page for this object. Otherwise,
            # redirect to the admin index.
            if request.POST and request.POST.get('_save', None):
                post_url = '/admin/clms/'
            elif self.has_change_permission(request, None):
                post_url = '../'
            else:
                post_url = '../../../'
            return HttpResponseRedirect(post_url)


    def response_change(self, request, obj):
        """
        Determines the HttpResponse for the change_view stage.
        """
        opts = obj._meta
        pk_value = obj._get_pk_val()
        msg = _('The %(name)s "%(obj)s" was changed successfully.') % {'name': force_unicode(opts.verbose_name), 'obj': force_unicode(obj)}
        if request.POST.has_key("_continue"):
            self.message_user(request, _("You may edit it again below."))
            if request.REQUEST.has_key('_popup'):
                return HttpResponseRedirect(request.path + "?_popup=1")
            else:
                return HttpResponseRedirect(request.path)
        elif request.POST.has_key("_saveasnew"):
            msg = _('The %(name)s "%(obj)s" was added successfully. You may edit it again below.') % {'name': force_unicode(opts.verbose_name), 'obj': obj}
            self.message_user(request, msg)
            return HttpResponseRedirect("../%s/" % pk_value)
        elif request.POST.has_key("_addanother"):
            self.message_user(request, msg + ' ' + (_("You may add another %s below.") % force_unicode(opts.verbose_name)))
            return HttpResponseRedirect("../add/")
        else:
            self.message_user(request, msg)
            return HttpResponseRedirect("/admin/clms/")

class DefaultUserLayoutModelAdmin(ModelAdmin):
    pass


class DefaultSettingsClmsModelAdmin(ModelAdmin):
    extra_css = {'screen':["/ezweb/clms/css/admin.css"]}

    def get_form(self, request, obj=None):
        form = super(DefaultSettingsClmsModelAdmin, self).get_form(request, obj)
        form.base_fields['content_type'].queryset = ContentType.objects.filter(app_label='clms')
        if obj and obj.content_type:
            queryset = obj.content_type.model_class().objects.all()
            form.base_fields['value'] = forms.ModelChoiceField(queryset=queryset ,
                               initial=obj.value,
                               widget=forms.Select({}),
                               label=_(u'value'), required=True)
        def clean(self):
            if self.cleaned_data.get('content_type'):
                self.cleaned_data['value'] = self.cleaned_data['value'].id
            return self.cleaned_data

        form.clean = clean

        return form

    def _media(self):
        "Injects OpenLayers Css into the admin."
        media = super(DefaultSettingsClmsModelAdmin, self)._media()
        media.add_css(self.extra_css)
        return media
    media = property(_media)

class ContentModelAdmin(ModelAdmin):
    extra_js = ['/ezweb/clms/js/content.js']
    extra_css = {'screen':["/ezweb/clms/css/admin.css"]}

    def get_form(self, request, obj=None):
        form = super(ContentModelAdmin, self).get_form(request, obj)
        form.base_fields['type_content'].widget.attrs = attrs={'onChange':'javascript:content_view(this)',}
        if obj and obj.type_content in ['O', 'I']:
            self.extra_css = {'screen':["/ezweb/clms/css/admin.css","/ezweb/clms/css/content_html.css", "/ezweb/clms/css/content_imagefile.css"]}
        elif obj and obj.type_content == 'E':
            self.extra_css = {'screen':["/ezweb/clms/css/admin.css","/ezweb/clms/css/content_html.css","/ezweb/clms/css/content_url.css", "/ezweb/clms/css/content_imagefile.css"]}
        elif obj and obj.type_content == 'IF':
            self.extra_css = {'screen':["/ezweb/clms/css/admin.css","/ezweb/clms/css/content_url.css", "/ezweb/clms/css/content_html.css"]}
        else:
            self.extra_css = {'screen':["/ezweb/clms/css/admin.css","/ezweb/clms/css/content_url.css", "/ezweb/clms/css/content_imagefile.css"]}
        form.base_fields['html'].widget = widgets.TinyMCE({"width":"90%"})


        def clean(self):
            if self.cleaned_data['type_content'] in ['H','E']:
                if self.errors.get('url', None):
                    del self.errors['url']
            return self.cleaned_data
        form.clean = clean
        return form

    def save_form(self, request, form, change):
        """
        Given a ModelForm return an unsaved instance. ``change`` is True if
        the object is being changed, and False if it's being added.
        """
        if form.cleaned_data['type_content'] == 'I':
            form.cleaned_data['html'] = ''
        elif form.cleaned_data['type_content'] == 'H':
            form.cleaned_data['url'] = ''
        elif form.cleaned_data['type_content'] == 'E':
            form.cleaned_data['url'] = ''
            form.cleaned_data['html'] = ''
        elif form.cleaned_data['type_content'] == 'IF':
            form.cleaned_data['url'] = ''
            form.cleaned_data['html'] = ''
        return form.save(commit=False)

    def _media(self):
        "Injects OpenLayers JavaScript into the admin."
        media = super(ContentModelAdmin, self)._media()
        media.add_js(self.extra_js)
        media.add_css(self.extra_css)
        return media
    media = property(_media)

class CategoryModelAdmin(ModelAdmin):
    pass

class PanelModelAdmin(ModelAdmin):
    def get_form(self, request, obj=None):
        form = super(PanelModelAdmin, self).get_form(request, obj)
        categories = get_category_list()
        categories_choices = [(None,_('All Users'))]
        categories_choices.extend([(cat.id, cat.name)for cat in categories])
        form.base_fields['category_id'] = forms.ChoiceField(choices=categories_choices, 
                                                            label=_(u'Category'), 
                                                            widget=forms.Select)
        def clean(self):
            if self.cleaned_data.get('category_id', None) and  self.cleaned_data.get('category_id') == 'None':
                del self.cleaned_data['category_id']
            return self.cleaned_data
        form.clean = clean
        return form

class PanelDispatcherModelAdmin(ModelAdmin):
    pass

class FavouriteLayoutModelAdmin(ModelAdmin):
    pass

re_select_layout = re.compile(r'<!-- token(?P<token>\d+) -->')
content_re = re.compile(r'(?P<token>[\d]+)~(?P<content>[\d]+)#(?P<category_id>[\w]+)?&(?P<lang>[\w]+)?\*(?P<default>[\w]+)?')

class LayoutModelAdmin(ModelAdmin):
    extra_js = ['/media/js/core.js','/ezweb/clms/js/popup_list.js','/ezweb/tinyMCE/widgets/tiny_mce/tiny_mce_src.js']
    extra_css = {'screen':["/ezweb/clms/css/admin.css"]}
    list_filter = ('layout_template',)
    list_display = ('name', 'thumbnail', )

    def __call__(self, request, url):
        if url and 'add' in url:
            layout_template_model = LayoutTemplateModelAdmin(LayoutTemplate, self.admin_site)
            return layout_template_model.changelist_view(request)
        else:
            return super(LayoutModelAdmin,self).__call__(request, url)

    def get_form(self, request, obj=None):
        form = super(LayoutModelAdmin, self).get_form(request, obj)
        full_path = request.get_full_path()
        layout = None
        full_path_split = full_path.split('/')
        clms_clms = 1
        if full_path.rfind("clms/clms")==-1:
            clms_clms =  0

        if full_path_split[(3+clms_clms)] == 'layouttemplate' and not full_path_split[(5+clms_clms)].isdigit():
            layout_template_id = full_path.split('/')[(4+clms_clms)]
            layout_template = LayoutTemplate.objects.get(id=layout_template_id)
        else:
            if len(full_path_split) == (6+clms_clms):
                layout_id = full_path_split[(4+clms_clms)]
            elif len(full_path_split) == (7+clms_clms):
                layout_id = full_path_split[(5+clms_clms)]
            if layout_id.isdigit():
                layout = Layout.objects.get(id=layout_id)
                layout_template = layout.layout_template

        text_link = (layout and _('Change a layout')) or _('Choose a panel ')
        token_panels_initial = ''
        def select_layout_changes(match):
            token_panels_initial = ""
            token = match.group('token')
            text = ""
            if layout:
                text_link =  _('Change some content')
                panel_dispatched = layout.panels_dispatched.get(token_number=token)
                panels = panel_dispatched.panels.all()
                for panel in panels:
                    if not panel.category_id:
                        category = _('All Users')
                        category_id = None
                    else:
                        category = get_category(panel.category_id)
                        category_id = panel.category_id
                    default = panel == panel_dispatched.panel_default
                    default_str = ''
                    default_str = (default and 'd') or ''
                    token_panel_initial= "%s~%s#%s&%s*%s" %(panel_dispatched.token_number,panel.content.id,category_id or '',panel.lang or '', default_str)
                    token_panels_initial+=token_panel_initial


                    lang = [unicode(lang[1]) for lang in settings.LANGUAGES if lang[0]==panel.lang] or [_('All Languages')]
                    text += "<p id=\"%s\" class=\"content_%s\">  Content:  <strong>%s</strong>. Language: <strong>%s</strong>. Category: <strong>%s</strong>. <a href='#select_content' onClick='javascript:{delete_content(this);}'>Delete  </a>  </p>" %(token_panel_initial, token, panel.content.name, lang[0] , category)
            else:
                text_link =  _('Choose some content')
            return '<span id="span_%s"><a id="link_%s" href="#" onclick="javascript:{popup_list(this);return false;}" >%s </a><div id="div_%s"> %s</div> </span>' %(token, token, text_link, token, text)
        select_layout_initial = "<div id='select_layout_div'> %s </div>"%re_select_layout.sub(select_layout_changes, layout_template.html.replace('border="0"','border="1"'))

        form.base_fields['select_layout'] = forms.CharField(
                                            initial = select_layout_initial, \
                                            widget = PanelWidget(), \
                                            required= False, \
                                          )

        categories = get_category_list()
        categories_choices = []
        categories_choices.extend([(cat.id, cat.name)for cat in categories])

        form.base_fields['categories'] = forms.MultipleChoiceField(choices=categories_choices, required=False)
        form.base_fields['categories'].widget = widgets.FilteredSelectMultipleWidget(
                                            verbose_name=_('Categories'),
                                            print_head=True,
                                            is_stacked=False,
                                            choices=categories_choices)


        if layout:
            panels_dispatched = layout.panels_dispatched.all()
            for pd in panels_dispatched:
                panels = pd.panels.all()
                for p in panels:
                    token_panels_initial+= (token_panels_initial and ',')
                    default = p == pd.panel_default
                    default_str = ''
                    default_str = (default and 'd') or ''
                    token_panels_initial+= "%s~%s#%s&%s*%s" %(pd.token_number,p.content.id,p.category_id or '',p.lang or '',default_str)

        form.base_fields['token_panels'] = forms.CharField(max_length=300,
                                                widget=forms.HiddenInput(),label=_(u' ' ),
                                                required=False, initial=token_panels_initial)


        if layout_template:
            form.base_fields['layout_template'].initial = layout_template.pk
        form.base_fields['panels_dispatched'].required = False



        def clean(self):
            categories = self.cleaned_data.get('categories', None)
            if categories:
                self.cleaned_data['categories'] = ' ,'.join(categories)
            else:
                self.cleaned_data['categories'] = ''

            tokens = {}
            def count_tokens(match):
                token = match.group('token')
                tokens[token] = token

            def contents(match):
                token = match.group('token')
                content = Content.objects.get(pk=match.group('content'))
                category_id = match.group('category_id')
                lang = match.group('lang')
                default = match.group('default') is not None
                if layout:
                    panel_dispatched = layout.panels_dispatched.get_or_create(token_number=token)
                    panel_dispatched_created = panel_dispatched[1]
                    panel_dispatched = panel_dispatched [0]

                    if tokens.get(token, None):
                        panel_dispatched.panels.clear()
                        del tokens[token]

                else:
                    if isinstance(tokens[token], PanelDispatcher):
                        panel_dispatched = tokens[token]
                    else:
                        panel_dispatched = PanelDispatcher.objects.create(token_number=token)
                        tokens[token] = panel_dispatched 
                panel = panel_dispatched.panels.get_or_create(lang=lang, content=content, category_id=category_id)
                panel_dispatched.panels.add(panel[0])
                if default:
                    panel_dispatched.panel_default = panel[0]
                    panel_dispatched.save()
                self.cleaned_data['panels_dispatched'].append(panel_dispatched)

            content_re.sub(count_tokens, self.cleaned_data['token_panels'])
            if len(tokens) == len(layout_template.tokens.split(',')):
                content_re.sub(contents, self.cleaned_data['token_panels'])
            else:
                self._errors['select_layout'] = ErrorList([u'You must select at least one panel for each cell'])
            html = self.cleaned_data['layout_template'].html
            self.cleaned_data['html'] = html

            return self.cleaned_data

        form.base_fields.keyOrder = ['name', 'layout_template', 'image', 'panels_dispatched', 'categories', 'select_layout', 'token_panels']
        form.clean = clean

        return form 


    def _media(self):
        "Injects OpenLayers JavaScript into the admin."
        media = super(LayoutModelAdmin, self)._media()
        media.add_js(self.extra_js)
        media.add_css(self.extra_css)
        return media

    media = property(_media)

class LayoutTemplateModelAdmin(ModelAdmin):
    verbose_name = _('Layout Template')
    extra_js = ['/ezweb/clms/js/change_field.js','/ezweb/tinyMCE/widgets/tiny_mce/tiny_mce_src.js']
    extra_css = {'screen':["/ezweb/clms/css/admin.css"]}
    list_display = ('name', 'thumbnail','layout_create' )

    def __call__(self, request, url):
        if url and len(url.split('/')) == 2 and not 'add' in url and url.split('/')[1].isdigit():
            layout_model = LayoutModelAdmin(Layout, self.admin_site)
            return layout_model.change_view(request,url.split('/')[1])
        elif url and url.endswith('add') and len(url.split('/')) == 2:
            layout_model = LayoutModelAdmin(Layout, self.admin_site)
            return layout_model.add_view(request)
        else:
            return super(LayoutTemplateModelAdmin,self).__call__(request, url)

    def get_form(self, request, obj=None):
        form = super(LayoutTemplateModelAdmin, self).get_form(request, obj)
        form.base_fields['tokens'].required = False
        form.base_fields['file'] = forms.FileField(required=False)

        form.base_fields['html'].widget =widgets.TinyMCE(extra_mce_settings={'theme_advanced_buttons1':'table,merge_cells,split_cells,delete_col,col_after,col_before,row_after,row_before,row_props,cell_props','theme_advanced_buttons2':'','plugins':'table','width':'93%','layout_edit':True})

        form.base_fields['html'].required = False
        def clean(self):
            if self.cleaned_data['file']:
                self.cleaned_data['html'] = ('').join([line for line in self.cleaned_data['file'].xreadlines()])
            parse = TableParser()

            self.cleaned_data['html'] = re.sub(r'<!-- token(\d+) -->', r' ',self.cleaned_data['html'])
            self.cleaned_data['html'] = mark_safe(parse.run(self.cleaned_data['html']))

            self.cleaned_data['tokens'] = ','.join(map(str,range(0,parse.num_tokens)))
            return self.cleaned_data

        form.clean = clean
        self.fieldsets = (
            (None, {'fields': ('name', 'tokens', 'image' )}),
            (   _(u'Layout'),
                {'fields': ('html', 'file',),'classes': ('collapse2', 'toggle2',)}
            ),
        )

        return form

    def _media(self):
        "Injects OpenLayers JavaScript into the admin."
        media = super(LayoutTemplateModelAdmin, self)._media()
        media.add_js(self.extra_js)
        media.add_css(self.extra_css)
        return media
    media = property(_media)

def setup_admin(clms_site):
    # Register auth models
    clms_site.register(LayoutTemplate, LayoutTemplateModelAdmin)
    clms_site.register(Layout, LayoutModelAdmin)
    clms_site.register(Content, ContentModelAdmin)

clms_site = CLMSSite()


# Cuando se desintegre se quitara
#admin.site.register(LayoutTemplate, LayoutTemplateModelAdmin)
#admin.site.register(Layout, LayoutModelAdmin)
#admin.site.register(Content, ContentModelAdmin)


# TID no quiere que salga esto en la administracion de Django
#admin.site.register(Panel, PanelModelAdmin)
#admin.site.register(PanelDispatcher, PanelDispatcherModelAdmin)
#admin.site.register(DefaultUserLayout, DefaultUserLayoutModelAdmin)
#admin.site.register(DefaultSettingsClms, DefaultSettingsClmsModelAdmin)
#admin.site.register(FavouriteLayout, FavouriteLayoutModelAdmin)


