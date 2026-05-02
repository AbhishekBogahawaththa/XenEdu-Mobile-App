# XenEdu Mobile App 📱

> **Sri Lanka's Smart A/L Tuition Management System**  
> React Native mobile app for XenEdu Mirigama Institute

---

## 🎓 About

XenEdu Mobile is a full-stack mobile application built for managing A/L tuition classes at XenEdu Mirigama. It provides separate portals for **Students**, **Teachers**, **Parents**, and **Admins** — all connected to a live backend deployed on Railway.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native + Expo |
| Backend API | Node.js + Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT (Access + Refresh Tokens) |
| AI Assistant | Groq (llama-3.3-70b-versatile) |
| Hosting | Railway.app |
| Build | EAS (Expo Application Services) |

---

## 📱 Features

### 🎓 Student Portal
- Dashboard with enrolled classes, attendance & fees overview
- Browse and view enrolled classes with fee records
- Pay fees (Cash / Card / Bank Transfer)
- View attendance history per class
- Student ID with QR Code & Barcode
- AI Tutor (Zenya) — ask questions about subjects
- Attendance alerts in profile section
- Change password

### 👨‍🏫 Teacher Portal
- Dashboard with assigned classes & upcoming sessions
- Mark student attendance via QR/Barcode scan
- Upload course work materials for students

### 👨‍👩‍👧 Parent Portal
- View child's attendance and fee status
- Monitor academic progress

### 🔧 Admin Portal
- **Dashboard** — system overview with stats
- **Students** — manage all students, suspend/activate
- **Classes** — create classes, manage sessions (auto-generate / manual add)
- **Fees** — view outstanding fees, approve/reject payment requests
- **Scan & Pay** — QR scan student → mark payment instantly
- **Teachers** — add/remove teachers, view assigned classes
- **Registrations** — approve/reject student registration requests
- **Attendance** — mark attendance per session, view at-risk students
- **Reports** — financial and attendance reports

### 🤖 AI Features
- **Zenya Chat** — AI assistant for students (powered by Groq)
- **FAQ Bot** — answers common questions on login screen

---

## 🏗️ Project Structure

```
XenEduMobile/
├── assets/
│   ├── icon.png
│   ├── adaptive-icon.png
│   └── splash-icon.png
├── src/
│   ├── api/
│   │   └── axios.js              # API client → Railway backend
│   ├── components/
│   │   └── ZenyaChat.jsx         # AI chat component
│   ├── navigation/
│   │   └── AppNavigator.jsx      # Role-based navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LandingScreen.jsx
│   │   │   ├── LoginScreen.jsx
│   │   │   └── RegisterScreen.jsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentClasses.jsx
│   │   │   ├── StudentAttendance.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   ├── StudentQRCode.jsx
│   │   │   └── StudentAITutor.jsx
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── TeacherAttendance.jsx
│   │   │   └── TeacherCourseWork.jsx
│   │   ├── parent/
│   │   │   └── ParentDashboard.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminStudents.jsx
│   │       ├── AdminClasses.jsx
│   │       ├── AdminFees.jsx
│   │       ├── AdminScanPay.jsx
│   │       ├── AdminReports.jsx
│   │       ├── AdminTeachers.jsx
│   │       ├── AdminRegistrations.jsx
│   │       └── AdminAttendance.jsx
│   ├── store/
│   │   └── authStore.js          # Zustand auth state
│   └── utils/
│       ├── constants.js          # Colors, subjects, etc.
│       └── notifications.js      # Expo push notifications
├── App.js
├── app.json
└── eas.json
```

---

## 🔗 Backend API

Live API: **https://xenedu-tuition-management-production.up.railway.app**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/register/apply` | Student self-registration |
| GET | `/api/dashboard/student` | Student dashboard data |
| GET | `/api/students` | All students (admin) |
| GET | `/api/classes` | All classes |
| GET | `/api/sessions/class/:id` | Sessions for a class |
| POST | `/api/attendance/session/:id` | Mark attendance |
| GET | `/api/fees/outstanding` | Outstanding fees |
| POST | `/api/payment-requests` | Submit payment |
| PATCH | `/api/payment-requests/:id/approve` | Approve payment |
| POST | `/api/ai/chat` | AI tutor chat |
| POST | `/api/ai/faq` | FAQ chatbot |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 18
- Expo CLI
- EAS CLI (`npm install -g eas-cli`)

### Run Locally
```bash
git clone https://github.com/AbhishekBogahawaththa/XenEdu-Mobile-App.git
cd XenEduMobile
npm install
npx expo start
```

Scan QR code with **Expo Go** app on your phone.

### Build APK
```bash
eas login
eas build -p android --profile preview
```

---

## 🔔 Push Notifications

The app uses **Expo Push Notifications** to send real-time alerts:

| Trigger | Recipient |
|---------|-----------|
| Payment Approved | Student |
| Payment Rejected | Student |
| Fee Reminder | Student (on dashboard load) |
| Attendance Warning | Student (below 80%) |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| Admin | Full system access |
| Teacher | Classes, attendance, course work |
| Student | Dashboard, classes, fees, AI tutor |
| Parent | Child monitoring |

---

## 🌐 Environment

Mobile app connects to:
```
https://xenedu-tuition-management-production.up.railway.app/api
```

Backend repo: [XenEdu-Tuition-Management](https://github.com/AbhishekBogahawaththa/XenEdu-Tuition-Management)

---

## 📄 License

© 2026 XenEdu Mirigama. All rights reserved.

---

<div align="center">
  <strong>Built for XenEdu Mirigama A/L Institute</strong>
</div>