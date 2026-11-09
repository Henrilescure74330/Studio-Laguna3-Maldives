// Mélodie thaï traditionnelle, douce et relaxante, composée et jouée par la page elle-même
// (Web Audio : khim pincé, ching sur les temps, bourdon grave, écho). Aucun fichier, aucun YouTube,
// aucun droit d'auteur. Seulement sur la page de connexion : elle démarre au premier geste du
// visiteur (les navigateurs bloquent le son automatique), le bouton ♪ en bas à gauche la coupe
// ou la relance, et elle s'éteint en douceur dès que le site s'ouvre.
(function () {
  var verrou = document.getElementById("verrou");
  var Contexte = window.AudioContext || window.webkitAudioContext;
  if (!verrou || !Contexte) return;

  var CLE = "laguna3-musique-coupee";
  var VOLUME = 0.45, TEMPO = 64; // battements par minute, tranquille

  var style = document.createElement("style");
  style.textContent =
    "#musique-btn{position:fixed;left:max(14px,env(safe-area-inset-left,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:2147483000;" +
    "display:flex;align-items:center;gap:8px;padding:9px 14px 9px 12px;border-radius:999px;border:1px solid rgba(214,182,126,.55);" +
    "background:rgba(6,17,19,.72);color:#eef3f1;font:500 .72rem 'Jost',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;" +
    "cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "#musique-btn:focus-visible{outline:2px solid #d6b67e;outline-offset:2px}" +
    "#musique-btn .note{font-size:1rem;line-height:1;color:#d6b67e}" +
    "#musique-btn[aria-pressed=false] .note{opacity:.5;text-decoration:line-through}" +
    "@media print{#musique-btn{display:none}}";
  document.head.appendChild(style);

  var bouton = document.createElement("button");
  bouton.type = "button";
  bouton.id = "musique-btn";
  bouton.innerHTML = '<span class="note" aria-hidden="true">♪</span><span class="texte">Musique</span>';
  document.body.appendChild(bouton);

  var ctx = null, sortie = null, echo = null, minuteur = null, joue = false, fini = false;
  function majBouton() {
    bouton.setAttribute("aria-pressed", joue ? "true" : "false");
    bouton.querySelector(".texte").textContent = joue ? "Couper la musique" : "Musique";
    bouton.title = joue ? "Couper la mélodie thaï" : "Écouter une mélodie thaï relaxante";
  }
  majBouton();

  // Gamme thaï : 7 degrés égaux par octave ; mélodie pentatonique sur les degrés 0, 1, 2, 4, 5.
  var BASE = 220;
  function freq(degre) { return BASE * Math.pow(2, degre / 7); }
  var PENTA = [0, 1, 2, 4, 5];
  function note(i) { // i : rang dans la pentatonique, peut dépasser l'octave
    var o = Math.floor(i / 5), r = ((i % 5) + 5) % 5;
    return freq(PENTA[r] + 7 * o);
  }

  function preparer() {
    ctx = new Contexte();
    sortie = ctx.createGain(); sortie.gain.value = 0; sortie.connect(ctx.destination);
    // Écho doux, comme dans une sala au bord de l'eau
    echo = ctx.createDelay(2); echo.delayTime.value = 60 / TEMPO * 0.75;
    var retour = ctx.createGain(); retour.gain.value = 0.33;
    var filtre = ctx.createBiquadFilter(); filtre.type = "lowpass"; filtre.frequency.value = 2200;
    echo.connect(filtre); filtre.connect(retour); retour.connect(echo); filtre.connect(sortie);
    // Bourdon grave et léger (tonique + quinte)
    [freq(-7), freq(-3)].forEach(function (f, k) {
      var o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = "sine"; o.frequency.value = f; g.gain.value = k ? 0.035 : 0.05;
      lfo.frequency.value = 0.07 + k * 0.04; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(sortie); o.start(); lfo.start();
    });
  }

  function khim(t, f, fort) { // corde frappée : attaque nette, longue extinction, petit battement
    [[1, 1], [2.01, 0.28], [3.98, 0.08]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = p[0] === 1 ? "triangle" : "sine";
      o.frequency.value = f * p[0];
      var v = 0.16 * p[1] * fort;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 2.4 / p[0]);
      o.connect(g); g.connect(sortie); g.connect(echo);
      o.start(t); o.stop(t + 2.6);
    });
  }

  function ching(t, ouvert) { // petites cymbales : « ching » ouvert, « chap » étouffé
    [2793, 3911, 5127].forEach(function (f, k) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      var duree = ouvert ? 1.4 - k * 0.3 : 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.012 / (k + 1), t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0004, t + duree);
      o.connect(g); g.connect(sortie);
      o.start(t); o.stop(t + duree + 0.05);
    });
  }

  // Phrases de 8 temps : marche douce, notes répétées, retour vers la tonique en fin de phrase
  var temps = 60 / TEMPO, prochain = 0, pas = 0, position = 5, phrase = [];
  function nouvellePhrase() {
    phrase = [];
    var p = position;
    for (var i = 0; i < 16; i++) { // croches
      if (i === 15) { phrase.push(null); continue; }
      if (i >= 12) { p += p > 5 ? -1 : p < 5 ? 1 : 0; phrase.push(p); continue; }
      var r = Math.random();
      if (r < 0.22) { phrase.push(null); continue; }        // silence, respiration
      if (r < 0.62) p += Math.random() < 0.5 ? -1 : 1;     // pas conjoint
      else if (r < 0.78) p += Math.random() < 0.5 ? -2 : 2; // petit saut
      p = Math.max(2, Math.min(10, p));
      phrase.push(p);
    }
    position = p;
  }
  function programmer() {
    while (prochain < ctx.currentTime + 0.4) {
      var croche = pas % 16;
      if (croche === 0) nouvellePhrase();
      var n = phrase[croche];
      if (n !== null) {
        khim(prochain, note(n), croche % 4 === 0 ? 1 : 0.7);
        if (croche % 4 === 0 && Math.random() < 0.35) khim(prochain + 0.012, note(n - 5), 0.35); // octave grave
      }
      if (croche % 4 === 0) ching(prochain, croche % 8 === 4 ? false : true);
      prochain += temps / 2; pas++;
    }
  }

  function jouer() {
    if (fini) return;
    if (!ctx) preparer();
    if (ctx.state === "suspended") ctx.resume();
    if (!minuteur) { prochain = ctx.currentTime + 0.15; minuteur = setInterval(programmer, 120); programmer(); }
    sortie.gain.cancelScheduledValues(ctx.currentTime);
    sortie.gain.setValueAtTime(sortie.gain.value, ctx.currentTime);
    sortie.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 2.5);
    joue = true; majBouton();
  }
  function arreter(apres) {
    joue = false; majBouton();
    if (!ctx) { if (apres) apres(); return; }
    sortie.gain.cancelScheduledValues(ctx.currentTime);
    sortie.gain.setValueAtTime(sortie.gain.value, ctx.currentTime);
    sortie.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(function () {
      if (joue) return;
      clearInterval(minuteur); minuteur = null;
      ctx.suspend(); if (apres) apres();
    }, 1300);
  }

  bouton.addEventListener("click", function () {
    if (joue) { arreter(); try { localStorage.setItem(CLE, "1"); } catch (e) {} }
    else { try { localStorage.removeItem(CLE); } catch (e) {} jouer(); }
  });

  // Premier geste sur la page de connexion : c'est lui qui autorise le son.
  var GESTES = ["pointerdown", "keydown", "touchstart"];
  function premierGeste(e) {
    if (bouton.contains(e.target)) return;
    GESTES.forEach(function (n) { document.removeEventListener(n, premierGeste, true); });
    var coupee = false;
    try { coupee = localStorage.getItem(CLE) === "1"; } catch (er) {}
    if (!coupee) jouer();
  }
  GESTES.forEach(function (n) { document.addEventListener(n, premierGeste, true); });

  // Le site s'ouvre (page de connexion retirée) : fondu, arrêt, et le bouton disparaît.
  new MutationObserver(function () {
    if (fini || document.getElementById("verrou")) return;
    fini = true; bouton.remove();
    arreter(function () { if (ctx) ctx.close(); });
  }).observe(document.body, { childList: true });
})();
