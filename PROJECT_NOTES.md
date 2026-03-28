### 🧠 Day 1 Notes (Example Template)
🚀 Project Setup – Booking Service
1️⃣ Created Django Project

Command used:

django-admin startproject booking_service

Purpose:

Creates base Django structure

Contains settings, urls, wsgi, asgi

2️⃣ Project Structure Understanding
booking_service/
    manage.py
    booking_service/
        settings.py
        urls.py

✔ manage.py → project manager
✔ settings.py → config file
✔ urls.py → routing
✔ wsgi/asgi → deployment interface

3️⃣ Fixed ModuleNotFoundError

Problem:

ModuleNotFoundError: No module named 'myproject'

Reason:

Renamed project but internal references still old name.

Fix:

Replaced all myproject with booking_service

Updated:

settings.py

wsgi.py

asgi.py

Lesson:
When renaming Django project, update internal references.