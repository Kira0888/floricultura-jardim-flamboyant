/* Comportamentos da página que não cabem no motor de rolagem (o motor não é editado).
   1. Vídeo da abertura: só toca enquanto está na tela; com movimento reduzido, não toca.
   2. Ilustrações e passos só animam enquanto a cena está na tela (classe .em-tela).
   3. Teclado: focar um link do trilho horizontal leva a rolagem até o cartão. */
(function () {
  "use strict";
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var video = document.querySelector(".abertura-video video");

  // ---------- 1. vídeo da abertura ----------
  if (video) {
    if (reduzido) {
      // movimento reduzido: fica o quadro de reserva (poster), sem reprodução
      video.removeAttribute("autoplay");
      video.pause();
      video.preload = "none";
    } else {
      video.muted = true; // iOS exige o atributo/propriedade antes do play()
      var tocar = function () {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay barrado: o poster continua visível */ });
      };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entradas) {
          entradas.forEach(function (e) { if (e.isIntersecting) tocar(); else video.pause(); });
        }, { threshold: 0.01 }).observe(video);
      } else {
        tocar();
      }
      // economia de bateria: pausa com a aba em segundo plano
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) video.pause(); else tocar();
      });
    }
  }

  if (reduzido) return;

  // ---------- 2. animações só com a cena na tela ----------
  if ("IntersectionObserver" in window) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { e.target.classList.toggle("em-tela", e.isIntersecting); });
    }, { rootMargin: "10% 0px" });
    document.querySelectorAll(".cena").forEach(function (c) { vigia.observe(c); });
  }

  // ---------- 3. teclado no trilho horizontal ----------
  // O trilho é deslocado por transform; sem isto, focar um link fora da tela desalinharia a cena.
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
})();
