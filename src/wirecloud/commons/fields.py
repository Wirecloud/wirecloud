import copy
import json

from django.core.exceptions import ValidationError
from django.db import models


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
        else:
            return None if self.null else {}

    def from_db_value(self, value, expression, connection, context):
        return self.to_python(value)

    def to_python(self, value):
        """
        Convert the input JSON value into python structures, raises
        django.core.exceptions.ValidationError if the data can't be converted.
        """
        if self.null and value is None:
            return None

        value = value or '{}'
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as err:
                raise ValidationError(str(err))
        else:
            return value

    def get_prep_value(self, value):
        """Convert value to JSON string before save"""
        try:
            return json.dumps(value)
        except Exception as err:
            raise ValidationError(str(err))

    def value_to_string(self, obj):
        """Converts obj to a string. Used to serialize the value of the field."""
        return self.value_from_object(obj)

    def value_from_object(self, obj):
        """Return value dumped to string."""
        return self.get_prep_value(super(JSONField, self).value_from_object(obj))
