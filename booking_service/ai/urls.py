# ai/urls.py

from django.urls import path
from .views import chatbot
from .views import RecommendView

urlpatterns = [
    path("chat/", chatbot),
    path("recommend/", RecommendView.as_view(), name="recommend"),
]