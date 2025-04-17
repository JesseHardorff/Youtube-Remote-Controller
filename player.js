// Deze functie verwijdert het startscherm nadat de gebruiker erop klikt
// Dat is nodig omdat browsers de autoplay blokkeren zonder interactie
function verwijderOverlay() {
  document.getElementById("overlay").style.display = "none";
  // Hier stuur ik een bericht naar de afstandsbediening dat de speler klaar is
  socket.emit("command", "player_interactive");
}

// Verbinding met socket io
// Dit zorgt ervoor dat de afstandsbediening kan communiceren met de player
const socket = io();

// Dit object houdt bij wat de huidige status is van de speler
let spelerStatus = {
  isAanHetAfspelen: false,
  isGedempt: false,
  volume: 100,
};

// Dit object voorkomt dat dezelfde melding meerdere keren verschijnt
// Dit moest ik toevoegen omdat hij dat deed dus dat is nu gefixt
let laatsteActie = {
  type: null,
  tijdstip: 0,
};
// Deze functie toont een melding in het midden van de video

function toonActieMelding(actie) {
  // Hier check ik of dezelfde actie niet net is uitgevoerd
  const nu = Date.now();
  if (laatsteActie.type === actie && nu - laatsteActie.tijdstip < 500) {
    return; // Als dezelfde actie binnen .5 seconde opnieuw komt, negeren we 'm
  }

  // Update wanneer we deze actie voor het laatst hebben gezien
  laatsteActie.type = actie;
  laatsteActie.tijdstip = nu;

  // Verwijder eventuele oude meldingen
  const container = document.getElementById("actieMeldingen");
  container.innerHTML = "";

  // Maak een nieuwe melding aan
  const melding = document.createElement("div");
  melding.className = "actie-melding";

  // Hier bepaal ik welke tekst er in de melding moet komen
  let meldingTekst = "";
  switch (actie) {
    case "playPause":
      meldingTekst = spelerStatus.isAanHetAfspelen ? "⏸️ Pauze" : "▶️ Afspelen";
      break;
    case "skipForward":
      meldingTekst = "⏩ +5 seconden";
      break;
    case "skipBackward":
      meldingTekst = "⏪ -5 seconden";
      break;
    case "toggleMute":
      meldingTekst = spelerStatus.isGedempt ? "🔊 Geluid aan" : "🔇 Geluid uit";
      break;
    case "volume":
      meldingTekst = `🔊 Volume: ${spelerStatus.volume}%`;
      break;
    default:
      meldingTekst = actie;
  }

  melding.textContent = meldingTekst;
  container.appendChild(melding);
}

// Deze functie stuurt de huidige status naar de remote
// Zo weet de remote of we aan het afspelen zijn, wat het volume is, etc.
function updateRemoteStatus() {
  // Stuur of het aan het afspelen is
  socket.emit("command", `player_state:${spelerStatus.isAanHetAfspelen ? "playing" : "paused"}`);

  // Stuur of het geluid aan staat
  socket.emit("command", `player_state:${spelerStatus.isGedempt ? "muted" : "unmuted"}`);

  // Stuur de huidige volume
  socket.emit("command", `player_state:volume:${spelerStatus.volume}`);
}

// Hier luistert het naar berichten van de remote
socket.on("command", (commando) => {
  // Hier word alle verschillende commando's uitgevoert die kunnen binnenkomen
  if (commando === "playPause") {
    // Bepaal de huidige status voordat het deze verander
    const wasAanHetAfspelen = spelerStatus.isAanHetAfspelen;
    schakelAfspelenPauze();
    // Toon de juiste melding op basis van de vorige status
    toonActieMelding(wasAanHetAfspelen ? "Pauze" : "Afspelen");
  } else if (commando === "skipForward") {
    spoelVooruit();
    toonActieMelding("skipForward");
  } else if (commando === "skipBackward") {
    spoelTerug();
    toonActieMelding("skipBackward");
  } else if (commando === "toggleMute") {
    // Bepaal de huidige mute status voordat we deze veranderen
    const wasGedempt = spelerStatus.isGedempt;
    schakelGeluid();
    // Toon de juiste melding op basis van de vorige status
    toonActieMelding(wasGedempt ? "Geluid aan" : "Geluid uit");
  } else if (commando === "get_player_state") {
    updateRemoteStatus();
    // Hier toon ik geen melding omdat dat irritant zou zijn
  } else if (commando.startsWith("volume:")) {
    const volume = parseInt(commando.split(":")[1]);
    zetVolume(volume);
    // Alleen een melding tonen als het volume echt verandert
    if (Math.abs(volume - spelerStatus.volume) > 5) {
      toonActieMelding("volume");
    }
  } else if (commando.length === 11) {
    // YouTube video ID's zijn altijd 11 tekens lang

    laadVideo(commando);
    toonActieMelding("Nieuwe video wordt geladen");
  } else {
  }
});

