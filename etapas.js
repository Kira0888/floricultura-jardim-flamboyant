/* Cena 3 · "Como funciona o projeto": os 4 passos avançam sozinhos, por tempo.
   Sem dependência da rolagem. O tempo vem da animação CSS da barra de cada passo
   (.seg.ativo i, duração --tempo): quando a barra termina, entra o passo seguinte, e
   depois do último a apresentação recomeça.
   A barra só corre com a cena na tela e sem pausa; isso é controlado por
   animation-play-state inline na própria barra (1 elemento), sem classes em ancestrais,
   para não invalidar o estilo da cena inteira.
   Desempenho: nada aqui lê layout (sem offsetWidth/getBoundingClientRect). Para reiniciar a
   barra, o .ativo é removido e reposto dois quadros depois, o que dá ao navegador a chance
   de resolver o estilo entre os dois sem forçar um reflow síncrono.
   Acessibilidade: botão Pausar/Continuar, segmentos clicáveis, e com movimento reduzido nada
   avança: os 4 passos aparecem em lista, com o quarto já pronto. */
(function () {
  "use strict";
  var secao = document.querySelector(".pico");
  if (!secao) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var lista = secao.querySelector(".etapas");
  var itens = [].slice.call(secao.querySelectorAll(".etapa"));
  var segs = [].slice.call(secao.querySelectorAll(".seg"));
  var barras = segs.map(function (b) { return b.querySelector("i"); });
  var pausa = secao.querySelector(".pausa");
  var pausaTxt = pausa && pausa.querySelector(".pausa-txt");
  var N = itens.length;
  if (!N || segs.length !== N) return;

  var atual = 0;
  var pausado = false;
  var naTela = false;
  var senha = 0; // invalida reinícios pendentes se a pessoa clicar rápido

  function estado() { return (pausado || !naTela) ? "paused" : "running"; }
  function sincronizar() { barras[atual].style.animationPlayState = estado(); }

  function ir(i, manual) {
    atual = (i + N) % N;
    var minha = ++senha;
    secao.setAttribute("data-etapa", String(atual + 1));
    for (var k = 0; k < N; k++) {
      itens[k].setAttribute("aria-hidden", k === atual ? "false" : "true");
      segs[k].classList.toggle("feito", k < atual);
      segs[k].classList.remove("ativo");
      if (k === atual) segs[k].setAttribute("aria-current", "step"); else segs[k].removeAttribute("aria-current");
    }
    // leitores de tela: avisa a troca só quando a pessoa escolheu o passo
    lista.setAttribute("aria-live", manual ? "polite" : "off");
    // reinicia a barra: remove agora, repõe 2 quadros depois (sem reflow forçado)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (minha !== senha) return;
        barras[atual].style.animationPlayState = estado();
        segs[atual].classList.add("ativo");
      });
    });
  }

  segs.forEach(function (b, k) {
    b.addEventListener("click", function () { ir(k, true); });
    barras[k].addEventListener("animationend", function () {
      if (segs[k].classList.contains("ativo")) ir(atual + 1, false);
    });
  });

  if (pausa) {
    pausa.addEventListener("click", function () {
      pausado = !pausado;
      pausa.setAttribute("aria-pressed", String(pausado));
      pausa.setAttribute("aria-label", pausado ? "Retomar a apresentação automática" : "Pausar a apresentação automática");
      if (pausaTxt) pausaTxt.textContent = pausado ? "Continuar" : "Pausar";
      sincronizar();
    });
  }

  // só corre com a cena na tela
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      naTela = entradas[entradas.length - 1].isIntersecting;
      sincronizar();
    }, { rootMargin: "10% 0px" }).observe(secao);
  } else {
    naTela = true;
  }

  ir(0, false);
})();
