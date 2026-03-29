# ai/urls.py

from django.urls import path
from .views import RecommendView, ChatView, PricePredictView

urlpatterns = [
    path("recommend/",      RecommendView.as_view(),    name="recommend"),
    path("chat/",           ChatView.as_view(),          name="chat"),
    path("predict-price/",  PricePredictView.as_view(), name="predict_price"),
]