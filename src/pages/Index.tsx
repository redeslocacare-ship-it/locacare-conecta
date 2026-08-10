import React, { useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, Truck, Zap, HandHeart, Check, Quote, ArrowRight, Armchair, Flame, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicHeader } from "@/components/locacare/PublicHeader";
import { PublicFooter } from "@/components/locacare/PublicFooter";
import { PreReservaRapida } from "@/components/locacare/PreReservaRapida";
import { MobileTabBar } from "@/components/locacare/MobileTabBar";
import {
  Reveal,
  Stagger,
  StaggerItem,
  ShinyText,
  TiltCard,
  ScrollProgress,
  Marquee,
  ParallaxY,
} from "@/components/locacare/motion";
import { useComoFunciona, useDepoimentosPublicados, useFaqsPublicados, usePlanosAtivos } from "@/hooks/useConteudosPublicos";
import poltronaAmbiente from "@/assets/poltrona-1.webp";
import poltronaReclinada from "@/assets/poltrona-2.webp";
import poltronaFicha from "@/assets/poltrona-3.webp";
import poltronaFrontal from "@/assets/poltrona-4.webp";

/**
 * Home pública (conversão) — LocaCare
 *
 * Direção: White Luxury (marfim + petróleo + champanhe)
 * - Hero direto ao ponto: copy à esquerda + pré-reserva rápida (2 campos) à direita
 * - Fotos reais da poltrona em galeria com parallax por coluna
 * - Motion sutil: reveals com blur, parallax em camadas, brilho dourado
 * - Mobile: sensação de app (tab bar inferior, toques generosos)
 */
