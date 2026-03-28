from rest_framework import serializers
from .models import Bus, Route, Schedule, Booking


class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        # ✅ Expose ALL fields the frontend needs
        fields = ["id", "bus_number", "operator_name", "bus_type", "total_seats"]


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'


class ScheduleSerializer(serializers.ModelSerializer):
    bus = BusSerializer()
    route = RouteSerializer()

    class Meta:
        model = Schedule
        fields = '__all__'


class MyBookingSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='schedule.bus.bus_number')
    operator_name = serializers.CharField(source='schedule.bus.operator_name')
    source = serializers.CharField(source='schedule.route.source')
    destination = serializers.CharField(source='schedule.route.destination')
    departure_time = serializers.DateTimeField(source='schedule.departure_time')
    price = serializers.FloatField(source='schedule.price')

    class Meta:
        model = Booking
        fields = [
            'id',
            'passenger_name',
            'seat_number',
            'bus_number',
            'operator_name',
            'source',
            'destination',
            'departure_time',
            'price',
        ]