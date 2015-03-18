try:
    __import__("social_auth.fields", {}, {}, ["JSONField"], 0)
except:
    south_utils = __import__("south.utils", {}, {}, ["ask_for_it_by_name"], 0)
    django_models = __import__("django.db.models", {}, {}, ["TextField"], 0)
    south_utils.ask_for_it_by_name.cache["social_auth.fields.JSONField"] = django_models.TextField