const Index = () => {
  const reduzirAnimacao = useReducedMotion();
  const contatoRef = useRef<HTMLDivElement | null>(null);

  const { data: depoimentos = [] } = useDepoimentosPublicados();
  const { data: faqs = [] } = useFaqsPublicados();
  const { data: passos = [] } = useComoFunciona();
  const { data: planos = [] } = usePlanosAtivos();

  // Parallax em camadas no hero — respeita reduced motion
  const { scrollY } = useScroll();
  const heroFormY = useTransform(scrollY, [0, 900], [0, -26]);
  const heroGlowY = useTransform(scrollY, [0, 900], [0, 60]);

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
        titulo: "Mais econômico que comprar",
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

  return (
    <div id="topo" className="min-h-screen bg-background">
      <ScrollProgress />
      <PublicHeader onSolicitarOrcamento={rolarParaContato} />
      <MobileTabBar onSolicitarOrcamento={rolarParaContato} />

      {/* padding inferior no mobile para a tab bar não cobrir conteúdo */}
      <main className="pb-28 md:pb-0">
        {/* HERO — copy + pré-reserva rápida */}
        <section className="relative overflow-hidden bg-hero">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl"
            style={reduzirAnimacao ? undefined : { y: heroGlowY }}
          />

          <div className="container relative py-14 md:py-24 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 shadow-soft">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                    <span className="text-xs font-medium tracking-wide text-muted-foreground">
                      Entrega e instalação em Goiânia
                    </span>
                  </div>
                </Reveal>

                <Reveal delay={0.08}>
                  <h1 className="mt-6 text-balance text-4xl leading-[1.06] md:text-6xl">
                    Recuperação com <em className="font-display italic text-primary">conforto</em> e{" "}
                    <ShinyText>elegância</ShinyText>, na sua casa
                  </h1>
                </Reveal>

                <Reveal delay={0.16}>
                  <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                    Alugue uma poltrona reclinável com função lift para o pós-operatório. Mais segurança para levantar,
                    mais conforto para descansar — com suporte do começo ao fim.
                  </p>
                </Reveal>

                <Reveal delay={0.24}>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button size="lg" variant="outline" asChild className="rounded-full px-8">
                      <a href="#poltrona">Conhecer a poltrona</a>
                    </Button>
                    <Button size="lg" variant="ghost" asChild className="rounded-full px-6 text-muted-foreground">
                      <a href="#planos">Ver planos e valores</a>
                    </Button>
                  </div>
                </Reveal>

                <Stagger className="mt-10 grid grid-cols-3 gap-3">
                  {[
                    { valor: "Até 24h", legenda: "Entrega em Goiânia" },
                    { valor: "Incluso", legenda: "Instalação em casa" },
                    { valor: "Sempre", legenda: "Suporte no uso" },
                  ].map((s) => (
                    <StaggerItem key={s.legenda} className="rounded-2xl border bg-card p-4 shadow-soft">
                      <p className="font-display text-lg leading-none md:text-xl">{s.valor}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">{s.legenda}</p>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>

              {/* Card de pré-reserva rápida — flutua sutilmente com o scroll */}
              <Reveal delay={0.15} className="relative">
                <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-accent/60 blur-3xl" />
                <motion.div style={reduzirAnimacao ? undefined : { y: heroFormY }} className="relative">
                  <PreReservaRapida />
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FAIXA DE CONFIANÇA */}
        <Marquee
          items={[
            "Entrega em até 24h em Goiânia",
            "Instalação inclusa",
            "Suporte durante todo o uso",
            "Higienização profissional",
            "Coleta agendada ao fim do período",
            "Pagamento facilitado",
          ]}
        />

        {/* A POLTRONA — galeria com parallax por coluna */}
        <section id="poltrona" className="scroll-mt-24 overflow-hidden py-16 md:py-24">
          <div className="container">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Conheça de perto</p>
              <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">
                A poltrona que <em className="font-display italic text-primary">levanta</em> com você
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Lift elétrico, reclinação até 160°, aquecimento e 8 pontos de massagem — tudo pensado para o
                pós-operatório.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-start">
              <ParallaxY amount={-24}>
                <Reveal>
                  <TiltCard className="group relative overflow-hidden rounded-[2rem] border bg-card shadow-lift">
                    <img
                      src={poltronaFrontal}
                      alt="Poltrona lift reclinável LocaCare vista de frente"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl border bg-background/85 p-4 backdrop-blur-xl">
                      <p className="flex items-center gap-2 font-display text-lg">
                        <Armchair className="h-4 w-4 text-gold" strokeWidth={1.75} /> Assento em espuma D25
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Encosto acolchoado e apoio firme para o corpo.</p>
                    </div>
                  </TiltCard>
                </Reveal>
              </ParallaxY>

              <ParallaxY amount={-56}>
                <Reveal delay={0.08}>
                  <TiltCard className="group relative overflow-hidden rounded-[2rem] border bg-card shadow-lift">
                    <img
                      src={poltronaReclinada}
                      alt="Poltrona LocaCare totalmente reclinada com base lift estendida"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl border bg-background/85 p-4 backdrop-blur-xl">
                      <p className="flex items-center gap-2 font-display text-lg">
                        <Timer className="h-4 w-4 text-gold" strokeWidth={1.75} /> Reclina até 160°
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Posição ideal para descanso e drenagem.</p>
                    </div>
                  </TiltCard>
                </Reveal>
              </ParallaxY>

              <ParallaxY amount={-36}>
                <Reveal delay={0.16}>
                  <TiltCard className="group relative overflow-hidden rounded-[2rem] border bg-card shadow-lift">
                    <img
                      src={poltronaAmbiente}
                      alt="Poltrona lift LocaCare em ambiente de sala de estar"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl border bg-background/85 p-4 backdrop-blur-xl">
                      <p className="flex items-center gap-2 font-display text-lg">
                        <Flame className="h-4 w-4 text-gold" strokeWidth={1.75} /> Aquecimento + massagem
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">8 pontos de massagem distribuídos pela poltrona.</p>
                    </div>
                  </TiltCard>
                </Reveal>
              </ParallaxY>
            </div>

            {/* Ficha técnica (infográfico) */}
            <Reveal delay={0.1} className="mt-10">
              <div className="card-luxe overflow-hidden p-3 md:p-6">
                <div className="grid items-center gap-6 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="px-4 py-6 md:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Ficha técnica</p>
                    <h3 className="mt-3 font-display text-2xl md:text-3xl">Cada detalhe pensado na sua recuperação</h3>
                    <ul className="mt-5 grid gap-2.5 text-sm text-muted-foreground">
                      {[
                        "Base lift de elevação com reclinação elétrica até 160°",
                        "Controle multifuncional de massagem e aquecimento — bivolt",
                        "Estrutura em madeira maciça e revestimento em PU",
                        "2 porta-copos embutidos e revisteiro lateral",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" strokeWidth={2} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button onClick={rolarParaContato} className="group mt-7 rounded-full px-7">
                      Fazer pré-reserva
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                  <ParallaxY amount={-18}>
                    <img
                      src={poltronaFicha}
                      alt="Infográfico com as especificações técnicas da poltrona lift"
                      className="w-full rounded-2xl border bg-white object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </ParallaxY>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section id="beneficios" className="container scroll-mt-24 py-16 md:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Por que a LocaCare</p>
            <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">Benefícios que fazem diferença na sua recuperação</h2>
          </Reveal>

          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {beneficios.map((b) => (
              <StaggerItem key={b.titulo}>
                <div className="card-luxe hover-lift h-full p-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary">
                    <b.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 font-display text-xl">{b.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.descricao}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* COMO FUNCIONA */}
        {passos.length > 0 && (
          <section id="como-funciona" className="scroll-mt-24 bg-secondary/40 py-16 md:py-24">
            <div className="container">
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Simples assim</p>
                <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">Como funciona</h2>
              </Reveal>

              <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
                {passos.map((p, i) => (
                  <StaggerItem key={p.titulo}>
                    <div className="card-luxe h-full p-6">
                      <span className="font-display text-4xl text-gold/70">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="mt-4 font-display text-xl">{p.titulo}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.descricao}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </section>
        )}

        {/* PLANOS */}
        <section id="planos" className="container scroll-mt-24 py-16 md:py-24">
          <Reveal>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Investimento</p>
                <h2 className="mt-3 text-3xl md:text-4xl">Planos de locação</h2>
                <p className="mt-2 text-muted-foreground">Escolha a duração ideal para a sua recuperação.</p>
              </div>
              <Button onClick={rolarParaContato} variant="outline" className="rounded-full px-6">
                Fazer pré-reserva
              </Button>
            </div>
          </Reveal>

          <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
            {planos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado ainda.</p>
            ) : (
              planos.map((p) => (
                <StaggerItem key={p.id}>
                  <div className="card-luxe hover-lift group h-full p-7">
                    <p className="font-display text-xl">{p.nome_plano}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.dias_duracao} dias de uso</p>
                    <p className="mt-6 font-display text-3xl">
                      {Number(p.preco_base).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Preço base — confirme datas e disponibilidade.</p>
                    <div className="mt-6 h-px w-full bg-border transition-colors group-hover:bg-gold/50" />
                    <button
                      type="button"
                      onClick={rolarParaContato}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-gold"
                    >
                      Reservar este plano <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </StaggerItem>
              ))
            )}
          </Stagger>
        </section>

        {/* PARA QUEM É INDICADO */}
        <section className="bg-secondary/40 py-16 md:py-24">
          <div className="container grid items-center gap-12 md:grid-cols-2">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Para quem é</p>
              <h2 className="mt-3 text-3xl leading-tight md:text-4xl">
                Recuperação mais rápida e <em className="font-display italic text-primary">tranquila</em>
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
                A poltrona lift é essencial para quem precisa de autonomia e segurança nos momentos mais delicados do
                pós-operatório.
              </p>

              <Stagger className="mt-8 grid gap-3">
                {[
                  "Cirurgias plásticas (abdominoplastia, lipo, mama)",
                  "Cirurgias ortopédicas (coluna, joelho, quadril)",
                  "Idosos com mobilidade reduzida",
                  "Gestantes e lactantes (conforto na amamentação)",
                ].map((item) => (
                  <StaggerItem key={item}>
                    <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:border-gold/40">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                        <Check className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="text-sm font-medium md:text-base">{item}</span>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>

            <Reveal delay={0.1} className="relative">
              <ParallaxY amount={-22}>
                <div className="overflow-hidden rounded-[2rem] border shadow-lift">
                  <img
                    src={poltronaAmbiente}
                    alt="Poltrona lift LocaCare instalada em uma sala de estar"
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </ParallaxY>
              <div className="absolute -bottom-5 left-6 right-6 rounded-2xl border bg-background/90 p-4 shadow-lift backdrop-blur-xl md:p-5">
                <p className="font-display italic">“Foi fundamental na minha recuperação.”</p>
                <p className="mt-1 text-xs text-gold">★★★★★ · Cliente verificada</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        {depoimentos.length > 0 && (
          <section className="container py-16 md:py-24">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Histórias reais</p>
              <h2 className="mt-3 text-3xl md:text-4xl">Quem já se recuperou com a LocaCare</h2>
            </Reveal>

            <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
              {depoimentos.map((d) => (
                <StaggerItem key={d.id}>
                  <figure className="card-luxe h-full p-6">
                    <Quote className="h-6 w-6 text-gold/60" />
                    <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      “{d.texto_depoimento}”
                    </blockquote>
                    <figcaption className="mt-5 text-sm font-medium">
                      {d.nome_cliente}
                      {d.cidade ? <span className="text-muted-foreground"> · {d.cidade}</span> : null}
                    </figcaption>
                  </figure>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        )}

        {/* FAQ */}
        <section id="faq" className="container scroll-mt-24 py-16 md:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Dúvidas</p>
            <h2 className="mt-3 text-3xl md:text-4xl">Perguntas frequentes</h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card-luxe mt-8 px-2 md:px-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">Sem perguntas publicadas ainda.</p>
                ) : (
                  faqs.map((f) => (
                    <AccordionItem key={f.id} value={f.id} className="border-border/60">
                      <AccordionTrigger className="px-4 text-left font-medium hover:no-underline">
                        {f.pergunta}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 leading-relaxed text-muted-foreground">
                        {f.resposta}
                      </AccordionContent>
                    </AccordionItem>
                  ))
                )}
              </Accordion>
            </div>
          </Reveal>
        </section>

        {/* CONTATO / PRÉ-RESERVA */}
        <section className="relative scroll-mt-24 overflow-hidden bg-hero py-16 md:py-24" ref={contatoRef}>
          <div className="container">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Vamos conversar</p>
                <h2 id="contato" className="mt-3 text-3xl md:text-4xl">
                  Faça sua <ShinyText>pré-reserva</ShinyText> agora
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Só nome e telefone — nossa equipe chama você no WhatsApp para confirmar disponibilidade.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="mt-8">
              <PreReservaRapida className="mx-auto max-w-md" />
            </Reveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Index;
