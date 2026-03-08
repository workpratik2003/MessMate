"""
models.py — SQLAlchemy models for MessMate
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'owner', 'admin', 'member'
    session_id = db.Column(db.String(100), nullable=True)

    # Admin-specific
    slot_id = db.Column(db.Integer, db.ForeignKey('slots.id'), nullable=True)
    mess_name = db.Column(db.String(100), nullable=True)
    mess_address = db.Column(db.String(255), nullable=True)
    price_lunch = db.Column(db.Integer, nullable=True)
    price_dinner = db.Column(db.Integer, nullable=True)
    price_both = db.Column(db.Integer, nullable=True)

    # Member-specific
    plan = db.Column(db.String(20), nullable=True)  # 'lunch', 'dinner', 'both'
    start_date = db.Column(db.String(10), nullable=True)
    end_date = db.Column(db.String(10), nullable=True)
    extension_days = db.Column(db.Integer, default=0)
    otp = db.Column(db.String(6), nullable=True)
    otp_expires_at = db.Column(db.Float, nullable=True)  # timestamp

    # Relationships
    attendances = db.relationship('Attendance', backref='user', lazy=True, cascade='all, delete-orphan')
    absences = db.relationship('Absence', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        base = {
            'id': self.id,
            'name': self.name,
            'username': self.username,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
        }
        if self.role == 'owner':
            return base
        if self.role == 'admin':
            return {
                **base,
                'messName': self.mess_name,
                'messAddress': self.mess_address,
                'pricing': {
                    'lunch': self.price_lunch,
                    'dinner': self.price_dinner,
                    'both': self.price_both,
                },
            }
        # member
        return {
            **base,
            'address': self.address,
            'plan': self.plan,
            'startDate': self.start_date,
            'endDate': self.end_date,
            'extensionDays': self.extension_days,
            'otpActive': bool(self.otp),
            'attended': [a.date for a in self.attendances],
            'pendingAbsences': [a.to_dict() for a in self.absences],
        }


class Slot(db.Model):
    __tablename__ = 'slots'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    label = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='empty')  # 'empty', 'active'
    admin_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.String(30), default=lambda: datetime.utcnow().isoformat())

    def to_dict(self):
        admin = None
        if self.admin_id:
            admin_user = User.query.get(self.admin_id)
            if admin_user:
                admin = admin_user.to_dict()
        return {
            'id': self.id,
            'label': self.label,
            'status': self.status,
            'createdAt': self.created_at,
            'admin': admin,
        }


class Attendance(db.Model):
    __tablename__ = 'attendances'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)


class Absence(db.Model):
    __tablename__ = 'absences'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    from_date = db.Column(db.String(10), nullable=False)
    to_date = db.Column(db.String(10), nullable=False)
    days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(255), default='')
    approved = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'from': self.from_date,
            'to': self.to_date,
            'days': self.days,
            'reason': self.reason,
            'approved': self.approved,
        }
