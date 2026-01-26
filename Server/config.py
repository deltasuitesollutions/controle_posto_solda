import os
import secrets
from datetime import timedelta
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

def generate_network_origins(
    base_ip: str,
    start: int,
    count: int,
    ports: list[int]
) -> list[str]:
    origins = []

    for i in range(start, start + count):
        for port in ports:
            origins.append(f"{base_ip}{i}:{port}")

    return origins


def get_cors_origins() -> Union[str, List[str]]:
    is_prod = os.getenv('FLASK_ENV') == 'production'

    # Se vier explícito no env, sempre prioriza
    cors_origins_env = os.getenv('CORS_ORIGINS')
    if cors_origins_env:
        return [origin.strip() for origin in cors_origins_env.split(',')]

    if not is_prod:
        return [
            'http://localhost:5173',
            'http://127.0.0.1:5173'
        ]

    # ===== PRODUÇÃO =====
    base_ip = os.getenv('NETWORK_BASE', 'http://192.168.0.')
    units = int(os.getenv('UNITS_COUNT', 12))
    ports = [int(p) for p in os.getenv('ALLOWED_PORTS', '5173').split(',')]

    network_origins = generate_network_origins(
        base_ip=base_ip,
        start=180,  # ex: começa no 192.168.0.180
        count=units,
        ports=ports
    )

    return network_origins

def get_socketio_cors_origins() -> Union[str, List[str]]:
    is_prod = os.getenv('FLASK_ENV') == 'production'

    if not is_prod:
        return '*'

    cors_origins_env = os.getenv('CORS_ORIGINS')
    if cors_origins_env:
        return [origin.strip() for origin in cors_origins_env.split(',')]

    base_ip = os.getenv('NETWORK_BASE', 'http://192.168.0.')
    units = int(os.getenv('UNITS_COUNT', 12))
    ports = [int(p) for p in os.getenv('ALLOWED_PORTS', '5173').split(',')]

    return generate_network_origins(
        base_ip=base_ip,
        start=180,
        count=units,
        ports=ports
    )


