# Quick Start Guide - How to Run the System

## Prerequisites

Before starting, make sure you have installed:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
3. **npm** (comes with Node.js)

Verify installations:
```bash
node --version    # Should show v16.x or higher
npm --version     # Should show 8.x or higher
psql --version    # Should show PostgreSQL 12.x or higher
```

## Step-by-Step Setup

### Step 1: Install Dependencies

Open a terminal in the project root directory and run:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Set Up PostgreSQL Database

**Option A: Using Command Line**

```bash
# Create database (Windows - use Command Prompt or PowerShell)
createdb -U postgres health_center_db

# Or if you need to specify password
set PGPASSWORD=your_password
createdb -U postgres health_center_db
```

**Option B: Using psql**

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, run:
CREATE DATABASE health_center_db;

# Exit psql
\q
```

**Option C: Using pgAdmin (GUI)**

1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name: `health_center_db`
5. Click "Save"

### Step 3: Configure Environment Variables

1. **Create `.env` file** in the root directory (same level as `package.json`)

2. **Copy this template** and fill in your values:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_center_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# Africa's Talking API (Optional for now - can add later)
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
AT_SENDER_ID=HEALTH_RW

# USSD Configuration
USSD_CODE=*384*123#

# SMS Configuration
SMS_ENABLED=true
APPOINTMENT_REMINDER_HOURS=24
MEDICATION_REMINDER_MINUTES=30

# Application URLs
FRONTEND_URL=http://localhost:3001
API_URL=http://localhost:3000
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

### Step 4: Run Database Migration

This will create all database tables and insert sample data:

```bash
npm run migrate
```

You should see:
```
Starting database migration...
✓ Database schema created successfully
✓ Seed data inserted successfully
Migration completed successfully!
```

### Step 5: Hash User Passwords

This will set up default user passwords:

```bash
npm run seed
```

You should see:
```
Starting database seeding...
✓ User passwords updated
  Default credentials:
  - admin / admin123
  - doctor.kigali / admin123
  - nurse.butare / admin123
⚠️  IMPORTANT: Change passwords after first login!
Seeding completed successfully!
```

### Step 6: Start the Backend Server

Open **Terminal 1** and run:

```bash
npm run dev
```

You should see:
```
Connected to PostgreSQL database
Server running on port 3000
Environment: development
Reminder scheduler started
```

**Keep this terminal open!**

### Step 7: Start the Frontend

Open **Terminal 2** (new terminal window) and run:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

**Keep this terminal open too!**

### Step 8: Access the System

1. **Open your web browser**
2. **Go to:** http://localhost:3001
3. **Login with:**
   - Username: `admin`
   - Password: `admin123`

## You're All Set! 🎉

The system is now running. You can:

- ✅ Access the web dashboard at http://localhost:3001
- ✅ Use the API at http://localhost:3000
- ✅ Check health status at http://localhost:3000/health

## Troubleshooting

### Database Connection Error

**Error:** `Connection refused` or `password authentication failed`

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   services.msc  # Look for PostgreSQL service
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

3. Check `.env` file has correct credentials

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
1. Find what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. Kill the process or change PORT in `.env`

### Module Not Found Errors

**Error:** `Cannot find module 'xxx'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# For frontend
cd frontend
rm -rf node_modules
npm install
```

### Migration Errors

**Error:** `relation already exists` or similar

**Solution:**
```bash
# Drop and recreate database (WARNING: Deletes all data!)
psql -U postgres
DROP DATABASE health_center_db;
CREATE DATABASE health_center_db;
\q

# Then run migration again
npm run migrate
npm run seed
```

## Running in Production

### Build Frontend

```bash
cd frontend
npm run build
cd ..
```

### Start with PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start server.js --name health-center-system

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### Environment Variables for Production

Make sure to set:
- `NODE_ENV=production`
- Strong `JWT_SECRET` (use a random 32+ character string)
- Production database credentials
- Africa's Talking production API keys
- Correct `FRONTEND_URL` and `API_URL`

## Next Steps

1. **Change default passwords** after first login
2. **Configure Africa's Talking** for SMS/USSD (see README.md)
3. **Add real health center data** via the dashboard
4. **Customize** as needed for your health centers

## Need Help?

- Check `README.md` for detailed documentation
- Check `SETUP.md` for more setup details
- Check `API_DOCUMENTATION.md` for API reference

