from django.urls import path, include
from . import views
from .views import logout_view, current_user_view, create_payment, admin_stats

urlpatterns = [
    # search
    path('search/', views.search_schedules),

    # bookings
    path('book/', views.create_booking),
    path('cancel/<int:booking_id>/', views.cancel_booking),
    path('my-bookings/', views.my_bookings),

    # auth
    path('register/', views.register_view),
    path('login/', views.login_view),
    path('me/', current_user_view),
    path('logout/', logout_view),

    # schedules ✅ now points to manage_schedules (GET+POST)
    path("schedules/", views.manage_schedules),
    path("schedules/<int:schedule_id>/", views.delete_schedule),

    # routes ✅ was missing entirely
    path("routes/", views.routes),
    path("routes/<int:route_id>/", views.delete_route),

    # buses
    path("buses/", views.buses),
    path("buses/<int:bus_id>/", views.delete_bus),

    # seats
    path("booked-seats/<int:schedule_id>/", views.get_booked_seats),

    # payment
    path("create-payment/", create_payment),

    # admin
    path('admin/stats/', admin_stats),

    # users
    path("users/", views.users),
    path("users/<int:user_id>/", views.delete_user),

     path('api/ai/', include('ai.urls')),
]