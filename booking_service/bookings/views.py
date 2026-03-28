import json
import razorpay
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.middleware.csrf import get_token

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Booking, Schedule, Bus, Route
from .serializers import ScheduleSerializer, MyBookingSerializer, BusSerializer, RouteSerializer


# --- ADMIN STATS ---

@api_view(['GET'])
def admin_stats(request):
    data = {
        "total_buses": Bus.objects.count(),
        "total_routes": Route.objects.count(),
        "total_users": User.objects.count(),
        "total_bookings": Booking.objects.count(),
    }
    return Response(data)


# --- HELPER ---

def get_razorpay_client():
    return razorpay.Client(auth=(
        getattr(settings, 'RAZORPAY_KEY_ID', 'fallback_id'),
        getattr(settings, 'RAZORPAY_KEY_SECRET', 'fallback_secret')
    ))


# --- AUTH VIEWS ---

@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            if not username or not password:
                return JsonResponse({"error": "Username and password required"}, status=400)

            user = authenticate(request, username=username, password=password)
            if user is None:
                return JsonResponse({"error": "Invalid credentials"}, status=401)

            login(request, user)
            get_token(request)

            return JsonResponse({
                "message": "Login successful",
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request"}, status=405)


@csrf_exempt
def register_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            email = data.get("email")
            password = data.get("password")

            if not username or not password:
                return JsonResponse({"error": "Username and password required"}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "Username already exists"}, status=400)

            user = User.objects.create_user(username=username, email=email, password=password)
            login(request, user)
            get_token(request)

            return JsonResponse({
                "message": "User registered successfully",
                "username": user.username,
                "is_staff": user.is_staff
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request"}, status=405)


@csrf_exempt
def current_user_view(request):
    get_token(request)
    if request.user.is_authenticated:
        return JsonResponse({
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff
        })
    return JsonResponse({"error": "Not authenticated"}, status=401)


@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"})


# --- BUS VIEWS ---

@csrf_exempt
@api_view(['GET', 'POST'])
def buses(request):
    if request.method == "GET":
        all_buses = Bus.objects.all()
        serializer = BusSerializer(all_buses, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        bus_number = request.data.get("bus_number")
        operator_name = request.data.get("operator_name")
        bus_type = request.data.get("bus_type", "AC Sleeper")
        total_seats = request.data.get("total_seats")

        if not operator_name:
            return Response({"error": "operator_name is required"}, status=400)
        if not total_seats:
            return Response({"error": "total_seats is required"}, status=400)

        bus = Bus.objects.create(
            bus_number=bus_number,
            operator_name=operator_name,
            bus_type=bus_type,
            total_seats=int(total_seats)
        )
        serializer = BusSerializer(bus)
        return Response(serializer.data, status=201)


@api_view(["DELETE"])
def delete_bus(request, bus_id):
    try:
        bus = Bus.objects.get(id=bus_id)
        bus.delete()
        return Response({"message": "Bus deleted"})
    except Bus.DoesNotExist:
        return Response({"error": "Bus not found"}, status=404)


# --- ROUTE VIEWS ---

@csrf_exempt
@api_view(['GET', 'POST'])
def routes(request):
    if request.method == "GET":
        all_routes = Route.objects.all()
        serializer = RouteSerializer(all_routes, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        source = request.data.get("source")
        destination = request.data.get("destination")
        distance_km = request.data.get("distance_km", 0)  # ✅ ADD

        if not source or not destination:
            return Response({"error": "source and destination are required"}, status=400)

        route = Route.objects.create(
            source=source,
            destination=destination,
            distance_km=int(distance_km)                   # ✅ ADD
        )
        serializer = RouteSerializer(route)
        return Response(serializer.data, status=201)

@api_view(["DELETE"])
def delete_route(request, route_id):
    try:
        route = Route.objects.get(id=route_id)
        route.delete()
        return Response({"message": "Route deleted"})
    except Route.DoesNotExist:
        return Response({"error": "Route not found"}, status=404)


# --- SCHEDULE VIEWS ---

@csrf_exempt
@api_view(['GET', 'POST'])
def manage_schedules(request):
    if request.method == "GET":
        schedules = Schedule.objects.all()
        serializer = ScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        bus_id = request.data.get("bus_id")
        route_id = request.data.get("route_id")
        departure_time = request.data.get("departure_time")
        arrival_time = request.data.get("arrival_time")   # ✅ ADD
        price = request.data.get("price")

        if not all([bus_id, route_id, departure_time, arrival_time, price]):
            return Response({"error": "All fields are required"}, status=400)

        try:
            bus = Bus.objects.get(id=bus_id)
            route = Route.objects.get(id=route_id)
        except Bus.DoesNotExist:
            return Response({"error": "Bus not found"}, status=404)
        except Route.DoesNotExist:
            return Response({"error": "Route not found"}, status=404)

        try:
            schedule = Schedule.objects.create(
                bus=bus,
                route=route,
                departure_time=departure_time,
                arrival_time=arrival_time,              # ✅ ADD
                price=price,
                available_seats=bus.total_seats
            )
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        serializer = ScheduleSerializer(schedule)
        return Response(serializer.data, status=201)

@api_view(["DELETE"])
def delete_schedule(request, schedule_id):
    try:
        schedule = Schedule.objects.get(id=schedule_id)
        schedule.delete()
        return Response({"message": "Schedule deleted"})
    except Schedule.DoesNotExist:
        return Response({"error": "Schedule not found"}, status=404)


@api_view(['GET'])
def search_schedules(request):
    source = request.GET.get('source')
    destination = request.GET.get('destination')

    schedules = Schedule.objects.all()

    if source:
        schedules = schedules.filter(route__source__icontains=source)
    if destination:
        schedules = schedules.filter(route__destination__iexact=destination)

    serializer = ScheduleSerializer(schedules, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def all_schedules(request):
    schedules = Schedule.objects.all()
    serializer = ScheduleSerializer(schedules, many=True)
    return Response(serializer.data)


# --- BOOKING VIEWS ---

@api_view(['POST'])
def create_booking(request):
    if not request.user.is_authenticated:
        return Response({"error": "Login required"}, status=401)

    schedule_id = request.data.get('schedule_id')
    passenger_name = request.data.get('passenger_name')

    try:
        seat_number = int(request.data.get('seat_number'))
    except (TypeError, ValueError):
        return Response({"error": "Seat number must be an integer."}, status=400)

    if not schedule_id or not passenger_name:
        return Response({"error": "All fields are required."}, status=400)

    try:
        with transaction.atomic():
            schedule = Schedule.objects.select_for_update().get(id=schedule_id)

            if schedule.departure_time < timezone.now():
                return Response({"error": "Cannot book past departure time."}, status=400)

            if seat_number <= 0 or seat_number > schedule.bus.total_seats:
                return Response({"error": "Invalid seat number."}, status=400)

            if Booking.objects.filter(schedule=schedule, seat_number=seat_number).exists():
                return Response({"error": "Seat already booked."}, status=400)

            if schedule.available_seats <= 0:
                return Response({"error": "No seats available."}, status=400)

            schedule.available_seats -= 1
            schedule.save()

            booking = Booking.objects.create(
                user=request.user,
                passenger_name=passenger_name,
                schedule=schedule,
                seat_number=seat_number
            )

        return Response({
            "message": "Booking successful.",
            "booking_id": booking.id
        }, status=status.HTTP_201_CREATED)

    except Schedule.DoesNotExist:
        return Response({"error": "Schedule not found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def my_bookings(request):
    if not request.user.is_authenticated:
        return Response({"error": "Login required"}, status=401)

    bookings = Booking.objects.filter(user=request.user)
    serializer = MyBookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def cancel_booking(request, booking_id):
    if not request.user.is_authenticated:
        return Response({"error": "Login required"}, status=401)

    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        schedule = booking.schedule

        with transaction.atomic():
            schedule.available_seats += 1
            schedule.save()
            booking.delete()

        return Response({"message": "Booking cancelled successfully."})
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)


# --- SEAT VIEWS ---

@api_view(['GET'])
def get_booked_seats(request, schedule_id):
    seats = Booking.objects.filter(
        schedule_id=schedule_id
    ).values_list('seat_number', flat=True)
    return Response({"booked_seats": list(seats)})


# --- PAYMENT VIEW ---

@api_view(['POST'])
def create_payment(request):
    if not request.user.is_authenticated:
        return Response({"error": "Login required"}, status=401)

    try:
        amount = request.data.get("amount", 500)
        client = get_razorpay_client()

        order = client.order.create({
            "amount": int(amount) * 100,
            "currency": "INR",
            "payment_capture": 1
        })

        return Response({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# --- USER VIEWS ---

@api_view(['GET'])
def users(request):
    all_users = User.objects.all().values('id', 'username', 'email', 'is_staff', 'date_joined')
    return Response(list(all_users))


@api_view(['DELETE'])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        # ✅ Prevent admin from deleting themselves
        if user == request.user:
            return Response({"error": "Cannot delete your own account."}, status=400)
        user.delete()
        return Response({"message": "User deleted"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)