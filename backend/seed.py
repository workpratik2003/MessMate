"""
seed.py — Populate MessMate database with demo data.
Run: python seed.py
"""
from app import app, bcrypt
from models import db, User, Slot, Attendance, Absence
from datetime import datetime, timedelta

def today():
    return datetime.now().strftime('%Y-%m-%d')

def add_days(d, n):
    return (datetime.strptime(d, '%Y-%m-%d') + timedelta(days=n)).strftime('%Y-%m-%d')

def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        pw = bcrypt.generate_password_hash('password').decode('utf-8')

        # ── Admins (each runs a mess) ─────────────────────────────────────
        sharma = User(
            id=1, name='Ramesh Sharma', username='sharma_admin',
            email='admin@mess.com', phone='9876543210', address='FC Road, Pune',
            password_hash=pw, role='admin',
            mess_name="Sharma's Mess", mess_address='Shop 4, FC Road, Pune – 411004',
            price_lunch=1800, price_dinner=1600, price_both=3000,
        )
        raj = User(
            id=6, name='Raj Sharma', username='raj_sharma',
            email='raj@kitchen.com', phone='9876500001', address='MG Road, Pune',
            password_hash=pw, role='admin',
            mess_name="Sharma's Kitchen", mess_address='Near Vaishali, MG Road, Pune – 411001',
            price_lunch=2000, price_dinner=1800, price_both=3400,
        )
        lakshmi = User(
            id=7, name='Lakshmi Iyer', username='annapurna_admin',
            email='lakshmi@annapurna.com', phone='9876500002', address='Koregaon Park, Pune',
            password_hash=pw, role='admin',
            mess_name="Annapurna Mess", mess_address='Lane 5, Koregaon Park, Pune – 411036',
            price_lunch=1500, price_dinner=1400, price_both=2600,
        )
        vikram = User(
            id=8, name='Vikram Desai', username='mumbai_admin',
            email='vikram@tiffins.com', phone='9876500003', address='Andheri West, Mumbai',
            password_hash=pw, role='admin',
            mess_name="Mumbai Tiffins", mess_address='Oshiwara, Andheri West, Mumbai – 400053',
            price_lunch=2200, price_dinner=2000, price_both=3800,
        )

        # ── Members ───────────────────────────────────────────────────────
        arjun = User(
            id=2, name='Arjun Sharma', username='arjun_sharma',
            email='arjun@example.com', phone='9123456780', address='Kothrud, Pune',
            password_hash=pw, role='member',
            plan='both', start_date=add_days(today(), -19), end_date=add_days(today(), 6),
            extension_days=5,
        )
        priya = User(
            id=3, name='Priya Menon', username='priya_menon',
            email='priya@example.com', phone='9123456781', address='Viman Nagar, Pune',
            password_hash=pw, role='member',
            plan='lunch', start_date=add_days(today(), -14), end_date=add_days(today(), 18),
            extension_days=2,
        )
        rohan = User(
            id=4, name='Rohan Verma', username='rohan_verma',
            email='rohan@example.com', phone='9123456782', address='Hinjewadi, Pune',
            password_hash=pw, role='member',
            plan='dinner', start_date=add_days(today(), -24), end_date=add_days(today(), 3),
            extension_days=0,
        )
        kavya = User(
            id=5, name='Kavya Nair', username='kavya_nair',
            email='kavya@example.com', phone='9123456783', address='Baner, Pune',
            password_hash=pw, role='member',
        )

        db.session.add_all([sharma, raj, lakshmi, vikram, arjun, priya, rohan, kavya])

        # ── Slots ─────────────────────────────────────────────────────────
        slots = [
            Slot(id=1, label='Slot 1 – Pune FC Road',  status='active', admin_id=1),
            Slot(id=2, label='Slot 2 – Available',      status='empty'),
            Slot(id=3, label='Slot 3 – Pune MG Road',   status='active', admin_id=6),
            Slot(id=4, label='Slot 4 – Pune KP',        status='active', admin_id=7),
            Slot(id=5, label='Slot 5 – Mumbai Andheri', status='active', admin_id=8),
        ]
        db.session.add_all(slots)

        # ── Attendance ────────────────────────────────────────────────────
        for i in range(1, 4):
            db.session.add(Attendance(user_id=2, date=add_days(today(), -i)))
        for i in range(1, 3):
            db.session.add(Attendance(user_id=3, date=add_days(today(), -i)))
        db.session.add(Attendance(user_id=4, date=add_days(today(), -1)))

        # ── Absences ──────────────────────────────────────────────────────
        db.session.add(Absence(
            user_id=3,
            from_date=add_days(today(), 1), to_date=add_days(today(), 2),
            days=2, reason='Family trip', approved=False,
        ))

        db.session.commit()
        print('Database seeded successfully!')
        print(f'   Database: messmate.db')
        print(f'   Users: {User.query.count()} (4 admins, 4 members)')
        print(f'   Slots: {Slot.query.count()}')
        print(f'   Attendances: {Attendance.query.count()}')
        print(f'   Absences: {Absence.query.count()}')
        print(f'\n   Demo passwords: "password" for all accounts')

if __name__ == '__main__':
    seed()
