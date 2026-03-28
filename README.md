# BusGo – Smart Bus Booking & Route Recommendation System

BusGo is a full-stack bus booking platform with a clean user interface, smart route discovery, seat booking, payment flow, booking history, admin tools, and an AI assistant for quick help.

It is designed to demonstrate a complete travel-booking journey from login to booking confirmation, along with a separate admin workflow for managing the platform.

---

## ✨ Key Features

* User registration and login
* Route search by source, destination, and date
* Smart route sorting by **Best Overall**, **Cheapest**, **Fastest**, and **Most Comfortable**
* Seat selection and booking flow
* Payment integration flow
* My Bookings page to track and manage reservations
* In-app chatbot / assistant for user support
* Admin dashboard for managing buses, routes, schedules, users, and analytics
* Dark, responsive UI built for a polished demo experience

---

## 📸 Project Story / Walkthrough

### 1) Landing Page

The user lands on the homepage and immediately sees the main booking form, popular routes, and the overall value of the platform.

### 2) Authentication

The user logs in using the login page to access booking features and personal booking history.

### 3) Search Journey

The user enters a source, destination, and travel date to search for available buses.

### 4) Search State

While the system is finding the best buses, a loading/searching view is shown to keep the experience clear.

### 5) Search Results

The results page shows buses ranked by different filters such as best overall, cheapest, fastest, and most comfortable.

### 6) No-Result Handling

If no buses are available for a route, the app shows a helpful empty state with suggestions and popular route shortcuts.

### 7) Seat Booking

The user opens the booking modal, enters passenger details, and selects a seat from the seat map.

### 8) Payment Flow

The booking proceeds through a secure payment experience powered by Razorpay.

### 9) Payment Success

After a successful payment, the user sees a confirmation screen with booking/payment details.

### 10) My Bookings

The user can view all active and past reservations in one place and manage upcoming trips.

### 11) BusGo Assistant

The chatbot helps users with common questions about routes, payments, and platform usage.

### 12) Admin Login

The admin enters the protected dashboard using the admin login flow.

### 13) Admin Dashboard

The admin panel provides management tools, analytics, and an assistant for platform operations.

---

## 🖼️ Screenshot Gallery

> Put all screenshots inside the `README-assets/` folder.

### Home / Landing

![Home Page](README-assets/00_homepage.png)

### Login

![User Login](README-assets/01_user_login.png)

### Route Search

![Search Route 1](README-assets/02_Search_Route.jpeg)
![Search Route 2](README-assets/03_Search_Route.jpeg)
![Search Route 3](README-assets/04_Search_Route.jpeg)
![Search Route 4](README-assets/05_Search_route.jpeg)
![Search Route 5](README-assets/06_Search_Route.jpeg)
![Search Route 6](README-assets/07_Search_Route.jpeg)

### Booking

![Book Seat](README-assets/08_Book_Seat.png)

### Payment

![Payment](README-assets/09_Payment.png)
![Payment Success](README-assets/10_Payment.png)

### My Bookings

![My Bookings](README-assets/11_My_Booking.jpeg)

### Chatbot

![Chatbot](README-assets/12_chatbot.png)

### Admin

![Admin Login](README-assets/13_admin_login.jpeg)
![Admin Dashboard](README-assets/14_Admin.png)

> If any filename changes, update the path here to match exactly.

---

## 🧰 Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React / UI icons
* Framer Motion (if used)

### Backend

* Node.js
* Express
* REST APIs
* JWT / session-based authentication (if used)

### Database

* MySQL / PostgreSQL / your configured database

### Integrations

* Razorpay for payment flow
* AI/chat assistant integration for support

---

## 📁 Project Structure

```bash
BUSGO/
├── booking_service/
├── chatbot/
├── frontend/
├── README-assets/
├── README.md
├── .env.example
└── PROJECT_NOTES.md
```

---

## 🚀 How to Run the Project

> Run each service from its own folder. If your script names are slightly different, use the commands defined in each `package.json`.

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd BUSGO
```

### 2) Install dependencies

#### Frontend

```bash
cd frontend
npm install
```

#### Booking service

```bash
cd ../booking_service
npm install
```

#### Chatbot service

```bash
cd ../chatbot
npm install
```

### 3) Configure environment variables

Create a `.env` file in the required service folders based on `.env.example`.

Example:

```env
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### 4) Start the backend services

Run the backend commands from each service folder.

Example:

```bash
# booking service
npm run dev

# chatbot service
npm run dev
```

### 5) Start the frontend

```bash
cd ../frontend
npm run dev
```

### 6) Open the app

After the servers start, open the local URL shown in the terminal, usually:

```bash
http://localhost:5173
```

---

## ⚙️ Environment Variables

A sample `.env.example` can include values like these:

```env
DB_NAME=booking_db
DB_USER=booking_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

> Replace these with your real local values before running the project.

---

## 🧪 Demo Flow

1. Open the homepage
2. Log in as a user
3. Search a route
4. Choose a bus from the results
5. Select a seat
6. Complete payment
7. Check the booking in **My Bookings**
8. Try the chatbot for support
9. Log in as admin and manage the system

---

## 🔮 Future Improvements

* Live bus tracking
* Real-time seat availability sync
* Email/SMS booking notifications
* Better analytics for admin dashboard
* Saved passenger profiles
* More intelligent route suggestions

---

## 🙋 Notes

* The screenshots in this README are used to explain the flow of the application.
* Some data shown in screenshots may be sample/demo data used for presentation.
* Update file names and paths if you rename any screenshot.

---

## 👨‍💻 Author

Built by **Tanu Namdeo**
