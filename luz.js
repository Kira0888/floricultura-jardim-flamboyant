/* Comportamentos da página que não cabem no motor de rolagem.
   1. Vídeo da abertura: só começa a baixar depois que a página carregou (o quadro de reserva
      já ocupa o lugar), só toca na tela e não é carregado com movimento reduzido nem em
      conexão lenta/econômica.
   2. Teclado: focar um link do trilho horizontal leva a rolagem até o cartão. */
(function () {
  "use strict";
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var video = document.querySelector(".abertura-video video");
  var videoNaTela = true;

  // ---------- 1. vídeo da abertura ----------
  function tocar() {
    if (!video || !video.src) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay barrado: o quadro de reserva continua visível */ });
  }

  function conexaoPermite() {
    var c = navigator.connection;
    if (!c) return true;
    if (c.saveData) return false;
    return !/(^|-)2g$/.test(c.effectiveType || "");
  }

  function carregarVideo() {
    if (!video || video.src) return;
    var mp4 = video.getAttribute("data-mp4");
    var webm = video.getAttribute("data-webm");
    var usaMp4 = !!video.canPlayType('video/mp4; codecs="avc1.4D401F"') || !webm;
    video.muted = true; // iOS exige antes do play()
    video.src = usaMp4 ? mp4 : webm;
    video.load();
    if (videoNaTela) tocar();
  }

  if (video) {
    if (reduzido || !conexaoPermite()) {
      // fica só o quadro de reserva (poster): nenhum byte do vídeo é baixado
      video.removeAttribute("autoplay");
      video.preload = "none";
    } else {
      var iniciar = function () {
        if ("requestIdleCallback" in window) window.requestIdleCallback(carregarVideo, { timeout: 1500 });
        else setTimeout(carregarVideo, 200);
      };
      if (document.readyState === "complete") iniciar();
      else window.addEventListener("load", iniciar, { once: true });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entradas) {
          videoNaTela = entradas[entradas.length - 1].isIntersecting;
          if (videoNaTela) tocar(); else if (video.src) video.pause();
        }, { threshold: 0.01 }).observe(video);
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { if (video.src) video.pause(); } else if (videoNaTela) tocar();
      });
    }
  }

  if (reduzido) return;

  // ---------- 2. teclado no trilho horizontal ----------
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
