/* Comportamentos da página que não cabem no motor de rolagem.
   1. Vídeo da abertura: só começa a baixar depois que a página carregou (o quadro de reserva
      já ocupa o lugar), só toca na tela e não é carregado com movimento reduzido nem em
      conexão lenta/econômica.
   2. Animações das ilustrações só rodam com a ilustração na tela. Em vez de uma classe no ancestral
      (que obrigaria o navegador a reavaliar o estilo de milhares de nós SVG a cada troca de
      cena), pausa-se cada CSSAnimation pela API de Animações, sem invalidar estilo.
      Qualidade adaptativa: se o aparelho não sustentar a taxa de quadros, o balanço por folha é desligado.
   3. Teclado: focar um link do trilho horizontal leva a rolagem até o cartão. */
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

  // ---------- 2. animações só com a ilustração na tela ----------
  // Só mexe em CSSAnimation (balanço, motas...). A barra de progresso dos passos tem
  // controle próprio (etapas.js) e transições não são tocadas.
  // Observa cada ilustração (não a seção inteira): no catálogo, só os cartões que
  // estão realmente à vista animam, e nada é reavaliado por classe em ancestral.
  var temAPI = typeof Element !== "undefined" && typeof Element.prototype.getAnimations === "function";
  var degradado = false;      // true depois que o balanço por folha foi desligado
  var visiveis = 0;           // quantas ilustrações animadas estão à vista

  function alternar(el, rodar) {
    var todas = el.getAnimations({ subtree: true });
    for (var i = 0; i < todas.length; i++) {
      var a = todas[i];
      if (a.animationName === undefined || a.animationName === "enche") continue;
      if (rodar) { if (a.playState === "paused") a.play(); } else if (a.playState === "running") a.pause();
    }
  }

  // ---------- 2b. qualidade adaptativa ----------
  // Cada folha balançando é repintada na thread principal. Em aparelho potente isso é invisível;
  // num aparelho fraco derruba a taxa de quadros. Se a taxa se mantiver abaixo de ~50 fps por
  // ~1,5 s (depois de uma carência de 1,2 s) com ilustrações animadas na tela, o balanço por folha é desligado (a ilustração fica
  // parada na pose original). Tudo o mais permanece igual.
  var CHAVE = "jf-balanco-leve";
  function lembrado() { try { return sessionStorage.getItem(CHAVE) === "1"; } catch (e) { return false; } }
  function lembrar() { try { sessionStorage.setItem(CHAVE, "1"); } catch (e) { /* sem storage: tudo bem */ } }

  function desligarBalanco() {
    degradado = true;
    if (!temAPI) return;
    var todas = document.getAnimations();
    for (var i = 0; i < todas.length; i++) if (todas[i].animationName === "bal") todas[i].cancel();
  }

  var monitorando = false;
  var ultimaRolagem = 0;
  var janela = { ini: 0, n: 0, ruins: 0, inicio: 0 };

  function monitor(t) {
    if (degradado || visiveis <= 0) { monitorando = false; return; }
    if (!janela.ini) janela.ini = t;
    janela.n++;
    var dur = t - janela.ini;
    if (dur >= 500) {
      var media = dur / janela.n; // ms por quadro na janela de 0,5 s
      // carência: a chegada de uma ilustração à tela (decodificar fotos, criar camadas) dá um tranco
      // único que não diz nada sobre o aparelho
      var pronto = document.readyState === "complete" && !document.hidden && t > 3000 && (t - janela.inicio) > 1200;
      var limite = (t - ultimaRolagem < 1000) ? 23 : 19; // 60 fps = 16,7 ms; passa de 19 ms = abaixo de ~52 fps
      // contagem "vazada": janela ruim soma 1, janela boa desconta 1 (não zera), então um aparelho
      // que oscila perto do limite também é detectado, e um tranco isolado não
      janela.ruins = (pronto && media > limite) ? janela.ruins + 1 : Math.max(0, janela.ruins - 1);
      janela.ini = t; janela.n = 0;
      // 3 janelas seguidas ruins (~1,5 s), ou 2 seguidas muito ruins (abaixo de ~22 fps)
      janela.muito = (pronto && media > 45) ? (janela.muito || 0) + 1 : 0;
      if (janela.ruins >= 3 || janela.muito >= 2) { desligarBalanco(); lembrar(); monitorando = false; return; }
    }
    requestAnimationFrame(monitor);
  }
  function iniciarMonitor() {
    if (monitorando || degradado) return;
    monitorando = true; janela.ini = 0; janela.n = 0; janela.ruins = 0; janela.muito = 0; janela.inicio = performance.now();
    requestAnimationFrame(monitor);
  }
  window.addEventListener("scroll", function () { ultimaRolagem = performance.now(); }, { passive: true });

  if (temAPI && "IntersectionObserver" in window) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var antes = e.target.__vivo === true;
        if (antes !== e.isIntersecting) {
          e.target.__vivo = e.isIntersecting;
          visiveis += e.isIntersecting ? 1 : -1;
        }
        alternar(e.target, e.isIntersecting);
      });
      if (visiveis > 0) iniciarMonitor();
    }, { rootMargin: "80px" });
    document.querySelectorAll(".arco, .quarto, .promessa-arte").forEach(function (el) { vigia.observe(el); });
    if (lembrado()) {
      // aparelho que já não aguentou nesta sessão: não liga o balanço de novo
      if (document.readyState === "complete") desligarBalanco();
      else window.addEventListener("load", desligarBalanco, { once: true });
    }
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
