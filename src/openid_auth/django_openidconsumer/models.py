from django.db import models

class Nonce(models.Model):
    server_url = models.CharField(max_length=255)
    timestamp = models.IntegerField()
    salt = models.CharField(max_length=40)
    
    def __unicode__(self):
        return u"Nonce: %s" % self.id

class Association(models.Model):
    server_url = models.TextField(max_length=2047)
    handle = models.CharField(max_length=255)
    secret = models.TextField(max_length=255) # Stored base64 encoded
    issued = models.IntegerField()
    lifetime = models.IntegerField()
    assoc_type = models.TextField(max_length=64)
    def __unicode__(self):
        return "Association: %s, %s" % (self.server_url, self.handle)
