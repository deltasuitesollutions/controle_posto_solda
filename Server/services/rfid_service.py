"""
Service para lógica de negócio de tags RFID
"""
from typing import Dict, Any, Optional, List
from backend.models import TagRFID, DatabaseConnection


def listar_tags() -> List[Dict[str, Any]]:
    """Lista todas as tags RFID cadastradas"""
    try:
        # Verificar se a tabela existe
        if not DatabaseConnection.table_exists('tags_rfid'):
            return []
        
        tags = TagRFID.listar_todas()
        return [tag.to_dict(include_funcionario_nome=True) for tag in tags]
    except Exception as e:
        raise Exception(f"Erro ao listar tags: {str(e)}")


def criar_tag(
    tag_id: str, 
    funcionario_matricula: Optional[str] = None, 
    ativo: bool = True, 
    observacoes: str = ''
) -> Dict[str, Any]:
    """Cria uma nova tag RFID"""
    if not tag_id:
        raise Exception("ID da tag é obrigatório")
    
    # Verificar se o funcionário já tem uma tag associada
    if funcionario_matricula:
        tags_existentes = TagRFID.listar_todas()
        for tag in tags_existentes:
            if tag.funcionario_matricula == funcionario_matricula and tag.ativo:
                from backend.models.funcionario import Funcionario
                funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
                nome_funcionario = funcionario.nome if funcionario else funcionario_matricula
                raise Exception(f"Funcionário {nome_funcionario} já possui uma tag ativa associada. Cada funcionário pode ter apenas uma tag.")
    
    try:
        tag = TagRFID.criar(
            tag_id=tag_id,
            funcionario_matricula=funcionario_matricula,
            ativo=ativo,
            observacoes=observacoes
        )
        return {"id": tag.id, "message": "Tag cadastrada com sucesso"}
    except Exception as e:
        error_msg = str(e)
        if "já possui uma tag" in error_msg:
            raise
        if "UNIQUE" in error_msg or "unique" in error_msg:
            if "tag_id" in error_msg.lower() or "tag" in error_msg.lower():
                raise Exception("Tag com este código já existe")
            else:
                raise Exception("Funcionário já possui uma tag associada. Cada funcionário pode ter apenas uma tag.")
        raise Exception(f"Erro ao criar tag: {error_msg}")


def atualizar_tag(
    tag_id: int, 
    funcionario_matricula: Optional[str] = None, 
    ativo: bool = True, 
    observacoes: str = ''
) -> Dict[str, Any]:
    """Atualiza uma tag RFID existente"""
    try:
        tag = TagRFID.buscar_por_id(tag_id)
        if not tag:
            raise Exception("Tag não encontrada")
        
        # Verificar se o funcionário já tem outra tag associada (exceto a atual)
        if funcionario_matricula and funcionario_matricula != tag.funcionario_matricula:
            tags_existentes = TagRFID.listar_todas()
            for tag_existente in tags_existentes:
                if (tag_existente.funcionario_matricula == funcionario_matricula 
                    and tag_existente.id != tag_id 
                    and tag_existente.ativo):
                    from backend.models.funcionario import Funcionario
                    funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
                    nome_funcionario = funcionario.nome if funcionario else funcionario_matricula
                    raise Exception(f"Funcionário {nome_funcionario} já possui uma tag ativa associada. Cada funcionário pode ter apenas uma tag.")
        
        tag.funcionario_matricula = funcionario_matricula
        tag.ativo = ativo
        tag.observacoes = observacoes
        tag.save()
        
        return {"message": "Tag atualizada com sucesso"}
    except Exception as e:
        error_msg = str(e)
        if "já possui uma tag" in error_msg:
            raise
        raise Exception(f"Erro ao atualizar tag: {error_msg}")


