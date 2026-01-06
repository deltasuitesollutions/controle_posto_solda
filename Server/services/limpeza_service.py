"""
Service para limpeza de dados do banco
"""
from typing import Dict, Any
from backend.models.database import DatabaseConnection

def apagar_todos_registros() -> Dict[str, Any]:
    """Apaga todos os registros de produção"""
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se a tabela existe
        if not DatabaseConnection.table_exists('producao_registros'):
            raise Exception("Tabela producao_registros não encontrada.")
        
        # Contar registros antes de apagar
        cursor.execute("SELECT COUNT(*) FROM producao_registros")
        total = cursor.fetchone()[0]
        
        # Apagar todos os registros
        cursor.execute("DELETE FROM producao_registros")
        
        conn.commit()
        
        return {
            "total_apagado": total,
            "mensagem": f"{total} registro(s) apagado(s) com sucesso!"
        }
    except Exception as e:
        conn.rollback()
        raise Exception(f"Erro ao apagar registros: {str(e)}")
    finally:
        cursor.close()
        conn.close()

