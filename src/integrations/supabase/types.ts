export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade: string
          complemento: string | null
          cpf_cnpj: string | null
          criado_em: string
          data_nascimento: string | null
          email: string | null
          id: string
          logradouro: string | null
          nome_completo: string
          numero: string | null
          observacoes: string | null
          telefone_whatsapp: string
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade: string
          complemento?: string | null
          cpf_cnpj?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          logradouro?: string | null
          nome_completo: string
          numero?: string | null
          observacoes?: string | null
          telefone_whatsapp: string
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string
          complemento?: string | null
          cpf_cnpj?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          logradouro?: string | null
          nome_completo?: string
          numero?: string | null
          observacoes?: string | null
          telefone_whatsapp?: string
        }
        Relationships: []
      }
      conteudos_site: {
        Row: {
          atualizado_em: string
          chave: string
          conteudo: Json
          criado_em: string
          id: string
          publicado: boolean
          titulo: string | null
        }
        Insert: {
          atualizado_em?: string
          chave: string
          conteudo?: Json
          criado_em?: string
          id?: string
          publicado?: boolean
          titulo?: string | null
        }
        Update: {
          atualizado_em?: string
          chave?: string
          conteudo?: Json
          criado_em?: string
          id?: string
          publicado?: boolean
          titulo?: string | null
        }
        Relationships: []
      }
      depoimentos: {
        Row: {
          atualizado_em: string
          cidade: string | null
          criado_em: string
          id: string
          nome_cliente: string
          ordem_exibicao: number
          publicado: boolean
          texto_depoimento: string
        }
        Insert: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          id?: string
          nome_cliente: string
          ordem_exibicao?: number
          publicado?: boolean
          texto_depoimento: string
        }
        Update: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          id?: string
          nome_cliente?: string
          ordem_exibicao?: number
          publicado?: boolean
          texto_depoimento?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          ordem_exibicao: number
          pergunta: string
          publicado: boolean
          resposta: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          ordem_exibicao?: number
          pergunta: string
          publicado?: boolean
          resposta: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          ordem_exibicao?: number
          pergunta?: string
          publicado?: boolean
          resposta?: string
        }
        Relationships: []
      }
      locacoes: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          id: string
          observacoes: string | null
          origem_lead: Database["public"]["Enums"]["origem_lead"]
          plano_locacao_id: string | null
          poltrona_id: string | null
          status_locacao: Database["public"]["Enums"]["status_locacao"]
          valor_total: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          id?: string
          observacoes?: string | null
          origem_lead?: Database["public"]["Enums"]["origem_lead"]
          plano_locacao_id?: string | null
          poltrona_id?: string | null
          status_locacao?: Database["public"]["Enums"]["status_locacao"]
          valor_total?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          id?: string
          observacoes?: string | null
          origem_lead?: Database["public"]["Enums"]["origem_lead"]
          plano_locacao_id?: string | null
          poltrona_id?: string | null
          status_locacao?: Database["public"]["Enums"]["status_locacao"]
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_plano_locacao_id_fkey"
            columns: ["plano_locacao_id"]
            isOneToOne: false
            referencedRelation: "planos_locacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locacoes_poltrona_id_fkey"
            columns: ["poltrona_id"]
            isOneToOne: false
            referencedRelation: "poltronas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_locacao: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          dias_duracao: number
          id: string
          nome_plano: string
          preco_base: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          dias_duracao: number
          id?: string
          nome_plano: string
          preco_base: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          dias_duracao?: number
          id?: string
          nome_plano?: string
          preco_base?: number
        }
        Relationships: []
      }
      poltronas: {
        Row: {
          atualizado_em: string
          codigo_interno: string | null
          cor: string | null
          criado_em: string
          descricao: string | null
          id: string
          material: string | null
          nome: string
          status: Database["public"]["Enums"]["status_poltrona"]
        }
        Insert: {
          atualizado_em?: string
          codigo_interno?: string | null
          cor?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          material?: string | null
          nome: string
          status?: Database["public"]["Enums"]["status_poltrona"]
        }
        Update: {
          atualizado_em?: string
          codigo_interno?: string | null
          cor?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          material?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["status_poltrona"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string | null
          id: string
          nome: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendimento" | "logistica"
      origem_lead:
        | "site"
        | "whatsapp"
        | "indicacao"
        | "clinica_parceira"
        | "outro"
      status_locacao:
        | "lead"
        | "orcamento_enviado"
        | "aguardando_pagamento"
        | "confirmada"
        | "em_entrega"
        | "em_uso"
        | "em_coleta"
        | "finalizada"
        | "cancelada"
      status_poltrona: "disponivel" | "em_locacao" | "manutencao" | "inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "atendimento", "logistica"],
      origem_lead: [
        "site",
        "whatsapp",
        "indicacao",
        "clinica_parceira",
        "outro",
      ],
      status_locacao: [
        "lead",
        "orcamento_enviado",
        "aguardando_pagamento",
        "confirmada",
        "em_entrega",
        "em_uso",
        "em_coleta",
        "finalizada",
        "cancelada",
      ],
      status_poltrona: ["disponivel", "em_locacao", "manutencao", "inativo"],
    },
  },
} as const
