from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

class Bus(models.Model):
    bus_number = models.CharField(max_length=20)
    operator_name = models.CharField(max_length=100)
    bus_type = models.CharField(max_length=100)
    total_seats = models.IntegerField()
    rating = models.FloatField(default=0.0)
    amenities = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.bus_number} - {self.operator_name}"


class Route(models.Model):
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    distance_km = models.IntegerField()

    def __str__(self):
        return f"{self.source} to {self.destination}"
    
from django.core.exceptions import ValidationError

class Schedule(models.Model):
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    price = models.FloatField()
    available_seats = models.IntegerField()

    def clean(self):
        if self.arrival_time <= self.departure_time:
            raise ValidationError("Arrival time must be after departure time.")

    def save(self, *args, **kwargs):
        self.full_clean()  # triggers clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.bus} | {self.route}"


class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    passenger_name = models.CharField(max_length=100)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE)
    seat_number = models.IntegerField()

    def __str__(self):
        return f"{self.passenger_name} - Seat {self.seat_number}"