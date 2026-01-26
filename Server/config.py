import os
import secrets
from datetime import timedelta
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

def get_cors_origins() -> Union[str, List[str]]:
    is_prod = os.getenv('FLASK_ENV') == 'production'
    
    cors_origins_env = os.getenv('CORS_ORIGINS', '')
    if cors_origins_env:
        origins = [origin.strip() for origin in cors_origins_env.split(',')]
        return origins
    
    if is_prod:
        return ['http://localhost:5173', 'http://127.0.0.1:5173']
    else:
        default_origins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://192.168.0.184:5173',
            'http://192.168.0.185:5173',
            'http://192.168.0.184:5173',
            'http://192.168.0.184:8000'
        ]
        return default_origins

def get_socketio_cors_origins() -> Union[str, List[str]]:
    is_prod = os.getenv('FLASK_ENV') == 'production'
    cors_origins_env = os.getenv('CORS_ORIGINS', '')
    
    if is_prod:
        if cors_origins_env:
            return [origin.strip() for origin in cors_origins_env.split(',')]
        else:
            return ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.0.184:5173']
    else:
        return '*'

def get_flask_config() -> dict:
    return {
        'SECRET_KEY': os.getenv('SECRET_KEY', secrets.token_hex(32)),
        'PERMANENT_SESSION_LIFETIME': timedelta(days=30),
        'SESSION_COOKIE_HTTPONLY': True,
        'SESSION_COOKIE_SECURE': os.getenv('FLASK_ENV') == 'production',
        'SESSION_COOKIE_SAMESITE': 'Lax'
    }

