Prerequisites (macOS)
# If `python3` is missing
brew install python

# If Node/npm are missing
brew install node

# (Optional) Confirm versions
python3 --version
node --version
npm --version


Backend (Django + SQLite)
# 1) Go to backend
cd backend

# 2) Create & activate venv, install deps
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3) Make/apply migrations (includes app "core")
python manage.py makemigrations core
python manage.py migrate

# 4) Load demo data
python manage.py shell -c "from scripts.load_demo_data import run; run()"

# 5) Create admin (Django admin site)
python manage.py createsuperuser --username admin --email admin@example.com
＊up to you if you want to set your own user name use the one blow
python manage.py createsuperuser

# 6) Run server (http://localhost:8000)
python manage.py runserver 0.0.0.0:8000




Useful backend commands
# See which migrations are applied
python manage.py showmigrations core

# Reset DB (CAUTION: deletes data) if schema mismatch occurs
rm -f db.sqlite3
python manage.py migrate
python manage.py shell -c "from scripts.load_demo_data import run; run()"

# Open SQLite CLI
sqlite3 db.sqlite3
# Inside SQLite:
# .tables
# .schema core_question
# SELECT COUNT(*) FROM core_question;
# .quit




#####################################################

Frontend (React + Vite + Tailwind)
# New terminal tab/window at project root
cd frontend
npm install

# Dev server (http://localhost:5173)
npm run dev




If you still see 500 errors
# Make sure new fields are migrated (e.g., Notification.question, Question.auto_awarded)
# 1) Stop server, then:
cd backend
source .venv/bin/activate
python manage.py makemigrations core
python manage.py migrate

# 2) Restart server
python manage.py runserver 0.0.0.0:8000




Windows

Prerequisites (Windows)
# If Python 3 isn’t installed
winget install -e --id Python.Python.3.12

# If Node.js isn’t installed (LTS recommended)
winget install -e --id OpenJS.NodeJS.LTS

# (Optional) Confirm versions
py --version
node --version
npm --version


Backend (Django + SQLite)
# 1) Go to backend
cd backend

# 2) Create/activate venv and install deps
py -3 -m venv .venv
.\.venv\Scripts\Activate
py -m pip install --upgrade pip
py -m pip install -r requirements.txt

# 3) Make/apply migrations (includes app "core")
python manage.py makemigrations core
python manage.py migrate

# 4) Load demo data
python manage.py shell -c "from scripts.load_demo_data import run; run()"

# 5) Create admin (Django admin site)
python manage.py createsuperuser --username admin --email admin@example.com

# 6) Run server (http://localhost:8000)
python manage.py runserver 0.0.0.0:8000


Frontend (React + Vite + Tailwind)
# New PowerShell window at project root
cd frontend
npm install

# Dev server (http://localhost:5173)
npm run dev


If you see HTTP 500 from /api
# Ensure new fields are migrated (e.g., Notification.question, Question.auto_awarded)
cd backend
.\.venv\Scripts\Activate
python manage.py makemigrations core
python manage.py migrate
python manage.py runserver 0.0.0.0:8000




reset password:
go to the terminal after you send the link
there should be some link like this 
DEV reset link: http://localhost:5175/reset-password?uid=...&token=...