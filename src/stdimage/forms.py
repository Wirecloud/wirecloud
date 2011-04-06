from django.forms.fields import ImageField

class StdImageFormField(ImageField):
    def clean(self, data, initial=None):
        if data != '__deleted__':
            return super(StdImageFormField, self).clean(data, initial)
        else:
            return '__deleted__'
