# Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Database Setup

1. **Create PostgreSQL Database:**

```bash
# Using psql
psql -U postgres
CREATE DATABASE health_center_db;
\q
```

Or using createdb command:
```bash
createdb -U postgres health_center_db
```

2. **Configure Environment Variables:**

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_center_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=change_this_to_a_random_secret_key_in_production
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

3. **Run Database Migration:**

```bash
npm run migrate
```

This will:
- Create all database tables
- Set up relationships and indexes
- Insert sample health centers and patients

4. **Hash User Passwords:**

```bash
npm run seed
```

This will hash the default passwords for all users.

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 4: Access the Application

- **Frontend Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Default Login Credentials

- **Admin**: 
  - Username: `admin`
  - Password: `admin123`

- **Health Staff**:
  - Username: `doctor.kigali` or `nurse.butare`
  - Password: `admin123`

**⚠️ IMPORTANT**: Change these passwords immediately after first login!

## Africa's Talking Setup

1. **Sign up** at https://africastalking.com
2. **Get API credentials** from your dashboard
3. **Configure USSD service**:
   - Set callback URL: `https://your-domain.com/ussd`
   - Configure USSD code
4. **Update `.env`** with your credentials

## Production Deployment

### Using PM2

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Start with PM2
pm2 start server.js --name health-center-system
pm2 save
pm2 startup
```

### Environment Variables for Production

Make sure to set:
- Strong `JWT_SECRET`
- Production database credentials
- Africa's Talking production API keys
- Correct `FRONTEND_URL` and `API_URL`
- `NODE_ENV=production`

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database exists: `psql -U postgres -l`
- Verify credentials in `.env`

### Port Already in Use

- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

### Migration Errors

- Drop and recreate database if needed
- Check PostgreSQL logs for detailed errors

### Frontend Build Issues

- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (v16+ required)

## Next Steps

1. Configure Africa's Talking API
2. Set up USSD service
3. Customize health center data
4. Add more users as needed
5. Configure SMS reminders
6. Set up monitoring and logging

