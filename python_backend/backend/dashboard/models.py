

from django.db import models

# Create your models here.
class SyncRecordCount(models.Model):
    userName = models.CharField(max_length=200)
    instanceName = models.CharField(max_length=200)
    tapName = models.CharField(max_length=200)
    stream = models.CharField(max_length = 200)
    recordCount = models.IntegerField()
    last_modified = models.DateTimeField(auto_now_add = True)