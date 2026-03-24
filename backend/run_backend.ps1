# run_backend.ps1
# Helper script to start the Flask backend

# Go to the backend directory
cd "d:\MessMateV2\files\backend"

Write-Host "Setting up Python virtual environment..." -ForegroundColor Cyan

# Create venv if it doesn't exist
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "Created new virtual environment in \venv" -ForegroundColor Green
} else {
    Write-Host "Virtual environment found." -ForegroundColor DarkGray
}

# Activate venv
.\venv\Scripts\activate

# Upgrade pip first (fixes toml building errors for older Python installations)
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip -q

# Install dependencies (quietly)
Write-Host "Installing/Verifying dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt -q

# Seed the database if it's the first run
if (-not (Test-Path "messmate.db")) {
    Write-Host "First run detected: Seeding database..." -ForegroundColor Yellow
    python seed.py
}

Write-Host "`nStarting production WSGI server (waitress) on http://localhost:5000`n" -ForegroundColor Green
python app.py
