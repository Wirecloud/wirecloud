from stdimage.fields import StdImageField

try:
    from south.modelsinspector import add_introspection_rules
    rules = [
      (
        (StdImageField,),
        [],
        {
            "size": ["size", {"default": None}],
            "thumbnail_size": ["thumbnail_size", {"default": None}],
        },
      )
    ]
    add_introspection_rules(rules, ["^stdimage\.fields"])
except ImportError:
    pass
