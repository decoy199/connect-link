# ConnectLink Deployment Guide

## Prerequisites

- Python 3.8+ 
- Node.js 16+
- PostgreSQL (for production)
- Redis (optional, for caching)

## Environment Setup

1. Copy the environment example file:
```bash
cp backend/env.example backend/.env
```

2. Edit `.env` with your production values:
```bash
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/connectlink

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

## Backend Deployment

### 1. Setup Virtual Environment
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install psycopg2-binary  # For PostgreSQL
pip install redis  # For caching (optional)
```

### 3. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 5. Run Server
```bash
# Development
python manage.py runserver

# Production (with Gunicorn)
pip install gunicorn
gunicorn connectlink.wsgi:application --bind 0.0.0.0:8000
```

## Frontend Deployment

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Build for Production
```bash
npm run build
```

### 3. Serve Static Files
```bash
# Using serve
npm install -g serve
serve -s dist -l 3000

# Or using nginx (recommended for production)
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /path/to/backend/staticfiles/;
    }
}
```

## Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "connectlink.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: connectlink
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/connectlink
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

## Security Checklist

- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use HTTPS
- [ ] Set up proper CORS
- [ ] Configure email settings
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring

## Monitoring

### Logs
- Application logs: `backend/logs/django.log`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u your-service`

### Health Checks
- Backend: `GET /api/ping`
- Frontend: Check if static files load

## Backup

### Database Backup
```bash
pg_dump connectlink > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql connectlink < backup_20240101.sql
```

## Updates

1. Pull latest changes
2. Update dependencies
3. Run migrations
4. Restart services
5. Test functionality

## Troubleshooting

### Common Issues

1. **CORS errors**: Check CORS_ALLOWED_ORIGINS
2. **Database connection**: Verify DATABASE_URL
3. **Email not sending**: Check email credentials
4. **Static files 404**: Run collectstatic
5. **Permission errors**: Check file permissions

### Debug Mode
Set `DEBUG=True` temporarily to see detailed error messages.
