/* Comportamentos da página que não cabem no motor de rolagem.
   1. Vídeos (abertura e clipes em campo). Todos têm autoplay loop muted playsinline.
      - Nenhum byte é baixado antes da hora: a abertura carrega depois do load da página (o quadro de
        reserva já ocupa o lugar); cada clipe, quando chega perto da tela.
      - Só tocam enquanto visíveis; pausam com a aba em segundo plano.
      - Cada vídeo tem um botão Reproduzir/Pausar. Quando o autoplay não roda (movimento reduzido no
        sistema, economia de bateria do iOS, política do navegador, conexão econômica), o vídeo não fica
        "travado": mostra o quadro de reserva e o botão "Reproduzir", e a pessoa decide.
   2. Teclado: focar um link do trilho horizontal leva a rolagem até o cartão. */
(function () {
  "use strict";
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var videos = [].slice.call(document.querySelectorAll("video[data-mp4]"));

  function conexaoPermite() {
    var c = navigator.connection;
    if (!c) return true;
    if (c.saveData) return false;
    return !/(^|-)2g$/.test(c.effectiveType || "");
  }
  var automatico = !reduzido && conexaoPermite(); // pode tocar sozinho?

  // ---------- botão de cada vídeo ----------
  function botaoDe(v) { return v.__btn; }
  function rotular(v) {
    var btn = botaoDe(v);
    if (!btn) return;
    var tocando = !v.paused && !v.ended;
    btn.setAttribute("aria-pressed", String(tocando));
    var txt = btn.querySelector(".vctl-txt");
    var nome = v.getAttribute("aria-label") || "vídeo";
    btn.setAttribute("aria-label", (tocando ? "Pausar " : "Reproduzir ") + (nome.charAt(0).toLowerCase() + nome.slice(1)));
    if (txt) txt.textContent = tocando ? "Pausar" : "Reproduzir";
    btn.classList.toggle("vctl-parado", !tocando);
  }

  videos.forEach(function (v) {
    var btn = v.parentElement.querySelector(".vctl") ||
              (v.closest(".fx-palco") && v.closest(".fx-palco").querySelector(".vctl"));
    v.__btn = btn || null;
    v.addEventListener("play", function () { rotular(v); });
    v.addEventListener("pause", function () { rotular(v); });
    v.addEventListener("ended", function () { rotular(v); });
    rotular(v);
  });

  // ---------- reprodução ----------
  function tocar(v) {
    if (!v.src) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay barrado: o botão "Reproduzir" aparece */ rotular(v); });
  }

  function carregar(v) {
    if (v.src) return;
    var mp4 = v.getAttribute("data-mp4");
    var webm = v.getAttribute("data-webm");
    var usaMp4 = !!v.canPlayType('video/mp4; codecs="avc1.4D401F"') || !webm;
    v.muted = true; // iOS exige antes do play()
    v.src = usaMp4 ? mp4 : webm;
    v.load();
    // o atributo autoplay ligaria o vídeo assim que carregasse, mesmo longe da tela
    if (v.__naTela && v.__quer !== false) tocar(v); else v.pause();
  }

  // clique no botão: a decisão da pessoa vale mais que o automático
  videos.forEach(function (v) {
    if (!v.__btn) return;
    v.__btn.addEventListener("click", function () {
      if (!v.paused && !v.ended) { v.__quer = false; v.pause(); return; }
      v.__quer = true;
      v.removeAttribute("autoplay");
      if (!v.src) carregar(v);
      tocar(v);
    });
  });

  if (videos.length) {
    if (!automatico) {
      // sem autoplay: só os quadros de reserva e o botão "Reproduzir"
      videos.forEach(function (v) { v.removeAttribute("autoplay"); v.preload = "none"; v.__naTela = false; });
      if ("IntersectionObserver" in window) {
        // se a pessoa deu play, só toca enquanto visível
        var so = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (e) {
            e.target.__naTela = e.isIntersecting;
            if (!e.target.src) return;
            if (e.isIntersecting) { if (e.target.__quer === true) tocar(e.target); } else e.target.pause();
          });
        }, { threshold: 0.25 });
        videos.forEach(function (v) { so.observe(v); });
      }
    } else {
      // a abertura carrega quando a página ficou ociosa; os clipes, quando chegam perto da tela
      var abertura = document.querySelector(".abertura-video video");
      var iniciar = function () {
        if (!abertura) return;
        if ("requestIdleCallback" in window) window.requestIdleCallback(function () { carregar(abertura); }, { timeout: 1500 });
        else setTimeout(function () { carregar(abertura); }, 200);
      };
      if (document.readyState === "complete") iniciar();
      else window.addEventListener("load", iniciar, { once: true });

      if ("IntersectionObserver" in window) {
        var perto = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting && e.target !== abertura) { carregar(e.target); perto.unobserve(e.target); }
          });
        }, { rootMargin: "120% 120%" });
        var visivel = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (e) {
            e.target.__naTela = e.isIntersecting;
            if (e.isIntersecting) { if (e.target.__quer !== false) tocar(e.target); } else if (e.target.src) e.target.pause();
          });
        }, { threshold: 0.25 });
        videos.forEach(function (v) { perto.observe(v); visivel.observe(v); });
      } else {
        videos.forEach(carregar);
      }
      document.addEventListener("visibilitychange", function () {
        videos.forEach(function (v) {
          if (!v.src) return;
          if (document.hidden) v.pause(); else if (v.__naTela && v.__quer !== false) tocar(v);
        });
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
