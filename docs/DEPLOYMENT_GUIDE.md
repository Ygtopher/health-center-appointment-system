# Deployment Guide - Production Readiness
**Health Center Appointment & Medication Reminder System**  
**Version**: 1.0.0 with Critical Enhancements

## Overview

This guide covers deploying the enhanced Health Center Appointment System to production with all critical features implemented:

✅ CBHI Integration  
✅ Patient Consent Tracking  
✅ Automated Database Backups  
✅ Medication Adherence Reporting  
✅ Essential Medicines Reference  
✅ Password Complexity Validation  

---

## Pre-Deployment Checklist

### 1. Database Migrations

Run all migrations to add new features:

```bash
cd "c:\Users\CHRISTOPHE\OneDrive\Desktop\model project\health_center_appointment_system"

# Run migrations
node database/run-migrations.js
```

**Expected Output**:
```
🚀 Starting database migrations...
📄 Running migration: migration_001_cbhi_consent.sql
✅ Migration completed: migration_001_cbhi_consent.sql
📄 Running migration: migration_002_adherence.sql
✅ Migration completed: migration_002_adherence.sql
✅ All migrations completed successfully!
```

### 2. Environment Configuration

Update `.env` file for production:

```env
# Environment
NODE_ENV=production

# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_center_db
DB_USER=postgres
DB_PASSWORD=<STRONG_PASSWORD>

# JWT
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_EXPIRES_IN=8h

# Africa's Talking
AT_API_KEY=<YOUR_API_KEY>
AT_USERNAME=<YOUR_USERNAME>
AT_SENDER_ID=HEALTH_RW

# USSD
USSD_CODE=*384*123#

# SMS
SMS_ENABLED=true
APPOINTMENT_REMINDER_HOURS=24
MEDICATION_REMINDER_MINUTES=30

# URLs (HTTPS in production)
FRONTEND_URL=https://healthcenter.rw
API_URL=https://healthcenter.rw

# Security
FORCE_HTTPS=true
TRUST_PROXY=true

# Backup
BACKUP_ENABLED=true
BACKUP_DIR=/var/backups/health_center_db
BACKUP_RETENTION_DAYS=30
```

### 3. Generate Strong Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Change Default Passwords

```sql
-- Connect to database
psql -U postgres -d health_center_db

-- Update admin password (use bcrypt hash)
UPDATE users SET password_hash = '<BCRYPT_HASH>' WHERE username = 'admin';
```

Generate bcrypt hash:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('YourNewStrongPassword123!', 10);
console.log(hash);
```

---

## Deployment Steps

### Step 1: Server Setup (Ubuntu 20.04/22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 2: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/healthcenter
sudo chown $USER:$USER /var/www/healthcenter

# Clone repository (or upload files)
cd /var/www/healthcenter
git clone <repository-url> .

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Database Setup

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE health_center_db;"

# Create database user
sudo -u postgres psql -c "CREATE USER healthcenter_user WITH PASSWORD '<STRONG_PASSWORD>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE health_center_db TO healthcenter_user;"

# Run schema and migrations
node database/migrate.js
node database/run-migrations.js
node database/seed.js
```

### Step 4: Configure Nginx with SSL

Follow the [SSL Setup Guide](./SSL_SETUP.md) to:
1. Install Certbot
2. Obtain SSL certificate
3. Configure Nginx
4. Enable HTTPS

### Step 5: Start Application with PM2

```bash
# Start application
pm2 start server.js --name health-center-system

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs

# Monitor application
pm2 monit
```

### Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

### Step 7: Setup Backup Directory

```bash
# Create backup directory
sudo mkdir -p /var/backups/health_center_db
sudo chown $USER:$USER /var/backups/health_center_db
sudo chmod 755 /var/backups/health_center_db

# Test manual backup
node scripts/backup.js
```

---

## Post-Deployment Verification

### 1. Test API Endpoints

```bash
# Health check
curl https://healthcenter.rw/health

# Test authentication
curl -X POST https://healthcenter.rw/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<YOUR_PASSWORD>"}'
```

