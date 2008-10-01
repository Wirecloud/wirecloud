# -*- coding: utf-8 -*-

from django.contrib.auth import models as auth_app
from django.contrib.auth.management import create_superuser
from django.db.models.signals import post_syncdb

# Para que no pregunte la creacion de usuario admin,
# se crea automaticamente

post_syncdb.disconnect(sender=auth_app, dispatch_uid='django.contrib.auth.management.create_superuser')