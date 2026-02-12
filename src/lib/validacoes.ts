import { z } from "zod";

/**
 * Schemas de validação (cliente/lead) - compartilháveis.
 *
 * Regra de segurança:
 * - Sempre validar antes de gravar no banco.
 */

export const leadSchema = z.object({
  nome_completo: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo")
    .max(100, "Nome muito longo"),
  telefone_whatsapp: z
    .string()
    .trim()
    .min(8, "Informe um WhatsApp válido")
    .max(20, "Telefone muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo").optional().or(z.literal("")),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80, "Cidade muito longa"),
  bairro: z.string().trim().max(120, "Bairro muito longo").optional().or(z.literal("")),
  tipo_cirurgia: z.string().trim().max(120, "Texto muito longo").optional().or(z.literal("")),
  data_inicio_desejada: z.string().trim().optional().or(z.literal("")),
  mensagem: z.string().trim().max(1000, "Mensagem muito longa").optional().or(z.literal("")),
  codigo_indicacao: z.string().trim().max(50, "Código inválido").optional().or(z.literal("")),
  plano_locacao_id: z.string().trim().uuid("Selecione um plano válido").optional().or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
