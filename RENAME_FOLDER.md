# How to Rename the Project Folder

The folder is currently in use, so we need to close any programs using it first.

## Method 1: Using File Explorer (Easiest)

1. **Close all terminals/command prompts** that are in the project folder
2. **Close VS Code or any IDE** that has the folder open
3. **Open File Explorer**
4. Navigate to: `C:\Users\CHRISTOPHE\OneDrive\Desktop\model project`
5. **Right-click** on the folder: `Health Center Appointment & Medication Reminder System`
6. Select **"Rename"**
7. Type: `health_center_appointment_system`
8. Press **Enter**

## Method 2: Using Command Prompt (After Closing Programs)

1. **Close all terminals and IDEs** using the folder
2. Open **Command Prompt** (new window)
3. Run:
   ```cmd
   cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project"
   ren "Health Center Appointment & Medication Reminder System" health_center_appointment_system
   ```

## Method 3: Using PowerShell (After Closing Programs)

1. **Close all terminals and IDEs** using the folder
2. Open **PowerShell** (new window)
3. Run:
   ```powershell
   cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project"
   Rename-Item -Path "Health Center Appointment & Medication Reminder System" -NewName "health_center_appointment_system"
   ```

## After Renaming

Once renamed, navigate to the new folder:

```cmd
cd "C:\Users\CHRISTOPHE\OneDrive\Desktop\model project\health_center_appointment_system"
```

Then you can run:
```cmd
npm run dev
```

And for frontend:
```cmd
cd frontend
npm run dev
```

## Why Rename?

- ✅ No spaces in path = fewer issues with npm/node
- ✅ No special characters (&) = better compatibility
- ✅ Simpler path = easier to work with
- ✅ Standard naming convention (underscores instead of spaces)

## Important Notes

⚠️ **Before renaming:**
- Close all terminals in the project folder
- Close VS Code/any IDE with the folder open
- Close File Explorer windows showing the folder
- Stop any running servers (npm run dev, etc.)

✅ **After renaming:**
- Update any shortcuts or bookmarks
- The `.env` file and all code will still work
- All dependencies remain installed
- Just navigate to the new folder name

