from django.db import models

from wirecloud.platform.models import UserWorkspace


class Profile4CaaSt(models.Model):

    user_workspace = models.OneToOneField(UserWorkspace)
    id_4CaaSt = models.CharField(max_length=255, blank=False, null=False)

    class Meta:
        verbose_name = '4CaaSt Profile'
