import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hooks do site público para buscar conteúdos gerenciáveis no banco.
 */

export function useDepoimentosPublicados() {
  return useQuery({
    queryKey: ["public", "depoimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depoimentos")
        .select("id,nome_cliente,cidade,texto_depoimento,ordem_exibicao")
        .eq("publicado", true)
        .order("ordem_exibicao", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useFaqsPublicados() {
  return useQuery({
    queryKey: ["public", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id,pergunta,resposta,ordem_exibicao")
        .eq("publicado", true)
        .order("ordem_exibicao", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export type PassoComoFunciona = { titulo: string; descricao: string };

export function useComoFunciona() {
  return useQuery({
    queryKey: ["public", "conteudos_site", "como_funciona"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conteudos_site")
        .select("chave,conteudo")
        .eq("publicado", true)
        .eq("chave", "como_funciona")
        .maybeSingle();

      if (error) throw error;

      const passos = (data?.conteudo as any)?.passos as PassoComoFunciona[] | undefined;
      return passos ?? [];
    },
  });
}

export function usePlanosAtivos() {
  return useQuery({
    queryKey: ["public", "planos_locacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_locacao")
        .select("id,nome_plano,dias_duracao,preco_base")
        .eq("ativo", true)
        .order("dias_duracao", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
