import React, { useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, Truck, Zap, HandHeart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicHeader } from "@/components/locacare/PublicHeader";
import { PublicFooter } from "@/components/locacare/PublicFooter";
import { PreReservaForm } from "@/components/locacare/PreReservaForm";
import { WhatsAppFloatingButton } from "@/components/locacare/WhatsAppFloatingButton";
import { SectionDivider } from "@/components/locacare/SectionDivider";
import { BrandLogo } from "@/components/locacare/BrandLogo";
import { useComoFunciona, useDepoimentosPublicados, useFaqsPublicados, usePlanosAtivos } from "@/hooks/useConteudosPublicos";
import heroPoltrona from "@/assets/hero-poltrona.jpg";

/**
 * Home pública (conversão) — LocaCare
 *
 * Direção: Dark Neon premium (grafite + teal)
 * - Tema escuro por padrão (tokens)
 * - Hero “emblema iluminado” com glow
 * - Divisórias diagonais com motion entre seções
 */
const Index = () => {
  const reduzirAnimacao = useReducedMotion();
  const contatoRef = useRef<HTMLDivElement | null>(null);

  const { data: depoimentos = [] } = useDepoimentosPublicados();
  const { data: faqs = [] } = useFaqsPublicados();
  const { data: passos = [] } = useComoFunciona();
  const { data: planos = [] } = usePlanosAtivos();

  const mensagem = "Olá, quero alugar uma poltrona pós-cirúrgica com a LocaCare.";
  const whatsappHref = `https://wa.me/5562936180658?text=${encodeURIComponent(mensagem)}`;

  // Parallax sutil (scroll) no hero — leve e respeita reduced motion
  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 900], [0, -24]);
  const heroImageRotate = useTransform(scrollY, [0, 900], [0, -1.2]);

  const beneficios = useMemo(
    () => [
      {
        titulo: "Levante-se sem esforço",
        descricao: "Função lift que auxilia a ficar em pé com mais segurança e autonomia.",
        icon: Zap,
      },
      {
        titulo: "Conforto em várias posições",
        descricao: "Modo sentado, leitura e descanso com apoio adequado durante a recuperação.",
        icon: HandHeart,
      },
      {
        titulo: "Aluguel mais econômico que compra",
        descricao: "Uso temporário com melhor custo-benefício para o período pós-operatório.",
        icon: ShieldCheck,
      },
      {
        titulo: "Atendimento domiciliar",
        descricao: "Entrega e instalação em Goiânia e região metropolitana.",
        icon: Truck,
      },
    ],
    [],
  );

  function rolarParaContato() {
    contatoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader onSolicitarOrcamento={rolarParaContato} />
      <WhatsAppFloatingButton />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-hero">
          {/* Spotlights */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-float" />
            <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-accent/35 blur-3xl animate-float" />
            <div className="absolute left-1/2 top-[68%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-float" />
          </div>

          {/* Shine */}
          <div className="pointer-events-none absolute inset-0 opacity-90 [mask-image:radial-gradient(60%_50%_at_50%_35%,black,transparent)]">
            <div className="absolute -inset-24 bg-shine animate-spotlight" />
          </div>

          <div className="container relative py-16 md:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <motion.div
                initial={reduzirAnimacao ? false : { opacity: 0, y: 14 }}
                animate={reduzirAnimacao ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Emblema iluminado (marca em destaque máximo) */}
                <div className="inline-flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 shadow-lift backdrop-blur">
                  <div className="relative">
                    <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-primary/20 blur-xl" />
                    <BrandLogo compact className="relative" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Atendimento em Goiânia</p>
                    <p className="text-sm font-semibold">Entrega + instalação</p>
                  </div>
                  <div className="ml-auto hidden sm:flex items-center gap-2 rounded-xl bg-background/40 px-3 py-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Recuperação com autonomia</span>
                  </div>
                </div>

                <h1 className="mt-6 text-balance text-4xl leading-[1.02] md:text-6xl">
                  Poltrona pós-cirúrgica com efeito lift — conforto premium em casa
                </h1>
                <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
                  Alugue uma poltrona reclinável lift para pós-operatório em Goiânia. Mais segurança para levantar, mais
                  conforto para descansar e suporte do começo ao fim.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button asChild variant="default" size="lg" className="hover-lift">
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      Chamar no WhatsApp
                    </a>
                  </Button>
                  <Button variant="hero" size="lg" onClick={rolarParaContato} className="hover-lift">
                    Solicitar orçamento
                  </Button>
                </div>

                {/* Prova social */}
                <motion.div
                  className="mt-7 grid gap-3 sm:grid-cols-3"
                  variants={containerVariants}
                  initial={reduzirAnimacao ? false : "hidden"}
                  animate={reduzirAnimacao ? undefined : "show"}
                >
                  <motion.div variants={itemVariants} className="rounded-xl border glass p-4 shadow-soft">
                    <p className="text-xl font-semibold leading-none">4,9/5</p>
                    <p className="mt-1 text-sm text-muted-foreground">Avaliações</p>
                  </motion.div>
                  <motion.div variants={itemVariants} className="rounded-xl border glass p-4 shadow-soft">
                    <p className="text-xl font-semibold leading-none">Até 24h</p>
                    <p className="mt-1 text-sm text-muted-foreground">Entrega (Goiânia)</p>
                  </motion.div>
                  <motion.div variants={itemVariants} className="rounded-xl border glass p-4 shadow-soft">
                    <p className="text-xl font-semibold leading-none">300+</p>
                    <p className="mt-1 text-sm text-muted-foreground">Famílias atendidas</p>
                  </motion.div>
                </motion.div>

                <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-lg border glass p-3 shadow-soft">Suporte durante o uso</div>
                  <div className="rounded-lg border glass p-3 shadow-soft">Coleta agendada</div>
                  <div className="rounded-lg border glass p-3 shadow-soft">Pagamento facilitado</div>
                </div>
              </motion.div>

              <motion.div
                className="relative"
                initial={reduzirAnimacao ? false : { opacity: 0, scale: 0.98 }}
                animate={reduzirAnimacao ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
              >
                <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl" />

                <div className="relative rounded-3xl border bg-card/70 p-5 shadow-lift backdrop-blur">
                  <p className="font-semibold">Produto principal</p>
                  <p className="mt-1 text-sm text-muted-foreground">Poltrona lift reclinável PU preta</p>

                  <motion.div
                    className="mt-4 overflow-hidden rounded-2xl border bg-background/40 shadow-soft"
                    style={reduzirAnimacao ? undefined : { y: heroImageY, rotate: heroImageRotate }}
                  >
                    <img
                      src={heroPoltrona}
                      alt="Poltrona lift reclinável para pós-operatório (produto LocaCare)"
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  </motion.div>

                  <div className="mt-4 rounded-2xl border bg-background/30 p-5 shadow-soft">
                    <p className="text-sm text-muted-foreground">Ideal para:</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Abdominoplastia e mamoplastia</li>
                      <li>• Ortopedia (coluna, joelho, ombro)</li>
                      <li>• Idosos e mobilidade reduzida</li>
                    </ul>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">Atendimento: (62) 93618-0658 • contato@locacare.com.br</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Divisor */}
          <SectionDivider className="text-background" />
        </section>

        {/* BENEFÍCIOS */}
        <section id="beneficios" className="container py-14 md:py-18 scroll-mt-24">
          <div>
            <h2 className="text-3xl md:text-4xl">Benefícios que fazem diferença</h2>
            <p className="mt-2 text-muted-foreground">Conforto e segurança no pós-operatório — sem complicação.</p>
          </div>

          <motion.div
            className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial={reduzirAnimacao ? false : "hidden"}
            whileInView={reduzirAnimacao ? undefined : "show"}
            viewport={{ once: true, margin: "-80px" }}
          >
            {beneficios.map((b) => (
              <motion.div key={b.titulo} variants={itemVariants}>
                <Card className="shadow-soft hover-lift bg-card/70 backdrop-blur">
                  <CardHeader className="space-y-3">
                    <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background/30 shadow-soft">
                      <div className="pointer-events-none absolute -inset-2 rounded-2xl bg-primary/15 blur-xl" />
                      <b.icon className="relative h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{b.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{b.descricao}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <SectionDivider className="text-card" flip />

        {/* PLANOS */}
        <section className="container pb-14">
          <div className="rounded-3xl border bg-card/70 p-8 shadow-lift backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl">Planos de locação</h2>
                <p className="mt-2 text-muted-foreground">Valores configurados no sistema (sem preço fixo no código).</p>
              </div>
              <Button variant="hero" onClick={rolarParaContato} className="hover-lift">
                Pedir orçamento
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {planos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum plano cadastrado ainda.</p>
              ) : (
                planos.map((p) => (
                  <div key={p.id} className="rounded-2xl border bg-background/30 p-5 shadow-soft hover-lift">
                    <p className="font-semibold">{p.nome_plano}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Duração: {p.dias_duracao} dias</p>
                    <p className="mt-4 text-2xl font-semibold">
                      {Number(p.preco_base).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-muted-foreground">Preço base — confirme datas e disponibilidade.</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="container py-14 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl">Como funciona a locação</h2>
          <p className="mt-2 text-muted-foreground">Passo a passo simples (editável no banco).</p>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {(passos.length ? passos : [{ titulo: "Carregando…", descricao: "" }]).map((p, idx) => (
              <div
                key={`${p.titulo}-${idx}`}
                className="rounded-2xl border bg-card/70 p-5 shadow-soft hover-lift backdrop-blur md:col-span-1"
              >
                <p className="text-xs text-muted-foreground">Passo {idx + 1}</p>
                <p className="mt-2 font-semibold">{p.titulo}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider className="text-card" />

        {/* PARA QUEM É INDICADO */}
        <section className="container py-14">
          <div className="grid gap-8 rounded-3xl border bg-card/70 p-8 shadow-lift backdrop-blur md:grid-cols-2">
            <div>
              <h2 className="text-3xl md:text-4xl">Para quem é indicado</h2>
              <p className="mt-2 text-muted-foreground">Apoio essencial nos primeiros dias de recuperação.</p>
            </div>
            <ul className="grid gap-3 text-sm">
              <li className="rounded-2xl border bg-background/30 p-4 shadow-soft hover-lift">Cirurgias plásticas (abdômen, mama, lipo)</li>
              <li className="rounded-2xl border bg-background/30 p-4 shadow-soft hover-lift">Cirurgias ortopédicas (coluna, ombro, joelho)</li>
              <li className="rounded-2xl border bg-background/30 p-4 shadow-soft hover-lift">Idosos com dificuldade de mobilidade</li>
              <li className="rounded-2xl border bg-background/30 p-4 shadow-soft hover-lift">Pacientes com dor ou restrição para deitar/levantar</li>
            </ul>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="container py-14">
          <h2 className="text-3xl md:text-4xl">Depoimentos</h2>
          <p className="mt-2 text-muted-foreground">Experiências reais de quem já alugou com a LocaCare.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {depoimentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem depoimentos publicados ainda.</p>
            ) : (
              depoimentos.map((d) => (
                <Card key={d.id} className="shadow-soft hover-lift bg-card/70 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-xl">{d.nome_cliente}</CardTitle>
                    {d.cidade ? <p className="text-sm text-muted-foreground">{d.cidade}</p> : null}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">“{d.texto_depoimento}”</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container py-14 scroll-mt-24">
          <h2 className="text-3xl md:text-4xl">Perguntas frequentes</h2>
          <p className="mt-2 text-muted-foreground">Tire dúvidas antes de solicitar orçamento.</p>

          <div className="mt-6 rounded-3xl border bg-card/70 p-3 shadow-lift backdrop-blur">
            <Accordion type="single" collapsible className="w-full">
              {faqs.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Sem perguntas publicadas ainda.</p>
              ) : (
                faqs.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger className="px-3 text-left">{f.pergunta}</AccordionTrigger>
                    <AccordionContent className="px-3 text-muted-foreground">{f.resposta}</AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </div>
        </section>

        {/* CONTATO / PRÉ-RESERVA */}
        <section className="container py-14" ref={contatoRef}>
          <div className="mb-6 rounded-3xl border bg-card/70 p-8 shadow-lift backdrop-blur">
            <h2 id="contato" className="text-3xl md:text-4xl scroll-mt-24">
              Solicite um orçamento
            </h2>
            <p className="mt-2 text-muted-foreground">
              Prefere falar direto?{" "}
              <a className="underline-offset-4 hover:underline" href={whatsappHref}>
                Chame no WhatsApp
              </a>
              .
            </p>
          </div>

          <PreReservaForm id="pre-reserva" />
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Index;
