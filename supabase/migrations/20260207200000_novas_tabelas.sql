
-- Tabela de Solicitações de Saque
CREATE TABLE IF NOT EXISTS public.solicitacoes_saque (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    valor numeric(12,2) NOT NULL,
    chave_pix text,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'pago')),
    comprovante_url text,
    observacoes text,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Contratos Gerados
CREATE TABLE IF NOT EXISTS public.contratos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN ('contrato', 'proposta')),
    conteudo text, -- HTML ou JSON do conteúdo
    pdf_url text, -- Link se salvo no bucket (opcional)
    criado_em timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.solicitacoes_saque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Políticas Saque
DROP POLICY IF EXISTS "Admin gerencia saques" ON public.solicitacoes_saque;
CREATE POLICY "Admin gerencia saques" ON public.solicitacoes_saque
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuario ve seus saques" ON public.solicitacoes_saque;
CREATE POLICY "Usuario ve seus saques" ON public.solicitacoes_saque
    FOR SELECT
    TO authenticated
    USING (usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario cria saque" ON public.solicitacoes_saque;
CREATE POLICY "Usuario cria saque" ON public.solicitacoes_saque
    FOR INSERT
    TO authenticated
    WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()));

-- Políticas Contratos
DROP POLICY IF EXISTS "Admin gerencia contratos" ON public.contratos;
CREATE POLICY "Admin gerencia contratos" ON public.contratos
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Trigger update
CREATE TRIGGER trg_solicitacoes_saque_atualizado_em
BEFORE UPDATE ON public.solicitacoes_saque
FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();
