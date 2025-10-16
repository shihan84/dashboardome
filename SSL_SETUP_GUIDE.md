# OvenMediaEngine SSL/TLS Configuration with Let's Encrypt

## Overview
OvenMediaEngine supports SSL/TLS encryption for secure streaming. This guide shows how to configure OME with Let's Encrypt certificates.

## Prerequisites
- Domain name pointing to your server
- OvenMediaEngine installed and running
- Certbot installed for Let's Encrypt certificates

## Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# Or use snap
sudo snap install --classic certbot
```

## Step 2: Obtain Let's Encrypt Certificate

```bash
# Get certificate for your domain
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Or if you want to use webroot method (recommended for production)
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com -d www.yourdomain.com
```

## Step 3: Configure OME for SSL

### 3.1 Update Server.xml Configuration

Add TLS configuration to your VirtualHost:

```xml
<VirtualHosts>
    <VirtualHost>
        <Name>default</Name>
        <Host>
            <Names>
                <Name>yourdomain.com</Name>
                <Name>www.yourdomain.com</Name>
            </Names>
            <TLS>
                <CertPath>/etc/letsencrypt/live/yourdomain.com/fullchain.pem</CertPath>
                <KeyPath>/etc/letsencrypt/live/yourdomain.com/privkey.pem</KeyPath>
            </TLS>
        </Host>
        <!-- Your applications configuration -->
    </VirtualHost>
</VirtualHosts>
```

### 3.2 Enable TLS Ports

Ensure TLS ports are enabled in the Bind section:

```xml
<Bind>
    <Managers>
        <API>
            <Port>8081</Port>
            <TLSPort>8082</TLSPort>
            <WorkerCount>1</WorkerCount>
        </API>
    </Managers>
    
    <Publishers>
        <LLHLS>
            <Port>3334</Port>
            <TLSPort>3335</TLSPort>
            <WorkerCount>1</WorkerCount>
        </LLHLS>
        <WebRTC>
            <Port>3333</Port>
            <TLSPort>3336</TLSPort>
            <WorkerCount>1</WorkerCount>
        </WebRTC>
    </Publishers>
</Bind>
```

## Step 4: Certificate Auto-Renewal

### 4.1 Set up Cron Job

```bash
# Edit crontab
sudo crontab -e

# Add this line to renew certificates automatically
0 12 * * * /usr/bin/certbot renew --quiet --reload-hook "systemctl reload ovenmediaengine"
```

### 4.2 Test Renewal

```bash
# Test the renewal process
sudo certbot renew --dry-run
```

## Step 5: Firewall Configuration

```bash
# Allow HTTPS traffic
sudo ufw allow 443/tcp
sudo ufw allow 8082/tcp  # OME API TLS
sudo ufw allow 3335/tcp  # LLHLS TLS
sudo ufw allow 3336/tcp  # WebRTC TLS
```

## Step 6: Verify SSL Configuration

### 6.1 Test API Endpoint
```bash
curl -k https://yourdomain.com:8082/v1/vhosts
```

### 6.2 Test LLHLS Stream
```bash
curl -k https://yourdomain.com:3335/app/stream/playlist.m3u8
```

## Step 7: Update Dashboard Configuration

Update your dashboard to use HTTPS endpoints:

```javascript
// In your dashboard configuration
const omeApi = new OMEApiService('yourdomain.com', 8082, 'ovenmediaengine');
// Use HTTPS for secure connections
```

## Security Best Practices

### 1. Certificate Permissions
```bash
# Set proper permissions for certificate files
sudo chmod 600 /etc/letsencrypt/live/yourdomain.com/privkey.pem
sudo chmod 644 /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### 2. OME User Permissions
```bash
# Add OME user to ssl-cert group
sudo usermod -a -G ssl-cert ovenmediaengine
```

### 3. HSTS Headers
Add HSTS headers in your reverse proxy (nginx/apache) if using one.

## Troubleshooting

### Common Issues

1. **Certificate Not Found**
   - Check certificate path in Server.xml
   - Verify certificate files exist and are readable

2. **Permission Denied**
   - Check file permissions
   - Ensure OME user can read certificate files

3. **Port Conflicts**
   - Verify TLS ports are not used by other services
   - Check firewall settings

### Logs
```bash
# Check OME logs
sudo journalctl -u ovenmediaengine -f

# Check certificate logs
sudo certbot certificates
```

## Advanced Configuration

### Multiple Domains
```xml
<VirtualHosts>
    <VirtualHost>
        <Name>domain1</Name>
        <Host>
            <Names>
                <Name>domain1.com</Name>
            </Names>
            <TLS>
                <CertPath>/etc/letsencrypt/live/domain1.com/fullchain.pem</CertPath>
                <KeyPath>/etc/letsencrypt/live/domain1.com/privkey.pem</KeyPath>
            </TLS>
        </Host>
    </VirtualHost>
    
    <VirtualHost>
        <Name>domain2</Name>
        <Host>
            <Names>
                <Name>domain2.com</Name>
            </Names>
            <TLS>
                <CertPath>/etc/letsencrypt/live/domain2.com/fullchain.pem</CertPath>
                <KeyPath>/etc/letsencrypt/live/domain2.com/privkey.pem</KeyPath>
            </TLS>
        </Host>
    </VirtualHost>
</VirtualHosts>
```

### Wildcard Certificates
```bash
# Get wildcard certificate
sudo certbot certonly --manual --preferred-challenges dns -d "*.yourdomain.com" -d "yourdomain.com"
```

## Dashboard Integration

The OME Dashboard includes SSL certificate management features:
- View certificate status
- Monitor expiration dates
- Configure SSL settings
- Test SSL connections

Access these features through the Virtual Host Management section in the dashboard.
