# How to Create .env File on Windows

## Method 1: Using Notepad (Easiest)

### Step 1: Open Notepad
- Press `Win + R`
- Type `notepad` and press Enter

### Step 2: Copy and Paste This Content

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_center_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=24h

# Africa's Talking API (Optional - can add later)
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

### Step 3: Replace YOUR_POSTGRES_PASSWORD_HERE
- Find the line: `DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE`
- Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password
- Example: `DB_PASSWORD=mypassword123`

### Step 4: Save the File
1. Click **File** → **Save As**
2. Navigate to your project folder:
   ```
   C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System
   ```
3. **Important:** In "Save as type", select **"All Files (*.*)"**
4. File name: `.env` (with the dot at the beginning!)
5. Click **Save**

**Note:** If you can't see the file after saving, it's because Windows hides files starting with a dot. That's okay - it's there!

---

## Method 2: Using Command Prompt

### Step 1: Open Command Prompt
- Press `Win + R`
- Type `cmd` and press Enter

### Step 2: Navigate to Project Folder
```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
```

### Step 3: Create .env File
```cmd
echo. > .env
```

### Step 4: Edit with Notepad
```cmd
notepad .env
```

Then paste the content from Method 1, Step 2, and save.

---

## Method 3: Using PowerShell

### Step 1: Open PowerShell
- Press `Win + X` and select "Windows PowerShell"

### Step 2: Navigate to Project Folder
```powershell
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
```

### Step 3: Create .env File
```powershell
New-Item -Path .env -ItemType File
```

### Step 4: Edit with Notepad
```powershell
notepad .env
```

Then paste the content and save.

---

## Method 4: Using VS Code or Your IDE

If you're using VS Code or another code editor:

1. Right-click in the project folder
2. Select "New File"
3. Name it `.env`
4. Paste the content below
5. Save

---

## Complete .env File Content

Copy this entire content into your `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_center_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=24h

# Africa's Talking API (Optional - can add later)
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

---

## What to Replace

### 1. DB_PASSWORD (REQUIRED)
Replace `YOUR_POSTGRES_PASSWORD_HERE` with your PostgreSQL password.

**Example:**
```env
DB_PASSWORD=mypassword123
```

**How to find your PostgreSQL password:**
- It's the password you set when installing PostgreSQL
- Or the default might be `postgres` if you didn't change it
- Try connecting to PostgreSQL to verify: `psql -U postgres`

### 2. JWT_SECRET (REQUIRED for production)
For development, you can use the default, but for production, generate a random string.

**Generate a random secret:**
- Use an online generator: https://randomkeygen.com/
- Or use Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 3. Africa's Talking (OPTIONAL - for later)
Leave these as-is for now. You can add them later when you set up SMS:
```env
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
```

---

## Verify .env File Was Created

### Using Command Prompt:
```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
dir .env
```

You should see `.env` in the list.

### Using PowerShell:
```powershell
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\Health Center Appointment & Medication Reminder System"
Test-Path .env
```

Should return `True`.

### Using File Explorer:
1. Go to your project folder
2. Click "View" tab
3. Check "Hidden items" checkbox
4. You should see `.env` file

---

## Common Issues

### Issue: File saves as .env.txt
**Solution:**
- When saving in Notepad, change "Save as type" to "All Files (*.*)"
- Or rename it: `ren .env.txt .env`

### Issue: Can't see the file
**Solution:**
- Windows hides files starting with `.` by default
- Enable "Show hidden files" in File Explorer
- Or use Command Prompt: `dir /a` to see all files

### Issue: "Cannot find module 'dotenv'" error
**Solution:**
- Make sure `.env` file is in the root project folder (same level as `package.json`)
- Run `npm install` to ensure dotenv package is installed

---

## Quick Checklist

- [ ] `.env` file created in project root folder
- [ ] `DB_PASSWORD` replaced with your PostgreSQL password
- [ ] `JWT_SECRET` set (can use default for development)
- [ ] File saved as `.env` (not `.env.txt`)
- [ ] File is in the same folder as `package.json`

---

## Next Steps

After creating `.env` file:

1. **Verify it's correct:**
   ```cmd
   type .env
   ```
   (Shows the file content - check your password is there)

2. **Run migration:**
   ```cmd
   npm run migrate
   ```

3. **Hash passwords:**
   ```cmd
   npm run seed
   ```

4. **Start the server:**
   ```cmd
   npm run dev
   ```

---

## Security Note

⚠️ **Never commit `.env` file to Git!**

The `.gitignore` file should already exclude it, but double-check that `.env` is not tracked by Git.

