# -*- coding: utf-8 -*-
# See license file (LICENSE.txt) for info about license terms.

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import NoArgsCommand

from clms.models import DefaultSettingsClms
from clms.models import Layout


def initialize():
    content_type = ContentType.objects.get(app_label='clms', model='layout')
    l = Layout.objects.all()[0]
    DefaultSettingsClms.objects.get_or_create(key='global_layout',
                                              value=str(l.pk),
                                              content_type=content_type)


class Command(NoArgsCommand):

    help = u"Initializing system"

    def handle_noargs(self, **options):
        initialize()
