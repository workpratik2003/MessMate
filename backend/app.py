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

def current_user():
    uid = session.get('user_id')
    sid = session.get('session_id')
    if not uid or not sid:
        return None
    u = User.query.get(uid)
    if not u or u.session_id != sid:
        session.clear()
        return None
    return u

def do_login(user):
    sid = str(uuid.uuid4())
    user.session_id = sid
    db.session.commit()
    session['user_id'] = user.id
    session['session_id'] = sid
    return user.to_dict()

def valid_email(e):
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', e or ''))

def valid_phone(p):
    return bool(re.match(r'^[6-9]\d{9}$', p or ''))


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
    otp = str((request.json or {}).get('otp', ''))
    if len(otp) != 6:
        return err('Enter a valid 6-digit OTP.')
    member = User.query.filter_by(otp=otp, role='member').first()
    if not member:
        return err('Invalid OTP — no matching member found.')
    if time.time() > (member.otp_expires_at or 0):
        member.otp = None
        member.otp_expires_at = None
        db.session.commit()
        return err('OTP expired (5 min limit).')
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
    extra = min(absence.days, 15 - (user.extension_days or 0))
    absence.approved = True
    user.extension_days = (user.extension_days or 0) + extra
    user.end_date = add_days(user.end_date or today(), extra)
    db.session.commit()
    return jsonify({'ok': True})

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
    otp = str(random.randint(100000, 999999))
    u.otp = otp
    u.otp_expires_at = time.time() + 300
    db.session.commit()
    return jsonify({'otp': otp, 'otpExpiresAt': u.otp_expires_at, 'ttlSeconds': 300})

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
        days = (datetime.strptime(to_date, '%Y-%m-%d') - datetime.strptime(from_date, '%Y-%m-%d')).days + 1
    except ValueError:
        return err('Invalid dates.')
    if days <= 0:
        return err('End date must be on or after start date.')
    remaining = 15 - (u.extension_days or 0)
    if days > remaining:
        return err(f'Only {remaining} extension days remaining (max 15).')
    absence = Absence(user_id=u.id, from_date=from_date, to_date=to_date, days=days, reason=reason)
    db.session.add(absence)
    db.session.commit()
    return jsonify(absence.to_dict()), 201


# ══════════════════════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    # Production-ready WSGI server
    # Use waitress for deployment in preview and production environments.
    try:
        from waitress import serve
    except ImportError:
        raise RuntimeError('waitress is required for production serving. Install via `pip install -r requirements.txt`.')

    print('Starting Waitress WSGI server on http://0.0.0.0:5000')
    serve(app, host='0.0.0.0', port=5000)