def deletar_tag(tag_id: int) -> Dict[str, Any]:
    """Deleta uma tag RFID"""
    try:
        tag = TagRFID.buscar_por_id(tag_id)
        if not tag:
            raise Exception("Tag não encontrada")
        
        tag.delete()
        return {"message": "Tag deletada com sucesso"}
    except Exception as e:
        raise Exception(f"Erro ao deletar tag: {str(e)}")


def buscar_tag_por_id(tag_id: int) -> Dict[str, Any]:
    """Busca uma tag pelo ID"""
    try:
        tag = TagRFID.buscar_por_id(tag_id)
        if not tag:
            raise Exception("Tag não encontrada")
        
        return tag.to_dict(include_funcionario_nome=True)
    except Exception as e:
        raise Exception(f"Erro ao buscar tag: {str(e)}")


def processar_leitura_rfid(tag_id: str, posto: Optional[str] = None) -> Dict[str, Any]:
    """Processa uma leitura de RFID e registra entrada ou saída automaticamente
    
    LÓGICA DE FUNCIONAMENTO:
    - O líder configura o posto UMA VEZ (operador e produto)
    - A entrada/saída é LIVRE: sempre que bater o ponto, alterna entre entrada e saída
    - Se bater novamente, alterna (entrada -> saída -> entrada -> saída...)
    - Quando o líder troca o PRODUTO para o mesmo operador no mesmo posto,
      o próximo registro de entrada usará o produto NOVO da configuração atual
    
    Args:
        tag_id: Código do chip RFID lido
        posto: Posto onde o funcionário está (opcional, será buscado da configuração se não fornecido)
    
    Returns:
        Dict com informações sobre o registro realizado (entrada ou saída)
    """
    try:
        from backend.models import PostoConfiguracao, ProducaoRegistro
        from backend.services import producao_service
        from datetime import datetime
        
        # Buscar a tag RFID pelo código
        tag = TagRFID.buscar_por_tag_id(tag_id)
        if not tag:
            raise Exception(f"Tag RFID '{tag_id}' não encontrada. Verifique se a tag está cadastrada.")
        
        if not tag.ativo:
            raise Exception(f"Tag RFID '{tag_id}' está inativa.")
        
        if not tag.funcionario_matricula:
            raise Exception(f"Tag RFID '{tag_id}' não está associada a nenhum funcionário.")
        
        funcionario_matricula = tag.funcionario_matricula
        
        # Buscar informações do funcionário
        from backend.models.funcionario import Funcionario
        funcionario = Funcionario.buscar_por_matricula(funcionario_matricula)
        if not funcionario:
            raise Exception(f"Funcionário com matrícula '{funcionario_matricula}' não encontrado.")
        
        if not funcionario.ativo:
            raise Exception(f"Funcionário '{funcionario.nome}' está inativo.")
        
        # Buscar posto da configuração do funcionário usando o novo método
        # Se posto não foi fornecido, buscar da configuração do funcionário
        if not posto:
           
            try:
                config_funcionario = PostoConfiguracao.buscar_posto_do_funcionario(funcionario_matricula)
                
                if not config_funcionario:
                    raise Exception(
                        f"Não foi encontrada configuração válida para o funcionário {funcionario.nome} (matrícula: {funcionario_matricula}). "
                        "Configure um posto com produto e operador na seção 'Configuração do Líder'."
                    )
                
                posto = config_funcionario.posto
            except Exception as e:
                print(f"[RFID SERVICE] Erro ao buscar posto do funcionário: {str(e)}")
                raise
        
        # Buscar configuração atual do posto para obter o produto
        config_posto = PostoConfiguracao.buscar_por_posto(posto)
        if not config_posto or not config_posto.modelo_codigo:
            raise Exception(
                f"Posto {posto} não possui produto configurado. "
                "Configure um produto para este posto na seção 'Configuração do Líder'."
            )
        
        produto_atual = config_posto.modelo_codigo
        
        # Verificar se existe registro aberto para este funcionário neste posto
        # A verificação é por POSTO + FUNCIONÁRIO (não verifica produto, data ou turno)
        # Isso permite múltiplas entradas/saídas no mesmo dia
        registro_aberto = ProducaoRegistro.buscar_registro_aberto(
            posto=posto,
            funcionario_matricula=funcionario_matricula
        )
        
        if registro_aberto:
            print(f"[RFID SERVICE] Registro aberto ID: {registro_aberto.id}, Produto: {registro_aberto.produto}, Hora início: {registro_aberto.hora_inicio}")
        
        if registro_aberto:
            # Existe registro aberto, então registrar SAÍDA
            # Fecha o registro atual
            print(f"[RFID SERVICE] Registrando SAÍDA - Registro ID: {registro_aberto.id}, Data: {registro_aberto.data}, Hora início: {registro_aberto.hora_inicio}")
            try:
                resultado = producao_service.registrar_saida(
                    registro_id=registro_aberto.id,
                    posto=posto,
                    funcionario_matricula=funcionario_matricula
                )
                print(f"[RFID SERVICE] Saída registrada com sucesso: {resultado}")
                
                # Verificar se o registro foi realmente fechado
                registro_verificado = ProducaoRegistro.buscar_registro_aberto(
                    posto=posto,
                    funcionario_matricula=funcionario_matricula
                )
                if registro_verificado and registro_verificado.id == registro_aberto.id:
                    print(f"[RFID SERVICE] AVISO: Registro {registro_aberto.id} ainda aparece como aberto após fechamento!")
                
                return {
                    "tipo": "saida",
                    "message": f"Saída registrada para {funcionario.nome}",
                    "funcionario": {
                        "matricula": funcionario_matricula,
                        "nome": funcionario.nome
                    },
                    "posto": posto,
                    "registro_id": resultado.get("registro_id"),
                    "hora_fim": resultado.get("hora_fim"),
                    "duracao_minutos": resultado.get("duracao_minutos")
                }
            except Exception as e:
                print(f"[RFID SERVICE] Erro ao registrar saída: {str(e)}")
                import traceback
                print(f"[RFID SERVICE] Traceback: {traceback.format_exc()}")
                raise
        else:
            # Não existe registro aberto, então registrar ENTRADA
            # O produto sempre vem da configuração ATUAL do posto
            # Se o líder mudou o produto, o próximo registro usará o novo produto
            print(f"[RFID SERVICE] Registrando ENTRADA - Posto: {posto}, Funcionário: {funcionario_matricula}, Produto: {produto_atual}")
            try:
                resultado = producao_service.registrar_entrada(
                    posto=posto,
                    funcionario_matricula=funcionario_matricula,
                    modelo_codigo=produto_atual
                )
                print(f"[RFID SERVICE] Entrada registrada com sucesso: {resultado}")
                
                if not resultado or not resultado.get("registro_id"):
                    print(f"[RFID SERVICE] AVISO: Resultado não contém registro_id: {resultado}")
                    raise Exception("Falha ao criar registro de entrada: registro_id não foi retornado")
                
                return {
                    "tipo": "entrada",
                    "message": f"Entrada registrada para {funcionario.nome}",
                    "funcionario": {
                        "matricula": funcionario_matricula,
                        "nome": funcionario.nome
                    },
                    "posto": posto,
                    "registro_id": resultado.get("registro_id"),
                    "hora_inicio": resultado.get("hora_inicio"),
                    "data": resultado.get("data"),
                    "turno": resultado.get("turno"),
                    "produto": resultado.get("produto")
                }
            except Exception as e:
                print(f"[RFID SERVICE] Erro ao registrar entrada: {str(e)}")
                import traceback
                print(f"[RFID SERVICE] Traceback: {traceback.format_exc()}")
                raise
            
    except Exception as e:
        print(f"[RFID SERVICE] Erro geral ao processar leitura RFID: {str(e)}")
        import traceback
        print(f"[RFID SERVICE] Traceback completo: {traceback.format_exc()}")
        raise Exception(f"Erro ao processar leitura RFID: {str(e)}")