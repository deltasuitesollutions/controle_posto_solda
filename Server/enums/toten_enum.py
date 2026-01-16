"""
Enum para os IDs dos totens/Raspberry
"""
from enum import Enum


class TotenID(Enum):
    """Enum com os 12 IDs dos totens/Raspberry disponíveis"""
    TOTEN_1 = 1
    TOTEN_2 = 2
    TOTEN_3 = 3
    TOTEN_4 = 4
    TOTEN_5 = 5
    TOTEN_6 = 6
    TOTEN_7 = 7
    TOTEN_8 = 8
    TOTEN_9 = 9
    TOTEN_10 = 10
    TOTEN_11 = 11
    TOTEN_12 = 12
    
    @classmethod
    def listar_todos(cls):
        """Retorna lista com todos os totens disponíveis"""
        return [{"id": toten.value, "nome": f"Totem {toten.value}"} for toten in cls]
    
    @classmethod
    def valores_validos(cls):
        """Retorna lista com todos os valores válidos"""
        return [toten.value for toten in cls]
    
    @classmethod
    def is_valido(cls, valor: int) -> bool:
        """Verifica se um valor é um ID de toten válido"""
        return valor in cls.valores_validos()

