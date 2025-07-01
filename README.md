# 🚄 Algeria Train Tracker

> A real-time, intelligent, and secure train tracking platform built to revolutionize public transport in Algeria.

---

## 🧠 Summary

**Algeria Train Tracker** is a smart web-based platform developed during a national hackathon to address the lack of digital infrastructure in Algeria's railway system. It enables travelers to:

- Track trains in real time
- Receive AI-powered trip guidance
- Purchase tickets securely online
- Access a user-friendly interface from any device

---

## 👥 Team

**Developed by:**  
Yakoubi Ahmed Moncef  
Alem Rayane  
Harnane Sami Youcef  
Guettaya mohamed Abderaouf  

**Submission Date:** July 1, 2025

---

## 🚧 Problem

Train passengers in Algeria frequently:

- Miss trains due to outdated or unavailable schedules
- Lack insight on travel time from their current location to stations
- Cannot easily purchase or refund tickets
- Suffer from low confidence in the train system's reliability

---

## 💡 Our Solution

A full-stack, responsive web application that:

✅ Simulates train movement across regions  
✅ Estimates arrival times with AI (Gemini API)  
✅ Calculates ticket pricing dynamically  
✅ Integrates with Supabase for secure card-based payments  
✅ Works seamlessly across mobile and desktop

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | HTML, CSS, JavaScript (`train3d.js`, `payment.js`) |
| Backend | Node.js (static file server) |
| BaaS | Supabase (Auth, Database, Edge Functions) |
| AI Integration | Google Gemini API (Travel Time Estimator) |

---

## 🌟 Features

- **🛰 Real-Time Train Tracking**: Simulates train paths using animated visualizations.
- **📍 GPS & AI Travel Advisor**: Gemini API checks if users can reach the station on time.
- **💳 Dynamic Smart Ticketing**: Calculates fare based on station count.
  - *Algiers Line*: 30 DA + 15 DA/station
  - *Oran Line*: 400 DA + 100 DA/station
- **🔐 Supabase Payments**: Handles secure balance verification and payment with real-time DB sync.

---

## 💾 Database Schema (Supabase)

```sql
CREATE TABLE cards (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  card_id VARCHAR(20) UNIQUE NOT NULL,
  ccv VARCHAR(3) NOT NULL,
  expire_month INT NOT NULL,
  expire_year INT NOT NULL,
  phone_number VARCHAR(15),
  balance DECIMAL(10, 2) DEFAULT 10000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔍 System Architecture

### UML Diagrams Included:

- **Use Case Diagram** — User actions: buy ticket, get travel advice, track train
- **Component Diagram** — Separation: Frontend, Supabase, Gemini API
- **Class Diagram** — Classes: `Train3DVisualization`, `PaymentProcessor`, etc.
- **Sequence Diagram** — Detailed ticket purchase workflow

---

## 🚀 Installation

### Prerequisites

- Node.js (v18+)
- Supabase Project & API Keys
- Gemini API Key (Optional)

### Setup

```bash
git clone https://github.com/kastx76/DOMinators_NCS_hack.git
cd DOMinators_NCS_hack
npm install
npm run dev
```
### Running Locally (on localhost)
Download the project files.
Open your terminal or command prompt.
Navigate to the project directory:
cd path/to/your/project
Start a local server using Python:
python -m http.server 8080
(You can replace 8080 with any available port number.)
Open your browser and visit:
http://127.0.0.1:8080

### Environment Variables

Create `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```
---
## 📸 Demo & Screenshots

> 📹 [Watch Demo Video](https://drive.google.com/drive/folders/1-YeTkYte1W15rdLAKkG6HyEyHi6fC0PR?usp=sharing)
---
## UI 

🎨 [Figma Design] (https://www.figma.com/design/kE5jJJvibgc5s0oYqbsiaq/figma_presentation?node-id=0-1&p=f&t=Za29TWQL2i0IwbVv-0)

---
## 📜 License


This project is licensed under the MIT License.  
© 2025 Yakoubi Ahmed Moncef, Alem Rayane, Harnane Sami Youcef, Guettaya  Mohamed Abderaouf
