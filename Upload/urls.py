# -*- coding: utf-8 -*-

from django.conf.urls import url
from views import UploadView

urlpatterns = [
    url(r'^(?P<action>[a-zA-Z0-9_]+)$', UploadView.as_view()),
]
