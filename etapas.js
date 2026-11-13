/* Cena 3 · "Como funciona o projeto": os 4 passos avançam sozinhos, por tempo.
   Sem dependência da rolagem. O tempo vem da animação CSS da barra de cada passo
   (.seg.ativo i, duração --tempo): quando a barra termina, entra o passo seguinte, e
   depois do último a apresentação recomeça. Pausar a barra pausa tudo.
   A apresentação também fica pausada enquanto a cena está fora da tela (.em-tela, ver luz.js).
   Acessibilidade: botão Pausar/Continuar, segmentos clicáveis para ir a um passo, e com
   movimento reduzido nada avança: os 4 passos aparecem em lista, com o quarto já pronto. */
(function () {
  "use strict";
  var secao = document.querySelector(".pico");
  if (!secao) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var lista = secao.querySelector(".etapas");
  var itens = [].slice.call(secao.querySelectorAll(".etapa"));
  var segs = [].slice.call(secao.querySelectorAll(".seg"));
  var pausa = secao.querySelector(".pausa");
  var pausaTxt = pausa && pausa.querySelector(".pausa-txt");
  var N = itens.length;
  if (!N || segs.length !== N) return;

  var atual = 0;
  var pausado = false;

  function ir(i, manual) {
    atual = (i + N) % N;
    secao.setAttribute("data-etapa", String(atual + 1));
    itens.forEach(function (el, k) { el.setAttribute("aria-hidden", k === atual ? "false" : "true"); });
    segs.forEach(function (b, k) {
      b.classList.toggle("feito", k < atual);
      b.classList.toggle("ativo", k === atual);
      if (k === atual) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    // reinicia a barra do passo ativo
    var barra = segs[atual].querySelector("i");
    barra.style.animation = "none";
    void barra.offsetWidth; // força o reflow para a animação recomeçar do zero
    barra.style.animation = "";
    // leitores de tela: avisa a troca só quando a pessoa escolheu o passo
    lista.setAttribute("aria-live", manual ? "polite" : "off");
  }

  segs.forEach(function (b, k) {
    b.addEventListener("click", function () { ir(k, true); });
    b.querySelector("i").addEventListener("animationend", function () {
      if (b.classList.contains("ativo")) ir(atual + 1, false);
    });
  });

  if (pausa) {
    pausa.addEventListener("click", function () {
      pausado = !pausado;
      secao.classList.toggle("pausado", pausado);
      pausa.setAttribute("aria-pressed", String(pausado));
      pausa.setAttribute("aria-label", pausado ? "Retomar a apresentação automática" : "Pausar a apresentação automática");
      if (pausaTxt) pausaTxt.textContent = pausado ? "Continuar" : "Pausar";
    });
  }

  ir(0, false);
})();
