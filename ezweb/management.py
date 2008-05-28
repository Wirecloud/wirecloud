# -*- coding: utf-8 -*-
from django.dispatch import dispatcher
from django.contrib.auth.management import create_superuser
from django.contrib.auth import models as auth_app
from django.db.models import signals

# Para que no pregunte la creacion de usuario admin,
# se crea automaticamente
dispatcher.disconnect(create_superuser, sender=auth_app,
                      signal=signals.post_syncdb)
