"""
app.py — MessMate Flask API
Mirrors the mock/flask.js behaviour with real SQLite + bcrypt.
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import Config
from models import db, User, Slot, Attendance, Absence
from datetime import datetime, timedelta
import uuid, time, math, random, re

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'])
bcrypt = Bcrypt(app)
db.init_app(app)

# ── Helpers ───────────────────────────────────────────────────────────────────
def today():
    return datetime.now().strftime('%Y-%m-%d')

def add_days(d, n):
    return (datetime.strptime(d, '%Y-%m-%d') + timedelta(days=n)).strftime('%Y-%m-%d')

def err(message, status=400):
    return jsonify({'error': message}), status

def valid_email(e):
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', e or ''))

def valid_phone(p):
    return bool(re.match(r'^[6-9]\d{9}$', p or ''))


# ── Meal-window helpers ───────────────────────────────────────────────────────
def current_hour():
    """Return the current hour in server local time (IST)."""
    return datetime.now().hour

def is_lunch_window():
    """True if it is currently within the lunch OTP generation window."""
    h = current_hour()
    return Config.LUNCH_START_HOUR <= h < Config.LUNCH_END_HOUR

def is_dinner_window():
    """True if it is currently within the dinner OTP generation window."""
    h = current_hour()
    return Config.DINNER_START_HOUR <= h < Config.DINNER_END_HOUR

def get_allowed_meal(plan):
    """
    Given a member's plan ('lunch', 'dinner', 'both'), return which meal type
    is currently within its OTP generation window, or None if outside all windows.
    For 'both' plans, lunch window takes priority if both overlap (they don't in practice).
    """
    if plan == 'lunch':
        return 'lunch' if is_lunch_window() else None
    if plan == 'dinner':
        return 'dinner' if is_dinner_window() else None
    if plan == 'both':
        if is_lunch_window():  return 'lunch'
        if is_dinner_window(): return 'dinner'
    return None

def next_window_description(plan):
    """Return a human-readable string of when the next window opens."""
    h = current_hour()
    if plan in ('lunch', 'both') and h < Config.LUNCH_START_HOUR:
        return f"Lunch window opens at {Config.LUNCH_START_HOUR}:00 AM"
    if plan in ('lunch', 'both') and h < Config.DINNER_START_HOUR:
        return f"Dinner window opens at {Config.DINNER_START_HOUR}:00 (7 PM)"
    return "No more OTP windows today. Come back tomorrow!"


# ── Absence lead-time helpers ─────────────────────────────────────────────────
def hours_until_next_window(plan):
    """
    Returns hours remaining until the NEXT relevant meal window.
    Used to enforce the 2-hour advance absence submission rule.
    """
    now = datetime.now()
    h = now.hour + now.minute / 60.0
    candidates = []
    if plan in ('lunch', 'both'):
        candidates.append(Config.LUNCH_START_HOUR)
    if plan in ('dinner', 'both'):
        candidates.append(Config.DINNER_START_HOUR)
    for start in sorted(candidates):
        if h < start:
            return start - h
    return 24 - h + min(candidates)  # wrap to next day


# ── Auto-deduct missed subscription days ──────────────────────────────────────
def deduct_missed_days(member):
    """
    For every day in the member's subscription that has already passed
    (from start_date up to yesterday), if the member did NOT attend AND
    did NOT have an approved absence, deduct that day from end_date.
    This is called lazily on every /api/me so no cron job is needed.
    """
    if not member.plan or not member.start_date or not member.end_date:
        return  # no active plan

    start = datetime.strptime(member.start_date, '%Y-%m-%d').date()
    yesterday = (datetime.now() - timedelta(days=1)).date()
    if start > yesterday:
        return  # subscription started today or in the future

    # Collect attended dates and approved-absence date ranges
    attended_dates = set(
        a.date for a in Attendance.query.filter_by(user_id=member.id).all()
    )
    approved_absences = Absence.query.filter_by(user_id=member.id, approved=True).all()
    absence_dates = set()
    for ab in approved_absences:
        cur = datetime.strptime(ab.from_date, '%Y-%m-%d').date()
        end = datetime.strptime(ab.to_date, '%Y-%m-%d').date()
        while cur <= end:
            absence_dates.add(cur)
            cur += timedelta(days=1)

    # Walk each day from start to yesterday; count missed days not yet deducted
    # We track via a helper column 'deducted_through' to avoid re-deducting same days
    deducted_through = None
    if hasattr(member, 'deducted_through') and member.deducted_through:
        try:
            deducted_through = datetime.strptime(member.deducted_through, '%Y-%m-%d').date()
        except ValueError:
            deducted_through = None

    check_from = (deducted_through + timedelta(days=1)) if deducted_through else start
    missed = 0
    cur = check_from
    while cur <= yesterday:
        if cur not in attended_dates and cur not in absence_dates:
            # Only deduct for days that were inside the subscription window at the time
            end_date_dt = datetime.strptime(member.end_date, '%Y-%m-%d').date()
            if cur <= end_date_dt:
                missed += 1
        cur += timedelta(days=1)

    if missed > 0:
        member.end_date = add_days(member.end_date, -missed)
        # Ensure end_date never goes below today
        if member.end_date < today():
            member.end_date = today()

    # Record watermark so we don't re-check old days on next request
    member.deducted_through = str(yesterday)
    db.session.commit()


# ── Session helpers ───────────────────────────────────────────────────────────
def current_user():
    uid = session.get('user_id')
    sid = session.get('session_id')
    if not uid or not sid:
        return None
    u = User.query.get(uid)
    if not u or u.session_id != sid:
        session.clear()
        return None
    # Feature 4: lazily deduct missed subscription days for members
    if u.role == 'member':
        deduct_missed_days(u)
    return u

def do_login(user):
    sid = str(uuid.uuid4())
    user.session_id = sid
    db.session.commit()
    session['user_id'] = user.id
    session['session_id'] = sid
    return user.to_dict()


# ══════════════════════════════════════════════════════════════════════════════
#  PUBLIC ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/', methods=['GET'])
def index():
    return jsonify({'status': 'online', 'message': 'MessMate API is running!'})

@app.route('/api/messes', methods=['GET'])
def list_messes():
    """Public — list all active messes with pricing."""
    admins = User.query.filter_by(role='admin').filter(User.price_lunch.isnot(None)).all()
    return jsonify([
        {
            'id': a.id,
            'messName': a.mess_name,
            'ownerName': a.name,
            'ownerPhone': a.phone,
            'messAddress': a.mess_address,
            'pricing': {'lunch': a.price_lunch, 'dinner': a.price_dinner, 'both': a.price_both},
        }
        for a in admins
    ])


# ══════════════════════════════════════════════════════════════════════════════
#  SHARED AUTH
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/me', methods=['GET'])
def me():
    u = current_user()
    if not u:
        return err('Not authenticated.', 401)
    return jsonify(u.to_dict())

@app.route('/api/logout', methods=['POST'])
def logout():
    u = current_user()
    if u:
        u.session_id = None
        db.session.commit()
    session.clear()
    return jsonify({'ok': True})


# ══════════════════════════════════════════════════════════════════════════════
#  OWNER
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/owner/register', methods=['POST'])
def owner_register():
    data = request.json or {}
    if User.query.filter_by(role='owner').first():
        return err('Owner account already exists.')
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    if not username or len(username) < 3:
        return err('Username must be at least 3 characters.')
    if not valid_email(email):
        return err('A valid email address is required.')
    if User.query.filter_by(email=email).first():
        return err('An account with this email already exists.')
    if User.query.filter_by(username=username).first():
        return err('Username is already taken.')
    if not valid_phone(phone):
        return err('A valid 10-digit Indian mobile number is required.')
    if len(password) < 6:
        return err('Password must be at least 6 characters.')
    owner = User(
        name=username, username=username, email=email, phone=phone,
        password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
        role='owner',
    )
    db.session.add(owner)
    db.session.commit()
    return jsonify(do_login(owner)), 201

@app.route('/api/owner/login', methods=['POST'])
def owner_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    u = User.query.filter_by(email=email, role='owner').first()
    if not u or not bcrypt.check_password_hash(u.password_hash, password):
        return err('Invalid credentials.', 401)
    return jsonify(do_login(u))


# ── Slots ─────────────────────────────────────────────────────────────────────

@app.route('/api/owner/slots', methods=['GET'])
def list_slots():
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    return jsonify({'slots': [s.to_dict() for s in Slot.query.all()]})

@app.route('/api/owner/slots', methods=['POST'])
def create_slot():
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    label = (request.json or {}).get('label', '').strip()
    if not label:
        return err('Slot label is required.')
    slot = Slot(label=label)
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict()), 201

@app.route('/api/owner/slots/<int:slot_id>', methods=['DELETE'])
def delete_slot(slot_id):
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    slot = Slot.query.get(slot_id)
    if not slot:
        return err('Slot not found.', 404)
    if slot.admin_id:
        admin = User.query.get(slot.admin_id)
        if admin:
            db.session.delete(admin)
    db.session.delete(slot)
    db.session.commit()
    return jsonify({'ok': True})

@app.route('/api/owner/slots/<int:slot_id>/assign', methods=['POST'])
def assign_admin(slot_id):
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    slot = Slot.query.get(slot_id)
    if not slot:
        return err('Slot not found.', 404)
    if slot.status == 'active':
        return err('Slot already has an admin.')
    data = request.json or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    mess_name = data.get('mess_name', '').strip()
    mess_address = data.get('mess_address', '').strip()
    if not username or len(username) < 3:
        return err('Username must be at least 3 characters.')
    if not valid_email(email):
        return err('A valid email address is required.')
    if User.query.filter_by(email=email).first():
        return err('An account with this email already exists.')
    if not valid_phone(phone):
        return err('A valid 10-digit Indian mobile number is required.')
    if len(password) < 6:
        return err('Password must be at least 6 characters.')
    if not mess_name:
        return err('Mess name is required.')
    if not mess_address:
        return err('Mess address is required.')
    admin = User(
        name=username, username=username, email=email, phone=phone,
        password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
        role='admin', slot_id=slot.id,
        mess_name=mess_name, mess_address=mess_address,
    )
    db.session.add(admin)
    db.session.flush()
    slot.admin_id = admin.id
    slot.status = 'active'
    db.session.commit()
    return jsonify({
        'slot': slot.to_dict(),
        'admin': admin.to_dict(),
        'credentials': {'username': admin.username, 'email': admin.email, 'password': password},
    }), 201

@app.route('/api/owner/slots/<int:slot_id>/remove', methods=['POST'])
def remove_admin(slot_id):
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    slot = Slot.query.get(slot_id)
    if not slot or not slot.admin_id:
        return err('No admin in this slot.')
    admin = User.query.get(slot.admin_id)
    if admin:
        db.session.delete(admin)
    slot.admin_id = None
    slot.status = 'empty'
    db.session.commit()
    return jsonify(slot.to_dict())


# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    u = User.query.filter_by(email=email, role='admin').first()
    if not u or not bcrypt.check_password_hash(u.password_hash, password):
        return err('Invalid credentials.', 401)
    return jsonify(do_login(u))

@app.route('/api/admin/pricing', methods=['POST'])
def set_pricing():
    u = current_user()
    if not u or u.role != 'admin':
        return err('Admin access required.', 403)
    data = request.json or {}
    lunch = data.get('lunch')
    dinner = data.get('dinner')
    both = data.get('both')
    if not isinstance(lunch, int) or lunch <= 0:
        return err('Lunch price must be a positive number.')
    if not isinstance(dinner, int) or dinner <= 0:
        return err('Dinner price must be a positive number.')
    if not isinstance(both, int) or both <= 0:
        return err('Both price must be a positive number.')
    u.price_lunch = lunch
    u.price_dinner = dinner
    u.price_both = both
    db.session.commit()
    return jsonify({'lunch': lunch, 'dinner': dinner, 'both': both})

@app.route('/api/users', methods=['GET'])
def get_all_users():
    u = current_user()
    if not u or u.role != 'admin':
        return err('Admin access required.', 403)
    members = User.query.filter_by(role='member').all()
    return jsonify([m.to_dict() for m in members])

@app.route('/api/otp/verify', methods=['POST'])
def verify_otp():
    admin = current_user()
    if not admin or admin.role != 'admin':
        return err('Admin access required.', 403)
    otp = str((request.json or {}).get('otp', '')).strip()
    # Feature 1: OTP is now 4 digits
    if len(otp) != Config.OTP_LENGTH:
        return err(f'Enter a valid {Config.OTP_LENGTH}-digit OTP.')
    member = User.query.filter_by(otp=otp, role='member').first()
    if not member:
        return err('Invalid OTP — no matching member found.')
    if time.time() > (member.otp_expires_at or 0):
        member.otp = None
        member.otp_expires_at = None
        db.session.commit()
        return err(f'OTP expired ({Config.OTP_TTL_SECONDS // 60} min limit).')
    t = today()
    if Attendance.query.filter_by(user_id=member.id, date=t).first():
        member.otp = None
        db.session.commit()
        return err(f"{member.name}'s attendance already marked today.")
    db.session.add(Attendance(user_id=member.id, date=t))
    member.otp = None
    member.otp_expires_at = None
    db.session.commit()
    return jsonify({'success': True, 'memberName': member.name})

@app.route('/api/otp/active', methods=['GET'])
def get_active_otps():
    now = time.time()
    members = User.query.filter(User.otp.isnot(None), User.otp_expires_at > now).all()
    return jsonify([{'id': m.id, 'name': m.name, 'otp': m.otp} for m in members])

@app.route('/api/absences/<int:absence_id>/approve', methods=['POST'])
def approve_absence(absence_id):
    admin = current_user()
    if not admin or admin.role != 'admin':
        return err('Admin access required.', 403)
    absence = Absence.query.get(absence_id)
    if not absence:
        return err('Absence not found.', 404)
    user = User.query.get(absence.user_id)
    # Feature 7: use per-slot max_extension_days instead of hardcoded 15
    slot = Slot.query.filter_by(admin_id=admin.id).first()
    max_ext = slot.max_extension_days if slot else Config.DEFAULT_MAX_EXTENSION_DAYS
    extra = min(absence.days, max_ext - (user.extension_days or 0))
    if extra <= 0:
        return err(f'Member has reached the extension limit of {max_ext} days.')
    absence.approved = True
    user.extension_days = (user.extension_days or 0) + extra
    user.end_date = add_days(user.end_date or today(), extra)
    db.session.commit()
    return jsonify({'ok': True, 'daysExtended': extra})

@app.route('/api/absences/<int:absence_id>/reject', methods=['POST'])
def reject_absence(absence_id):
    absence = Absence.query.get(absence_id)
    if not absence:
        return err('Absence not found.', 404)
    db.session.delete(absence)
    db.session.commit()
    return jsonify({'ok': True})


# ══════════════════════════════════════════════════════════════════════════════
#  MEMBER
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/register/member', methods=['POST'])
def member_register():
    data = request.json or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    password = data.get('password', '')
    if not name or len(name) < 2:
        return err('Full name is required (min. 2 characters).')
    if not valid_email(email):
        return err('A valid email address is required.')
    if User.query.filter_by(email=email).first():
        return err('An account with this email already exists.')
    if not valid_phone(phone):
        return err('A valid 10-digit Indian mobile number is required.')
    if User.query.filter_by(phone=phone).first():
        return err('An account with this phone number already exists.')
    if len(password) < 6:
        return err('Password must be at least 6 characters.')
    username = name.lower().replace(' ', '_')
    member = User(
        name=name, username=username, email=email, phone=phone,
        address=address,
        password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
        role='member',
    )
    db.session.add(member)
    db.session.commit()
    return jsonify(do_login(member)), 201

@app.route('/api/login', methods=['POST'])
def member_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    u = User.query.filter_by(email=email, role='member').first()
    if not u or not bcrypt.check_password_hash(u.password_hash, password):
        return err('Invalid email or password.', 401)
    return jsonify(do_login(u))

@app.route('/api/plan/purchase', methods=['POST'])
def purchase_plan():
    u = current_user()
    if not u:
        return err('Not logged in.', 401)
    plan = (request.json or {}).get('plan')
    if plan not in ('lunch', 'dinner', 'both'):
        return err('Invalid plan.')
    u.plan = plan
    u.start_date = today()
    u.end_date = add_days(today(), 30)
    db.session.commit()
    return jsonify(u.to_dict())

@app.route('/api/plan/renew', methods=['POST'])
def renew_plan():
    u = current_user()
    if not u:
        return err('Not logged in.', 401)
    plan = (request.json or {}).get('plan')
    if plan not in ('lunch', 'dinner', 'both'):
        return err('Invalid plan.')
    base = u.end_date if (u.end_date and u.end_date > today()) else today()
    u.plan = plan
    u.end_date = add_days(base, 30)
    db.session.commit()
    return jsonify(u.to_dict())

@app.route('/api/otp/generate', methods=['POST'])
def generate_otp():
    u = current_user()
    if not u:
        return err('Not logged in.', 401)
    if not u.plan:
        return err('You need an active plan to generate an OTP.')
    # Feature 3: enforce meal time windows
    allowed_meal = get_allowed_meal(u.plan)
    if not allowed_meal:
        desc = next_window_description(u.plan)
        return err(f'OTP generation is not available right now. {desc}')
    # Feature 1 & 2: 4-digit OTP, 3-min TTL, unlimited regeneration allowed
    max_val = 10 ** Config.OTP_LENGTH - 1
    min_val = 10 ** (Config.OTP_LENGTH - 1)
    otp = str(random.randint(min_val, max_val))
    u.otp = otp
    u.otp_expires_at = time.time() + Config.OTP_TTL_SECONDS
    db.session.commit()
    return jsonify({
        'otp': otp,
        'otpExpiresAt': u.otp_expires_at,
        'ttlSeconds': Config.OTP_TTL_SECONDS,
        'mealType': allowed_meal,
    })

@app.route('/api/absences', methods=['POST'])
def submit_absence():
    u = current_user()
    if not u:
        return err('Not logged in.', 401)
    data = request.json or {}
    from_date = data.get('from', '')
    to_date = data.get('to', '')
    reason = data.get('reason', '')
    try:
        from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_dt   = datetime.strptime(to_date,   '%Y-%m-%d').date()
        days = (to_dt - from_dt).days + 1
    except ValueError:
        return err('Invalid dates.')
    if days <= 0:
        return err('End date must be on or after start date.')
    # Feature 6: absence dates must be strictly in the future (tomorrow or later)
    tomorrow = (datetime.now() + timedelta(days=1)).date()
    if from_dt < tomorrow:
        return err('Absence must start from tomorrow or a future date.')
    # Validate dates within subscription window
    if u.end_date and to_date > u.end_date:
        return err('Absence end date cannot exceed your subscription end date.')
    # Feature 5: must be submitted at least ABSENCE_LEAD_HOURS before the next meal window
    if from_dt == tomorrow:
        hrs_left = hours_until_next_window(u.plan)
        if hrs_left < Config.ABSENCE_LEAD_HOURS:
            return err(
                f'Absences for tomorrow must be submitted at least '
                f'{Config.ABSENCE_LEAD_HOURS} hours before the meal window starts. '
                f'Only {hrs_left:.1f} hour(s) remaining.'
            )
    # Feature 7: use per-slot max extension limit
    admin_slot = None
    # (members don't have a direct slot FK; look up via the admin's slot)
    slot = None
    for s in Slot.query.filter_by(status='active').all():
        slot = s
        break  # simplification: single-admin setup; extend if multi-admin needed
    max_ext = slot.max_extension_days if slot else Config.DEFAULT_MAX_EXTENSION_DAYS
    remaining = max_ext - (u.extension_days or 0)
    if days > remaining:
        return err(f'Only {remaining} extension day(s) remaining (max {max_ext}).')
    absence = Absence(user_id=u.id, from_date=from_date, to_date=to_date, days=days, reason=reason)
    db.session.add(absence)
    db.session.commit()
    return jsonify(absence.to_dict()), 201


# ══════════════════════════════════════════════════════════════════════════════
#  OWNER SLOT SETTINGS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/owner/slots/<int:slot_id>/settings', methods=['GET'])
def get_slot_settings(slot_id):
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    slot = Slot.query.get(slot_id)
    if not slot:
        return err('Slot not found.', 404)
    return jsonify({'slotId': slot.id, 'maxExtensionDays': slot.max_extension_days})

@app.route('/api/owner/slots/<int:slot_id>/settings', methods=['POST'])
def update_slot_settings(slot_id):
    """Owner can update the max extension days for a specific slot."""
    u = current_user()
    if not u or u.role != 'owner':
        return err('Owner access required.', 403)
    slot = Slot.query.get(slot_id)
    if not slot:
        return err('Slot not found.', 404)
    data = request.json or {}
    max_ext = data.get('maxExtensionDays')
    if not isinstance(max_ext, int) or max_ext < 0:
        return err('maxExtensionDays must be a non-negative integer.')
    slot.max_extension_days = max_ext
    db.session.commit()
    return jsonify(slot.to_dict())


# ══════════════════════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Startup migration: add columns that may not exist in existing DB
        from sqlalchemy import text
        with db.engine.connect() as conn:
            for stmt in [
                "ALTER TABLE users ADD COLUMN deducted_through TEXT",
                "ALTER TABLE slots ADD COLUMN max_extension_days INTEGER DEFAULT 15",
            ]:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception:
                    pass  # column already exists — safe to ignore

    # Production-ready WSGI server
    try:
        from waitress import serve
    except ImportError:
        raise RuntimeError('waitress is required. Install via `pip install -r requirements.txt`.')

    print('Starting Waitress WSGI server on http://0.0.0.0:5000')
    serve(app, host='0.0.0.0', port=5000)
