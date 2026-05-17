import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'messmate-dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'messmate.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── OTP Settings ──────────────────────────────────────────────────────────
    OTP_LENGTH      = 4    # number of digits in the OTP
    OTP_TTL_SECONDS = 180  # OTP is valid for 3 minutes

    # ── Meal Window Settings (24-hour, server local time = IST) ───────────────
    # Lunch OTP can be generated between LUNCH_START_HOUR and LUNCH_END_HOUR
    LUNCH_START_HOUR  = 11   # 11:00 AM
    LUNCH_END_HOUR    = 15   # 3:00 PM
    # Dinner OTP can be generated between DINNER_START_HOUR and DINNER_END_HOUR
    DINNER_START_HOUR = 19   # 7:00 PM
    DINNER_END_HOUR   = 22   # 10:00 PM

    # ── Absence Rules ─────────────────────────────────────────────────────────
    # Members must submit absences at least this many hours before meal window
    ABSENCE_LEAD_HOURS   = 2
    # Default maximum extension days an admin slot can grant (owner can override per slot)
    DEFAULT_MAX_EXTENSION_DAYS = 15
