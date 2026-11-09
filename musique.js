// Musique d'ambiance : « Kwarm Nai Chai » (Rainbow), lue depuis YouTube.
// Seulement sur la page de connexion, aucun lecteur visible : le son est lu par un lecteur caché.
// Les navigateurs bloquent le son automatique : la mélodie démarre au premier geste du visiteur
// sur la page de connexion (toucher l'écran, taper le mot de passe), le bouton ♪ en bas à gauche
// la coupe ou la relance, et elle s'éteint en douceur dès que le site s'ouvre.
// Pour changer de morceau, remplacer seulement VIDEO_MUSIQUE par l'identifiant YouTube.
(function () {
  var VIDEO_MUSIQUE = "canwmI3mST4";
  var CLE = "laguna3-musique-coupee";
  var coupee = false;
  try { coupee = localStorage.getItem(CLE) === "1"; } catch (e) {}

  var style = document.createElement("style");
  style.textContent =
    "#musique-btn{position:fixed;left:max(14px,env(safe-area-inset-left,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:2147483000;" +
    "display:flex;align-items:center;gap:8px;padding:9px 14px 9px 12px;border-radius:999px;border:1px solid rgba(214,182,126,.55);" +
    "background:rgba(6,17,19,.72);color:#eef3f1;font:500 .72rem 'Jost',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;" +
    "cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "#musique-btn:focus-visible{outline:2px solid #d6b67e;outline-offset:2px}" +
    "#musique-btn .note{font-size:1rem;line-height:1;color:#d6b67e}" +
    "#musique-btn[aria-pressed=false] .note{opacity:.5;text-decoration:line-through}" +
    "#musique-lecteur{position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none}" +
    "@media print{#musique-btn{display:none}}";
  document.head.appendChild(style);

  var bouton = document.createElement("button");
  bouton.type = "button";
  bouton.id = "musique-btn";
  bouton.innerHTML = '<span class="note" aria-hidden="true">♪</span><span class="texte">Musique</span>';
  var zone = document.createElement("div");
  zone.id = "musique-lecteur";
  zone.setAttribute("aria-hidden", "true");
  zone.innerHTML = '<div id="musique-yt"></div>';
  document.body.appendChild(zone);
  document.body.appendChild(bouton);

  var lecteur = null, pret = false, veutJouer = false, joue = false;

  function majBouton() {
    bouton.setAttribute("aria-pressed", joue ? "true" : "false");
    bouton.querySelector(".texte").textContent = joue ? "Couper la musique" : "Musique";
    bouton.title = joue ? "Couper la musique « Kwarm Nai Chai »" : "Écouter « Kwarm Nai Chai » (Rainbow)";
  }
  majBouton();

  function jouer() {
    veutJouer = true;
    if (pret) { lecteur.unMute(); lecteur.setVolume(60); lecteur.playVideo(); }
  }
  function arreter() {
    veutJouer = false;
    if (pret) lecteur.pauseVideo();
    joue = false; majBouton();
  }

  bouton.addEventListener("click", function () {
    if (joue || veutJouer) {
      arreter();
      try { localStorage.setItem(CLE, "1"); } catch (e) {}
    } else {
      try { localStorage.removeItem(CLE); } catch (e) {}
      jouer();
    }
  });

  var verrou = document.getElementById("verrou");
  if (!verrou) { bouton.remove(); zone.remove(); return; }

  // Premier geste sur la page de connexion : c'est lui qui autorise le son.
  function premierGeste(e) {
    if (e.target === bouton || bouton.contains(e.target)) return;
    ["pointerdown", "keydown", "focusin", "touchstart"].forEach(function (n) { document.removeEventListener(n, premierGeste, true); });
    try { coupee = localStorage.getItem(CLE) === "1"; } catch (er) {}
    if (!coupee) jouer();
  }
  ["pointerdown", "keydown", "focusin", "touchstart"].forEach(function (n) { document.addEventListener(n, premierGeste, true); });

  // Le site s'ouvre (page de connexion retirée) : fondu puis arrêt, et le bouton disparaît.
  var fini = false;
  function quitter() {
    if (fini) return; fini = true; veutJouer = false;
    bouton.remove();
    if (!pret) { zone.remove(); return; }
    var v = 60;
    var f = setInterval(function () {
      v -= 6;
      if (v > 0 && joue) { lecteur.setVolume(v); return; }
      clearInterval(f); try { lecteur.stopVideo(); lecteur.destroy(); } catch (er) {} zone.remove();
    }, 120);
  }
  new MutationObserver(function () { if (!document.getElementById("verrou")) quitter(); })
    .observe(document.body, { childList: true });

  var precedent = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (precedent) precedent();
    lecteur = new YT.Player("musique-yt", {
      width: 1, height: 1, videoId: VIDEO_MUSIQUE,
      playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: VIDEO_MUSIQUE, playsinline: 1, rel: 0 },
      events: {
        onReady: function () { pret = true; if (fini) { quitter(); return; } if (veutJouer) jouer(); },
        onStateChange: function (ev) {
          if (fini) return;
          if (ev.data === YT.PlayerState.PLAYING) { joue = true; majBouton(); }
          else if (ev.data === YT.PlayerState.ENDED) { lecteur.seekTo(0); lecteur.playVideo(); }
          else if (ev.data === YT.PlayerState.PAUSED) { joue = false; veutJouer = false; majBouton(); }
        },
        onError: function () { bouton.hidden = true; }
      }
    });
  };
  var s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.async = true;
  document.head.appendChild(s);
})();
