/* Movimento-assinatura: a fresta de luz.
   Vive na própria página (não no motor). A abertura e o pico leem o
   progresso da rolagem; aqui ele ganha curva suave e um leve balanço
   que acompanha o ponteiro, como luz atravessando folhagem. */
(function () {
  "use strict";
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzido) return;

  // ilustrações só se mexem enquanto a cena está na tela
  if ("IntersectionObserver" in window) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { e.target.classList.toggle("em-tela", e.isIntersecting); });
    }, { rootMargin: "10% 0px" });
    document.querySelectorAll(".cena").forEach(function (c) { vigia.observe(c); });
  }

  // Teclado: ao focar um link do trilho horizontal, a rolagem vai até o cartão
  // (o trilho é deslocado por transform; sem isto o foco desalinharia a cena).
  var trilho = document.querySelector('[data-fx="trilho"]');
  if (trilho) {
    var secaoTrilho = trilho.closest("[data-fx-fixa]");
    var palcoTrilho = trilho.closest(".fx-palco");
    trilho.addEventListener("focusin", function (e) {
      var cartao = e.target.closest(".cartao");
      if (!cartao || !secaoTrilho) return;
      var alcance = trilho.scrollWidth - trilho.clientWidth;
      if (alcance <= 0) return;
      var pad = parseFloat(getComputedStyle(trilho).paddingLeft) || 0;
      var origem = cartao.getBoundingClientRect().left - trilho.getBoundingClientRect().left - pad;
      var prog = Math.min(1, Math.max(0, origem / alcance));
      var percurso = secaoTrilho.offsetHeight - window.innerHeight;
      if (palcoTrilho) { palcoTrilho.scrollLeft = 0; }
      window.scrollTo({ top: secaoTrilho.offsetTop + prog * percurso, behavior: "auto" });
    });
  }

  var abertura = document.querySelector(".abertura");
  var raios = document.querySelector(".raios");
  if (!abertura) return;

  var balanco = 0;       // -1..1, vindo do ponteiro
  var alvo = 0;
  var agendado = false;

  function suave(t) { return t * t * (3 - 2 * t); } // smoothstep

  function atualizar() {
    agendado = false;
    // a luz começa já visível e atravessa a tela com curva suave
    var p = parseFloat(abertura.style.getPropertyValue("--progresso")) || 0;
    abertura.style.setProperty("--p", (0.04 + 0.92 * suave(p) + balanco * 0.012).toFixed(4));

    if (raios) {
      var pico = document.querySelector(".pico");
      var q = pico ? parseFloat(pico.style.getPropertyValue("--progresso")) || 0 : 0;
      raios.style.setProperty("--sway", (Math.sin(q * 9) * 1.6 + balanco * 1.2).toFixed(2) + "deg");
    }
  }

  function pedir() {
    if (!agendado) { agendado = true; requestAnimationFrame(atualizar); }
  }

  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      alvo = (e.clientX / window.innerWidth) * 2 - 1;
      balanco += (alvo - balanco) * 0.2;
      pedir();
    }, { passive: true });
  }
  pedir();
})();
