# Health Center Appointment & Medication Reminder System

A comprehensive USSD and SMS-based platform for Rwandan health centers that enables patients to book medical appointments via basic mobile phones and receive automated reminders for both appointments and medications.

## Features

- **USSD Interface**: Multi-level menu in English and Kinyarwanda for appointment booking
- **Appointment Management**: Real-time availability checking, scheduling, and cancellation
- **Prescription Management**: Digital prescription recording with medication tracking
- **Automated Reminders**: SMS reminders for appointments (24h before) and medications
- **Health Staff Dashboard**: Web-based admin interface for managing appointments and patients
- **Patient Management**: National ID-based patient registration and verification

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: React.js with Bootstrap
- **SMS/USSD**: Africa's Talking API
- **Authentication**: JWT

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Health Center Appointment & Medication Reminder System"
```

### 2. Install dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Database Setup

Create a PostgreSQL database:

```bash
createdb health_center_db
```

Or using psql:

```sql
CREATE DATABASE health_center_db;
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_center_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
AT_SENDER_ID=HEALTH_RW

USSD_CODE=*384*123#
SMS_ENABLED=true
APPOINTMENT_REMINDER_HOURS=24
MEDICATION_REMINDER_MINUTES=30

FRONTEND_URL=http://localhost:3001
API_URL=http://localhost:3000
```

### 5. Run Database Migrations

```bash
npm run migrate
```

This will create all database tables and insert seed data.

### 6. Update Admin Password

```bash
npm run seed
```

This will hash the admin password. Default credentials:
- Username: `admin`
- Password: `admin123`

**Important**: Change the admin password after first login!

## Running the Application

### Development Mode

Start the backend server:

```bash
npm run dev
```

In a separate terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The backend will be available at `http://localhost:3000`
The frontend will be available at `http://localhost:3001`

### Production Mode

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend with PM2:

```bash
pm2 start server.js --name health-center-system
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Appointments
- `GET /api/appointments` - List appointments
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/slots` - Get available time slots

### Patients
- `GET /api/patients` - List patients
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/national-id/:nationalId` - Get patient by National ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `GET /api/prescriptions/:id` - Get prescription details
- `POST /api/prescriptions` - Create prescription
- `PUT /api/prescriptions/:id` - Update prescription

### Health Centers
- `GET /api/health-centers` - List health centers

### USSD
- `POST /ussd` - USSD endpoint (called by Africa's Talking)

## USSD Usage

1. Dial the USSD code (configured in `.env`)
2. Follow the menu prompts:
   - Book Appointment
   - Cancel Appointment
   - Check Appointment Status
   - Change Language

## Database Schema

The system includes the following main tables:
- `patients` - Patient information
- `health_centers` - Health facility details
- `appointments` - Appointment records
- `prescriptions` - Prescription records
- `medications` - Medication details
- `reminders` - Scheduled SMS reminders
- `users` - System users (admin, health staff)
- `audit_logs` - System audit trail
- `waitlist` - Appointment waitlist

## Africa's Talking Integration

1. Sign up at [Africa's Talking](https://africastalking.com)
2. Get your API key and username
3. Configure in `.env`:
   - `AT_API_KEY`
   - `AT_USERNAME`
   - `AT_SENDER_ID`

4. Set up USSD service:
   - Configure callback URL: `https://your-domain.com/ussd`
   - Set USSD code in your account

## Security Considerations

- Change default admin password
- Use strong JWT secret in production
- Enable HTTPS in production
- Configure CORS properly
- Use environment variables for sensitive data
- Regularly update dependencies

## Testing

Run tests (when implemented):

```bash
npm test
```

## Deployment

### Ubuntu Server with PM2

1. Install Node.js and PostgreSQL on Ubuntu server
2. Clone repository
3. Configure environment variables
4. Run migrations
5. Build frontend
6. Start with PM2:

```bash
pm2 start server.js --name health-center-system
pm2 save
pm2 startup
```

### Nginx Configuration

Example Nginx configuration for reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Project Structure

```
.
├── config/          # Configuration files
├── controllers/    # Request handlers
├── database/       # Database schema and migrations
├── frontend/       # React frontend application
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic services
├── utils/          # Utility functions
├── server.js       # Main server file
└── package.json    # Dependencies
```

## Support

For issues and questions, please contact the development team.

## License

[Your License Here]

## Acknowledgments

- Built for Rwandan health centers
- Supports Kinyarwanda language
- Compliant with Rwanda healthcare standards

