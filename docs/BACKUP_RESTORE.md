# Database Backup and Restore Guide
**Health Center Appointment & Medication Reminder System**

## Overview

The system includes automated database backup functionality with:
- Daily automated backups at 2:00 AM (Africa/Kigali timezone)
- 30-day retention policy
- Compression support (Linux/Unix)
- Manual backup and restore capabilities

---

## Automated Backups

### Configuration

Add to your `.env` file:

```env
# Backup Configuration
BACKUP_ENABLED=true
BACKUP_DIR=C:\backups\health_center_db  # Windows
# BACKUP_DIR=/var/backups/health_center_db  # Linux
BACKUP_RETENTION_DAYS=30
```

### Schedule

Backups run automatically every day at **2:00 AM CAT** (Central Africa Time).

### Backup Location

**Windows**: `C:\backups\health_center_db\`  
**Linux**: `/var/backups/health_center_db/`

Backup files are named: `health_center_db_YYYY-MM-DDTHH-MM-SS.sql` (or `.sql.gz` on Linux)

---

## Manual Backup

### Create Backup

```bash
# Navigate to project directory
cd "c:\Users\CHRISTOPHE\OneDrive\Desktop\model project\health_center_appointment_system"

# Run backup script
node scripts/backup.js
```

**Expected Output**:
```
Starting database backup...
Backup created: C:\backups\health_center_db\health_center_db_2025-12-16T10-30-00.sql (15.23 MB)
✅ Database backup completed successfully
```

### List All Backups

```javascript
const { listBackups } = require('./scripts/backup');

const backups = listBackups();
console.log(backups);
```

---

## Restore from Backup

### Automatic Restore

```javascript
const { restoreBackup } = require('./scripts/backup');

// Restore from specific backup file
await restoreBackup('C:\\backups\\health_center_db\\health_center_db_2025-12-16T10-30-00.sql');
```

### Manual Restore (PostgreSQL)

**Windows**:
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -U postgres -d health_center_db -f "C:\backups\health_center_db\health_center_db_2025-12-16T10-30-00.sql"
```

**Linux**:
```bash
# If compressed
gunzip -c /var/backups/health_center_db/health_center_db_2025-12-16T10-30-00.sql.gz | psql -U postgres -d health_center_db

# If uncompressed
psql -U postgres -d health_center_db -f /var/backups/health_center_db/health_center_db_2025-12-16T10-30-00.sql
```

---

## Disaster Recovery Procedure

### Scenario: Database Corruption or Data Loss

1. **Stop the application**:
   ```bash
   # If using PM2
   pm2 stop health-center-system
   
   # Or stop the server manually
   ```

2. **Identify the latest good backup**:
   ```bash
   # Windows
   dir C:\backups\health_center_db\ /O-D
   
   # Linux
   ls -lt /var/backups/health_center_db/
   ```

3. **Drop and recreate the database** (if necessary):
   ```sql
   -- Connect to PostgreSQL
   psql -U postgres
   
   -- Drop existing database
   DROP DATABASE health_center_db;
   
   -- Create fresh database
   CREATE DATABASE health_center_db;
   
   -- Exit
   \q
   ```

4. **Restore from backup**:
   ```bash
   # Windows
   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d health_center_db -f "C:\backups\health_center_db\health_center_db_2025-12-16T10-30-00.sql"
   
   # Linux
   psql -U postgres -d health_center_db -f /var/backups/health_center_db/health_center_db_2025-12-16T10-30-00.sql
   ```

5. **Verify restoration**:
   ```sql
   psql -U postgres -d health_center_db
   
   -- Check table counts
   SELECT COUNT(*) FROM patients;
   SELECT COUNT(*) FROM appointments;
   SELECT COUNT(*) FROM prescriptions;
   ```

6. **Restart the application**:
   ```bash
   pm2 start health-center-system
   # Or start manually
   ```

---

## Backup Verification

### Check Backup File Integrity

```bash
# Windows - Check file size
dir "C:\backups\health_center_db\health_center_db_2025-12-16T10-30-00.sql"

# Linux - Check file size
ls -lh /var/backups/health_center_db/health_center_db_2025-12-16T10-30-00.sql.gz

# Verify backup can be read
head -n 20 "C:\backups\health_center_db\health_center_db_2025-12-16T10-30-00.sql"
```

### Test Restore (Recommended Monthly)

1. Create a test database:
   ```sql
   CREATE DATABASE health_center_db_test;
   ```

2. Restore backup to test database:
   ```bash
   psql -U postgres -d health_center_db_test -f backup_file.sql
   ```

3. Verify data:
   ```sql
   \c health_center_db_test
   SELECT COUNT(*) FROM patients;
   ```

4. Drop test database:
   ```sql
   DROP DATABASE health_center_db_test;
   ```

---

## Retention Policy

- **Default**: 30 days
- **Automatic cleanup**: Runs after each backup
- **Modify retention**: Change `BACKUP_RETENTION_DAYS` in `.env`

### Manual Cleanup

```javascript
const { cleanupOldBackups } = require('./scripts/backup');

await cleanupOldBackups();
```

---

## Monitoring Backup Status

### Check Backup Logs

```bash
# View Winston logs
tail -f logs/combined.log | grep -i backup

# Or check for backup entries
grep "backup" logs/combined.log
```

### Verify Backup Schedule

```bash
# Check if backup scheduler is running
pm2 logs health-center-system | grep "Backup scheduler"
```

---

## Troubleshooting

### Backup Fails: "pg_dump: command not found"

**Solution**: Add PostgreSQL bin directory to PATH

**Windows**:
```cmd
set PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin
```

**Linux**:
```bash
export PATH=$PATH:/usr/lib/postgresql/16/bin
```

### Backup Fails: "Permission denied"

**Solution**: Ensure backup directory has write permissions

**Windows**:
```cmd
mkdir C:\backups\health_center_db
icacls C:\backups\health_center_db /grant Users:F
```

**Linux**:
```bash
sudo mkdir -p /var/backups/health_center_db
sudo chown $USER:$USER /var/backups/health_center_db
sudo chmod 755 /var/backups/health_center_db
```

### Backup File is Empty (0 bytes)

**Possible causes**:
- Database connection failed
- PGPASSWORD not set correctly
- Database name incorrect

**Solution**: Check database credentials in `.env` and test connection:
```bash
psql -h localhost -U postgres -d health_center_db -c "SELECT COUNT(*) FROM patients;"
```

---

## Best Practices

1. **Test restores regularly** (at least monthly)
2. **Store backups off-site** (copy to cloud storage or external drive)
3. **Monitor backup logs** for failures
4. **Verify backup file sizes** - sudden size changes may indicate issues
5. **Keep multiple backup copies** in different locations
6. **Document your backup schedule** and share with team

---

## Off-Site Backup (Recommended)

### Copy to Cloud Storage

**Example: Copy to Google Drive (Windows)**:
```cmd
robocopy C:\backups\health_center_db "G:\My Drive\HealthCenter_Backups" /MIR /R:3 /W:10
```

**Example: Copy to AWS S3 (Linux)**:
```bash
aws s3 sync /var/backups/health_center_db/ s3://your-bucket/health-center-backups/
```

### Schedule Off-Site Backup

Add to Windows Task Scheduler or Linux cron:

**Linux cron** (daily at 3:00 AM):
```bash
0 3 * * * aws s3 sync /var/backups/health_center_db/ s3://your-bucket/health-center-backups/
```

---

**Last Updated**: December 16, 2025  
**System Version**: 1.0.0
