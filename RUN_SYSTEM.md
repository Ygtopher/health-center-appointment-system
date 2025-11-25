# How to Run the System - Step by Step

## Quick Start Commands

Open **Command Prompt (CMD)** or **PowerShell** and run these commands one by one:

### Step 1: Navigate to Project Folder
```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
```

### Step 2: Run Database Migration
```cmd
npm run migrate
```

This will:
- Create all database tables
- Set up relationships
- Insert sample data

**Expected output:**
```
Starting database migration...
Connected to PostgreSQL database
✓ Database schema created successfully
✓ Seed data inserted successfully
Migration completed successfully!
```

### Step 3: Hash User Passwords
```cmd
npm run seed
```

**Expected output:**
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

### Step 4: Start Backend Server

Open **Terminal 1** (keep it open):
```cmd
npm run dev
```

**Expected output:**
```
Connected to PostgreSQL database
Server running on port 3000
Environment: development
Reminder scheduler started
```

**✅ Backend is running!** Keep this terminal open.

### Step 5: Start Frontend

Open **Terminal 2** (new window):
```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
```

**✅ Frontend is running!**

### Step 6: Access the System

1. Open your web browser
2. Go to: **http://localhost:3001**
3. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`

---

## Troubleshooting

### If Migration Fails

**Error: "Connection refused" or "password authentication failed"**

1. Check PostgreSQL is running:
   - Press `Win + R`
   - Type `services.msc`
   - Find "postgresql-x64-15" (or your version)
   - Make sure it's "Running"

2. Check your `.env` file has correct password:
   ```cmd
   notepad .env
   ```
   - Verify `DB_PASSWORD=your_actual_password`

3. Test database connection:
   ```cmd
   psql -U postgres -d health_center_db
   ```
   - If this works, database is accessible

### If npm Commands Don't Work in PowerShell

**Use Command Prompt (CMD) instead:**
- Press `Win + R`
- Type `cmd` and press Enter
- Navigate to project folder
- Run commands there

### If Port 3000 or 3001 is Already in Use

**Option 1: Kill the process**
```cmd
netstat -ano | findstr :3000
```
Find the PID and kill it:
```cmd
taskkill /PID <pid_number> /F
```

**Option 2: Change port in `.env`**
```env
PORT=3001
```
(Then update FRONTEND_URL accordingly)

---

## Running in Two Terminals

You need **TWO terminal windows** open:

### Terminal 1 - Backend
```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
npm run dev
```
**Keep this running!**

### Terminal 2 - Frontend
```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System\frontend"
npm run dev
```
**Keep this running too!**

---

## Quick Checklist

Before running, make sure:
- [ ] PostgreSQL is installed and running
- [ ] Database `health_center_db` exists
- [ ] `.env` file is created with correct password
- [ ] Dependencies installed (`npm install` done)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)

---

## What You Should See

### Backend Terminal:
```
Connected to PostgreSQL database
Server running on port 3000
Environment: development
Reminder scheduler started
```

### Frontend Terminal:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3001/
```

### Browser:
- Login page at http://localhost:3001
- After login: Dashboard with statistics

---

## Stopping the System

1. **Stop Backend:** In Terminal 1, press `Ctrl + C`
2. **Stop Frontend:** In Terminal 2, press `Ctrl + C`

---

## Next Time You Run

After the first setup, you only need:
1. Start backend: `npm run dev`
2. Start frontend: `cd frontend && npm run dev`

No need to run migration/seed again unless you reset the database.

