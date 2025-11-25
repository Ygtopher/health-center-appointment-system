# Windows Setup Guide - Database Setup

## Option 1: Using Command Prompt (CMD)

### Step 1: Open Command Prompt
- Press `Win + R`
- Type `cmd` and press Enter
- Or search for "Command Prompt" in Start menu

### Step 2: Navigate to PostgreSQL bin directory
```cmd
cd C:\Program Files\PostgreSQL\15\bin
```
*(Replace `15` with your PostgreSQL version number)*

### Step 3: Create the database
```cmd
createdb -U postgres health_center_db
```

You'll be prompted for the postgres user password. Enter it when asked.

### Alternative: Set password as environment variable first
```cmd
set PGPASSWORD=your_postgres_password
createdb -U postgres health_center_db
```

---

## Option 2: Using PowerShell (Recommended)

### Step 1: Open PowerShell
- Press `Win + X` and select "Windows PowerShell"
- Or search for "PowerShell" in Start menu

### Step 2: Navigate to PostgreSQL bin directory
```powershell
cd "C:\Program Files\PostgreSQL\15\bin"
```

### Step 3: Create the database
```powershell
.\createdb.exe -U postgres health_center_db
```

Or with password:
```powershell
$env:PGPASSWORD="your_postgres_password"
.\createdb.exe -U postgres health_center_db
```

---

## Option 3: Using psql (SQL Command Line)

### In CMD or PowerShell:

```cmd
psql -U postgres
```

Then in the psql prompt:
```sql
CREATE DATABASE health_center_db;
\q
```

---

## Option 4: Using pgAdmin (GUI - Easiest for Beginners)

### Step 1: Open pgAdmin
- Search for "pgAdmin" in Start menu
- Enter your master password when prompted

### Step 2: Connect to Server
- In the left panel, expand "Servers"
- Click on "PostgreSQL 15" (or your version)
- Enter password if prompted

### Step 3: Create Database
1. Right-click on "Databases"
2. Select "Create" → "Database..."
3. In the "Database" field, enter: `health_center_db`
4. Click "Save"

**Done!** ✅

---

## Finding Your PostgreSQL Installation Path

If you're not sure where PostgreSQL is installed:

1. **Check common locations:**
   - `C:\Program Files\PostgreSQL\15\bin`
   - `C:\Program Files\PostgreSQL\14\bin`
   - `C:\Program Files\PostgreSQL\13\bin`

2. **Or search for it:**
   - Open File Explorer
   - Go to `C:\Program Files\PostgreSQL\`
   - Look for folders with version numbers

3. **Or add PostgreSQL to PATH:**
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add: `C:\Program Files\PostgreSQL\15\bin`
   - (Replace 15 with your version)

---

## Verify Database Was Created

After creating the database, verify it exists:

### Using CMD/PowerShell:
```cmd
psql -U postgres -l
```

Look for `health_center_db` in the list.

### Using pgAdmin:
- Refresh the "Databases" folder
- You should see `health_center_db` listed

---

## Common Issues on Windows

### Issue: "createdb is not recognized"
**Solution:** 
- Use full path: `"C:\Program Files\PostgreSQL\15\bin\createdb.exe" -U postgres health_center_db`
- Or add PostgreSQL bin to your PATH (see above)

### Issue: "password authentication failed"
**Solution:**
- Make sure you're using the correct postgres user password
- Try: `psql -U postgres -h localhost` and enter password when prompted

### Issue: "PostgreSQL service not running"
**Solution:**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "postgresql-x64-15" (or your version)
4. Right-click → Start
5. Set Startup type to "Automatic"

---

## Recommended Approach for Windows Users

**If you're new to databases:** Use **pgAdmin (Option 4)** - it's the easiest!

**If you're comfortable with command line:** Use **PowerShell (Option 2)** - it's more powerful.

**If you prefer CMD:** Use **Option 1** - it works fine too!

---

## After Database Setup

Once the database is created, continue with:

```cmd
# Navigate to your project folder
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"

# Run migration
npm run migrate

# Hash passwords
npm run seed
```

---

## Quick Reference Commands

```cmd
REM Create database
createdb -U postgres health_center_db

REM Connect to database
psql -U postgres -d health_center_db

REM List all databases
psql -U postgres -l

REM Drop database (if you need to start over)
dropdb -U postgres health_center_db
```

