import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'messmate-dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'messmate.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
