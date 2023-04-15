from django.contrib import admin

# Register your models here.
from .models import SyncRecordCount

admin.site.register(SyncRecordCount)