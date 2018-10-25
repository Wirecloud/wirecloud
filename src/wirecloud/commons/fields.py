import copy
import json

from django.core.exceptions import ValidationError
from django.db import connection, models

from django.utils.encoding import smart_text


class JSONField(models.TextField):
    """Simple JSON field that stores python structures as JSON strings
    on database.
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('default', {})
        super(JSONField, self).__init__(*args, **kwargs)

    def get_default(self):
        """
        Returns the default value for this field.
        """
        if self.has_default():
            if callable(self.default):
                return copy.deepcopy(self.default())
            return copy.deepcopy(self.default)
        if not self.empty_strings_allowed or (self.null and not connection.features.interprets_empty_strings_as_nulls):
            return None
        return ""

    def from_db_value(self, value, expression, connection, context):
        return self.to_python(value)

    def to_python(self, value):
        """
        Convert the input JSON value into python structures, raises
        django.core.exceptions.ValidationError if the data can't be converted.
        """
        if self.blank and not value:
            return {}
        value = value or '{}'
        if isinstance(value, bytes):
            value = str(value, 'utf-8')
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as err:
                raise ValidationError(str(err))
        else:
            return value

    def validate(self, value, model_instance):
        """Check value is a valid JSON string, raise ValidationError on
        error."""
        if isinstance(value, str):
            super(JSONField, self).validate(value, model_instance)
            try:
                json.loads(value)
            except Exception as err:
                raise ValidationError(str(err))

    def get_prep_value(self, value):
        """Convert value to JSON string before save"""
        try:
            return json.dumps(value)
        except Exception as err:
            raise ValidationError(str(err))

    def value_to_string(self, obj):
        """Return value from object converted to string properly"""
        return smart_text(self.get_prep_value(self._get_val_from_obj(obj)))

    def value_from_object(self, obj):
        """Return value dumped to string."""
        return self.get_prep_value(self._get_val_from_obj(obj))
