from wirecloud.platform.context.models import *  # noqa
from wirecloud.platform.iwidget.models import *  # noqa
from wirecloud.platform.markets.models import *  # noqa
from wirecloud.platform.preferences.models import *  # noqa
from wirecloud.platform.widget.models import *  # noqa
from wirecloud.platform.wiring.models import *  # noqa
from wirecloud.platform.workspace.models import *  # noqa

# TODO search a better way of implementing this

# Currently, Django doesn't support using translation catalogues from external
# modules, so we have to add the theme translation paths to the LOCALE_PATHS
# setting

from django.conf import settings
from wirecloud.platform.themes import get_available_themes, get_theme_dir, get_theme_metadata

if type(settings.LOCALE_PATHS) != list:
    settings.LOCALE_PATHS = list(settings.LOCALE_PATHS)

for theme in get_available_themes():
    theme_dir = get_theme_dir(get_theme_metadata(theme), 'locale')
    if theme_dir not in settings.LOCALE_PATHS:
        settings.LOCALE_PATHS.insert(0, theme_dir)