// Hier laad ik de YouTube API in
// Dit was best ingewikkeld om uit te zoeken hoe dit werkt
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Hier maak ik de YouTube speler aan
let speler;
function onYouTubeIframeAPIReady() {
  speler = new YT.Player("speler", {
    height: "390",
    width: "640",
    videoId: "9bZkp7q19f0", // Dit is een standaard video om mee te beginnen
    playerVars: {
      playsinline: 1,
      autoplay: 1,
      mute: 0, // Video start met geluid aan
    },
    events: {
      onReady: spelerKlaar,
      onStateChange: spelerStatusVeranderd,
    },
  });
}

// Deze functie schakelt tussen afspelen en pauzeren
function schakelAfspelenPauze() {
  var status = speler.getPlayerState();
  if (status === YT.PlayerState.PLAYING) {
    speler.pauseVideo();
    spelerStatus.isAanHetAfspelen = false;
  } else {
    speler.playVideo();
    spelerStatus.isAanHetAfspelen = true;
  }
  updateRemoteStatus();
}

// Deze functie spoelt 5 seconden vooruit
function spoelVooruit() {
  var huidigeTijd = speler.getCurrentTime();
  speler.seekTo(huidigeTijd + 5, true);
}

// Deze functie spoelt 5 seconden terug
function spoelTerug() {
  var huidigeTijd = speler.getCurrentTime();
  speler.seekTo(Math.max(0, huidigeTijd - 5), true);
}

// Deze functie zet het geluid aan of uit
function schakelGeluid() {
  if (speler.isMuted()) {
    speler.unMute();
    spelerStatus.isGedempt = false;
  } else {
    speler.mute();
    spelerStatus.isGedempt = true;
  }
  updateRemoteStatus();
}

// Deze functie past het volume aan
function zetVolume(volume) {
  speler.setVolume(volume);
  spelerStatus.volume = volume;
  updateRemoteStatus();
}

// Deze functie laadt een nieuwe video
function laadVideo(videoId) {
  speler.loadVideoById(videoId);
  spelerStatus.isAanHetAfspelen = true;
  updateRemoteStatus();
}

// Deze functie wordt aangeroepen als de speler klaar is om te starten
function spelerKlaar(event) {
  event.target.playVideo();
  spelerStatus.isAanHetAfspelen = true;
  spelerStatus.volume = speler.getVolume();
  spelerStatus.isGedempt = speler.isMuted();
  updateRemoteStatus();
}

// Deze functie wordt aangeroepen als de status van de speler verandert
// Bijvoorbeeld als de video klaar is of gepauzeerd wordt
function spelerStatusVeranderd(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    spelerStatus.isAanHetAfspelen = true;
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    spelerStatus.isAanHetAfspelen = false;
  }

  // Update de mute status en volume
  spelerStatus.isGedempt = speler.isMuted();
  spelerStatus.volume = speler.getVolume();

  // Stuur de bijgewerkte status naar de remote
  updateRemoteStatus();
}

// Hier check ik elke seconde of de mute status of volume is veranderd
// Dit moest ik doen omdat de YouTube API niet altijd events stuurt
setInterval(() => {
  if (speler && speler.getPlayerState) {
    const huidigeGedempt = speler.isMuted();
    const huidigeVolume = speler.getVolume();

    if (huidigeGedempt !== spelerStatus.isGedempt || huidigeVolume !== spelerStatus.volume) {
      spelerStatus.isGedempt = huidigeGedempt;
      spelerStatus.volume = huidigeVolume;
      updateRemoteStatus();
    }
  }
}, 1000);
