# RevIndex 🚗

A Win95/GeoCities-era vehicle tracking and forum system.  
Log maintenance, upload photos, track mods, decode VINs, and post build threads.

---

## Stack
| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 19 + Vite + Tailwind v4 |
| Backend  | Express + Node.js 20          |
| Database | SQLite (sqlite3)              |
| Uploads  | Multer (local disk)           |
| VIN API  | NHTSA vPIC (free, no key)     |
| Process  | PM2                           |

---

## Local Development

```bash
# Terminal 1 — backend
cd server && npm install && node server.js

# Terminal 2 — frontend
cd client && npm install && npm run dev
```

- Frontend → http://localhost:5173
- Backend  → http://localhost:5000

---

## Production Build (local test)

```bash
# Build React into server/public/
cd client && npm run build

# Run Express (serves API + React from one process)
cd ../server && NODE_ENV=production node server.js
```

Visit http://localhost:5000 — one URL, one server, no Vite needed.

---

## Deploy to AWS EC2

### 1 — Launch EC2 Instance

1. AWS Console → EC2 → **Launch Instance**
2. AMI: **Ubuntu 24.04 LTS** (free tier eligible)
3. Instance type: `t2.micro` (free) or `t3.small` (better)
4. Create + download a `.pem` key pair
5. Security Group inbound rules:

| Type       | Port | Source   |
|------------|------|----------|
| SSH        | 22   | My IP    |
| HTTP       | 80   | Anywhere |
| Custom TCP | 5000 | Anywhere |

6. Storage: 20 GB gp3
7. Note the **Public IPv4 address**

---

### 2 — Connect

```bash
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_EC2_IP
```

---

### 3 — Install Node + PM2

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
node -v && pm2 -v
```

---

### 4 — Upload Project

**Option A — Git (recommended)**
```bash
git clone https://github.com/YOUR_USERNAME/revindex.git
cd revindex
```

**Option B — SCP from Mac**
```bash
# On your Mac
zip -r revindex.zip SWE-PROJECT \
  --exclude "*/node_modules/*" \
  --exclude "*/dist/*" \
  --exclude "*/.git/*" \
  --exclude "*/server/public/*"

scp -i ~/Downloads/your-key.pem revindex.zip ubuntu@YOUR_EC2_IP:~/

# On EC2
unzip revindex.zip && mv SWE-PROJECT revindex && cd revindex
```

---

### 5 — Configure Environment

```bash
cd ~/revindex

# Backend env
cp server/.env.production.template server/.env
nano server/.env
```

Set these values:
```
PORT=5000
CLIENT_ORIGIN=http://YOUR_EC2_IP
NODE_ENV=production
```

---

### 6 — Build Frontend

```bash
cd ~/revindex/client
npm install
VITE_API_URL=http://YOUR_EC2_IP:5000 npm run build
# → outputs to server/public/
```

---

### 7 — Install Server Dependencies

```bash
cd ~/revindex/server
npm install
```

---

### 8 — Start with PM2

```bash
cd ~/revindex
pm2 start ecosystem.config.js --env production
pm2 save
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
# → copy and run the command PM2 prints

pm2 status
pm2 logs revindex
```

App live at: **http://YOUR_EC2_IP:5000**

---

### 9 — (Optional) Nginx on Port 80

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/revindex
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP;
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/revindex /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx
```

If using Nginx, rebuild with no port:
```bash
cd ~/revindex/client
VITE_API_URL=http://YOUR_EC2_IP npm run build
pm2 restart revindex
```

App live at: **http://YOUR_EC2_IP** (no :5000 needed)

---

### 10 — (Optional) HTTPS with Let's Encrypt

Requires a domain name pointing to your EC2 IP.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo systemctl reload nginx
```

---

## Updating the App

```bash
cd ~/revindex
git pull

# If client code changed
cd client && VITE_API_URL=http://YOUR_EC2_IP:5000 npm run build && cd ..

# Restart
pm2 restart revindex
```

---

## PM2 Commands

```bash
pm2 status              # App status
pm2 logs revindex       # Live logs
pm2 restart revindex    # Restart
pm2 stop revindex       # Stop
```

---

## File Structure

```
revindex/
├── client/                     # React + Vite (dev only)
│   ├── src/
│   │   ├── api/config.js       # VITE_API_URL
│   │   ├── components/         # ImageUpload, PhotoGallery, ModsTab, VinDecoder
│   │   └── pages/              # VehiclesPage, VehicleDetail, GaragePage, ThreadPage
│   └── vite.config.js          # builds → server/public/
├── server/
│   ├── db/database.js          # SQLite schema + auto-migration
│   ├── routes/                 # vehicles, logs, mods, photos, forum, vin, listings
│   ├── uploads/                # user-uploaded images (persisted on disk)
│   ├── public/                 # built React app (git-ignored, generated by build)
│   └── server.js               # Express entry — serves API + static React
├── ecosystem.config.js         # PM2 config
└── .github/workflows/ci.yml    # GitHub Actions
```
