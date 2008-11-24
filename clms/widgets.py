# See license file (LICENSE.txt) for info about license terms.

import os
from django import forms
from django.forms import widgets
from django.forms.util import flatatt
from django.utils.encoding import StrAndUnicode, force_unicode
from django.utils.safestring import mark_safe
from django.utils.html import escape, conditional_escape
from django.utils.translation import gettext as _
from django.template.loader import render_to_string
from django.contrib.auth.models import User
from django.utils.encoding import smart_unicode
from django.utils.simplejson import JSONEncoder
from django.conf import settings

def load_javascript(src, script_id=None):
    """
    Returns the HTML code to load a javascript file inside the render method of a widget.

    src is the path to the javascript file inside the media/js directory.
    If script_id is None it will be created based in src

    Usage:
        def render():
            head = load_javascript('dir/file.js')
            html = (widget-dependent code)
            return mark_safe("".join([head, html]))
    """
    if not script_id:
        script_id = os.path.basename(src).replace('.', '_')
    js = u"""
    <script type="text/javascript">
        if (!document.getElementById('%(script_id)s')) {
            // if is not loaded yet we create
            var script = document.createElement('script');
            script.id = '%(script_id)s';
            script.src = '%(src)s';
            script.type = 'text/javascript';
            document.getElementsByTagName('head')[0].appendChild(script);
    }</script>
    """ % locals()
    return js

def load_stylesheet(src, css_id=None):
    """
    Returns the HTML code to load a stylesheet file inside the render method of a widget.

    src is the path to the stylesheet file inside the media directory.
    If css_id is None it will be created based in src

    Usage:
        def render():
            head = load_stylesheet('dir/file.css')
            html = (widget-dependent code)
            return mark_safe("".join([head, html]))
    """
    if not css_id:
        css_id = os.path.basename(src).replace('.', '_')
    js = u"""
    <script type="text/javascript">
        if (!document.getElementById('%(css_id)s')) {
            // if is not loaded yet we create
            var link = document.createElement('link');
            link.id = '%(css_id)s';
            link.href = '%(src)s';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(link);
    }</script>
    """ % locals()
    return js

class PanelWidget(widgets.Widget):
    def __init__(self,  attrs=None):
        # The 'rows' and 'cols' attributes are required for HTML correctness.
        self.attrs = {'cols': '100%', 'rows': '10'}

        if attrs:
            self.attrs.update(attrs)

    def render(self, name, value, attrs=None):
        return mark_safe(u'<a name="select_content"> <script src="/ezweb/clms/js/popup_list.js"></script>  <link href="/ezweb/clms/css/panel.css" type="text/css" rel="stylesheet"> <input type="hidden" name="%s" id="id_%s" value="%s"/> ''%s'''%(name, name, escape(value), value))


TINYMCE_JS = settings.MEDIA_URL + "js/cmsutils/widgets/tiny_mce/tiny_mce.js"

class TinyMCE(widgets.Textarea):
    """
    TinyMCE widget.

    You can customize the mce_settings by overwriting instance mce_settings,
    or add extra options using update_settings
    """
    mce_settings = dict(
        mode = "exact",
        theme = "advanced",
        width = "100%",
        height = 400,
        button_tile_map = True,
        plugins = "preview,paste",
        theme_advanced_disable = "",
        theme_advanced_buttons1 = "undo,redo,separator,cut,copy,paste,pastetext,pasteword,separator,preview,separator,bold,italic,underline,justifyleft,justifycenter,justifyright,bullist,numlist,outdent,indent",
        theme_advanced_buttons2 = "fontselect,fontsizeselect,link,image,code",
        theme_advanced_buttons3 = "",
        theme_advanced_buttons4 = "",
        theme_advanced_toolbar_location = "top",
        theme_advanced_toolbar_align = "left",
        extended_valid_elements = "hr[class|width|size|noshade],font[face|size|color|style],span[class|align|style]",
        file_browser_callback = "mcFileManager.filebrowserCallBack",
        theme_advanced_resize_horizontal = False,
        theme_advanced_resizing = False,
        apply_source_formatting = False,
        spellchecker_languages = "+Spanish=es",
        editor_deselector  = "mceNoEditor"
    )

    class Media: # this is for django admin interface
        js = (TINYMCE_JS,)

    def __init__(self, extra_mce_settings={}, print_head=False, *args, **kwargs):
        super(TinyMCE, self).__init__(*args, **kwargs)
        self.print_head = print_head
        # copy the settings so each instance of the widget can modify them
        # without changing the other widgets (e.g. instance vs class variables)
        self.mce_settings = TinyMCE.mce_settings.copy()
        self.mce_settings.update(extra_mce_settings)

    def update_settings(self, custom):
        return_dict = self.mce_settings.copy()
        return_dict.update(custom)
        return return_dict

    def with_head(self, on=True):
        self.print_head = on

    def render(self, name, value, attrs=None):
        if value is None: value = ''
        value = smart_unicode(value)
        final_attrs = self.build_attrs(attrs, name=name)

        self.mce_settings['elements'] = "id_%s" % name
        mce_json = JSONEncoder().encode(self.mce_settings)

        # Print script head once per instance
        if self.print_head:
            head = load_javascript(TINYMCE_JS)
        else:
            head = u''

        return mark_safe(u'''<textarea%s>%s</textarea>
                %s
                <script type="text/javascript">tinyMCE.init(%s)</script>''' % (flatatt(final_attrs), escape(value), head, mce_json))



class FilteredSelectMultipleWidget(forms.SelectMultiple):
    """
    An enhanced SelectMultiple widget with a JavaScript filter interface, for
    forms MultipleChoice* fields.

    To use the widget the files cmsutils/media/js/widgets/SelectBox.js and
    cmsutils/media/js/widgets/SelectFilter2.js and cmsutils/media/js/widgets/core.js and cmsutils/media/js/event.js must be in the media
    directory of the project.

    Based on django.contrib.admin.widgets.FilteredSelectMultiple

    """

    def __init__(self, verbose_name, is_stacked, print_head=True, attrs=None, choices=()):
        self.verbose_name = verbose_name
        self.is_stacked = is_stacked
        self.print_head = print_head
        super(FilteredSelectMultipleWidget, self).__init__(attrs, choices)


    def render(self, name, value, attrs=None, choices=()):
        if self.print_head:
            head = u''.join([
                         load_javascript(src='%sjs/cmsutils/widgets/core.js' % settings.MEDIA_URL),
                         load_javascript(src='%sjs/cmsutils/event.js' % settings.MEDIA_URL),
                         load_javascript(src='%sjs/cmsutils/widgets/SelectBox.js' % settings.MEDIA_URL),
                         load_javascript(src='%sjs/cmsutils/widgets/SelectFilter2.js' % settings.MEDIA_URL)])
        else:
            head = ''
        html = super(FilteredSelectMultipleWidget, self).render(name, value, attrs, choices)
        js = u"""<script type="text/javascript">addEvent(window, "load", function(e) {
            SelectFilter.init("id_%s", "%s", %s, "%s") });</script>
            """ %(name, self.verbose_name.replace('"', '\\"'), int(self.is_stacked), settings.ADMIN_MEDIA_PREFIX)

        return mark_safe(u''.join([head, html, js]))
