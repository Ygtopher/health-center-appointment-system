# SSL/HTTPS Setup Guide
**Health Center Appointment & Medication Reminder System**

## Overview

This guide covers setting up SSL/TLS certificates for secure HTTPS communication in production deployment.

---

## Prerequisites

- Domain name pointing to your server (e.g., `healthcenter.rw`)
- Ubuntu/Debian server with root access
- Nginx installed
- Ports 80 and 443 open in firewall

---

## Step 1: Install Certbot (Let's Encrypt)

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Verify Installation

```bash
certbot --version
```

---

## Step 2: Obtain SSL Certificate

### Using Certbot with Nginx

```bash
sudo certbot --nginx -d healthcenter.rw -d www.healthcenter.rw
```

**Follow the prompts**:
1. Enter email address for renewal notifications
2. Agree to Terms of Service
3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Manual Certificate Generation

```bash
sudo certbot certonly --nginx -d healthcenter.rw
```

Certificates will be saved to:
- Certificate: `/etc/letsencrypt/live/healthcenter.rw/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/healthcenter.rw/privkey.pem`

---

## Step 3: Configure Nginx

### Create Nginx Configuration

Create file: `/etc/nginx/sites-available/healthcenter`

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name healthcenter.rw www.healthcenter.rw;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name healthcenter.rw www.healthcenter.rw;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/healthcenter.rw/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthcenter.rw/privkey.pem;
    
    # SSL Configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL Session Configuration
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/healthcenter.rw/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Logging
    access_log /var/log/nginx/healthcenter_access.log;
    error_log /var/log/nginx/healthcenter_error.log;

    # Proxy to Node.js Backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Proxy Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Proxy Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable buffering for USSD/SMS callbacks
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static Files (if serving frontend from Nginx)
    location /static/ {
        alias /var/www/healthcenter/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health Check Endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/healthcenter /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 4: Update Application Configuration

### Update `.env` File

```env
# Production URLs with HTTPS
NODE_ENV=production
FRONTEND_URL=https://healthcenter.rw
API_URL=https://healthcenter.rw

# Force HTTPS redirects
FORCE_HTTPS=true

# Trust proxy (important for Nginx)
TRUST_PROXY=true
```

### Update `server.js` (Already Implemented)

The server already includes HTTPS enforcement middleware when `FORCE_HTTPS=true`.

---

## Step 5: Configure Automatic Certificate Renewal

### Test Renewal

```bash
sudo certbot renew --dry-run
```

### Automatic Renewal (Cron)

Certbot automatically creates a cron job or systemd timer. Verify:

```bash
# Check systemd timer
sudo systemctl status certbot.timer

# Or check cron
sudo cat /etc/cron.d/certbot
```

### Manual Renewal

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Step 6: Firewall Configuration

### Allow HTTPS Traffic

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 'Nginx Full'
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# Check status
sudo ufw status
```

### iptables (Alternative)

```bash
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

---

## Step 7: Verify SSL Configuration

### Test HTTPS

```bash
curl -I https://healthcenter.rw
```

**Expected Output**:
```
HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains; preload
...
```

### SSL Labs Test

Visit: https://www.ssllabs.com/ssltest/

Enter your domain: `healthcenter.rw`

**Target Grade**: A or A+

### Check Certificate Expiry

```bash
echo | openssl s_client -servername healthcenter.rw -connect healthcenter.rw:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Step 8: Update Africa's Talking Callback URLs

### Update USSD Callback URL

1. Login to Africa's Talking Dashboard
2. Navigate to USSD → Your Service
3. Update Callback URL to: `https://healthcenter.rw/ussd`

### Update SMS Callback URL

1. Navigate to SMS → Settings
2. Update Delivery Reports URL to: `https://healthcenter.rw/sms`

---

## Troubleshooting

### Certificate Not Found

**Error**: `nginx: [emerg] cannot load certificate`

**Solution**:
```bash
# Verify certificate files exist
sudo ls -l /etc/letsencrypt/live/healthcenter.rw/

# Check permissions
sudo chmod 644 /etc/letsencrypt/live/healthcenter.rw/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/healthcenter.rw/privkey.pem
```

### Mixed Content Warnings

**Issue**: Browser shows "Not Secure" despite HTTPS

**Solution**: Ensure all resources (CSS, JS, images) use HTTPS or relative URLs

### Certificate Renewal Fails

**Error**: `Failed to renew certificate`

**Solution**:
```bash
# Check if port 80 is accessible
sudo netstat -tlnp | grep :80

# Temporarily stop Nginx
sudo systemctl stop nginx

# Renew certificate
sudo certbot renew

# Start Nginx
sudo systemctl start nginx
```

---

## Security Best Practices

1. **Enable HSTS Preloading**: Submit domain to https://hstspreload.org/
2. **Monitor Certificate Expiry**: Set up alerts 30 days before expiration
3. **Use Strong Ciphers**: Keep SSL configuration updated
4. **Disable TLS 1.0/1.1**: Only use TLS 1.2 and 1.3
5. **Regular Security Audits**: Run SSL Labs test quarterly
6. **Keep Certbot Updated**: `sudo apt update && sudo apt upgrade certbot`

---

## Windows Deployment (Alternative)

For Windows servers, use:
- **IIS with Let's Encrypt**: https://github.com/win-acme/win-acme
- **Caddy Server**: Automatic HTTPS (https://caddyserver.com/)

---

**Last Updated**: December 16, 2025  
**System Version**: 1.0.0