### 2. Test USSD Flow

1. Configure Africa's Talking callback: `https://healthcenter.rw/ussd`
2. Dial USSD code from test phone
3. Verify menu displays correctly
4. Test appointment booking flow

### 3. Test SMS Reminders

```bash
# Check reminder scheduler logs
pm2 logs health-center-system | grep "reminder"
```

### 4. Verify Database Backups

```bash
# Check backup files
ls -lh /var/backups/health_center_db/

# Verify backup scheduler
pm2 logs health-center-system | grep "Backup scheduler"
```

### 5. Test New Features

**CBHI Registration**:
```bash
curl -X POST https://healthcenter.rw/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "nationalId": "1199980001234567",
    "firstName": "Jean",
    "lastName": "Mukamana",
    "phoneNumber": "+250788123456",
    "cbhiNumber": "1-01-01-12345",
    "preferredLanguage": "rw"
  }'
```

**Consent Tracking**:
```bash
curl -X POST https://healthcenter.rw/api/patients/<PATIENT_ID>/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "consent_type": "sms_notifications",
    "consent_given": true,
    "consent_method": "ussd"
  }'
```

**Adherence Report**:
```bash
curl -X GET "https://healthcenter.rw/api/adherence/report?start_date=2025-12-01&end_date=2025-12-31" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Monitoring and Maintenance

### Application Logs

```bash
# View all logs
pm2 logs health-center-system

# View only errors
pm2 logs health-center-system --err

# Clear logs
pm2 flush
```

### Database Monitoring

```bash
# Check database size
sudo -u postgres psql -d health_center_db -c "SELECT pg_size_pretty(pg_database_size('health_center_db'));"

# Check table sizes
sudo -u postgres psql -d health_center_db -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Backup Verification

```bash
# List recent backups
ls -lht /var/backups/health_center_db/ | head -10

# Test restore (monthly recommended)
# See BACKUP_RESTORE.md for detailed instructions
```

### SSL Certificate Renewal

```bash
# Check certificate expiry
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Manual renewal if needed
sudo certbot renew
sudo systemctl reload nginx
```

---

## Performance Optimization

### Database Indexing

Indexes are already created by migrations. Verify:

```sql
-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

### Connection Pooling

Already configured in `config/database.js`. Adjust if needed:

```javascript
const pool = new Pool({
    max: 20,  // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

### PM2 Cluster Mode (Optional)

For high traffic, use cluster mode:

```bash
pm2 delete health-center-system
pm2 start server.js --name health-center-system -i max
pm2 save
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs health-center-system --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart application
pm2 restart health-center-system
```

### Database Connection Errors

```bash
# Test database connection
psql -h localhost -U healthcenter_user -d health_center_db

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### USSD Not Working

1. Check Africa's Talking callback URL is HTTPS
2. Verify firewall allows incoming connections
3. Check USSD logs: `pm2 logs | grep USSD`
4. Test with ngrok for debugging

### Backup Fails

```bash
# Check backup directory permissions
ls -ld /var/backups/health_center_db/

# Check PostgreSQL PATH
which pg_dump

# Test manual backup
node scripts/backup.js
```

---

## Security Hardening

### 1. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 2. Install Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Database Security

```sql
-- Limit database user permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO healthcenter_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO healthcenter_user;
```

---

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)
- Deploy multiple application instances
- Use shared PostgreSQL database
- Implement Redis for session storage

### Database Scaling

- Enable PostgreSQL replication
- Use read replicas for reports
- Implement connection pooling
- Regular VACUUM and ANALYZE

---

## Support and Maintenance

### Regular Tasks

- **Daily**: Monitor application logs and error rates
- **Weekly**: Review backup status and test restore
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Performance audit, SSL Labs test

### Emergency Contacts

- **System Administrator**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **Africa's Talking Support**: support@africastalking.com

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**System Version**: 1.0.0 (Enhanced)  
**Last Updated**: December 16, 2025
