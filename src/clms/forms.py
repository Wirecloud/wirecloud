# See license file (LICENSE.txt) for info about license terms.

from django import forms
from django.utils.translation import ugettext_lazy as _

from clms import widgets
from clms.models import Content


class ContentForm(forms.Form):

    def __init__(self, *args, **kwargs):
        super(ContentForm, self).__init__(*args, **kwargs)
        contents = Content.objects.all()
        choices_content = [(c.id, _(c.name)) for c in contents]

        self.fields['contents'] = forms.ChoiceField(choices=choices_content,)
        self.fields['contents'].widget = widgets.FilteredSelectMultipleWidget(
                                        verbose_name=_('Contents'),
                                        print_head=True,
                                        is_stacked=False,
                                        choices=choices_content)
