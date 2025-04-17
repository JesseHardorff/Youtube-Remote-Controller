// Functie om het overlay te verwijderen na interactie
function dismissOverlay() {
  document.getElementById("overlay").style.display = "none";
  // Stuur een bericht naar de remote dat de player nu interactief is
  socket.emit("command", "player_interactive");
}

// Socket.IO verbinding opzetten
const socket = io();

// Bijhouden van de huidige status
let playerState = {
  isPlaying: false,
  isMuted: false,
  volume: 100,
};

// Bijhouden van de laatste actie om dubbele notificaties te voorkomen
let lastAction = {
  type: null,
  timestamp: 0,
};

// Functie om een actie-indicator te tonen
function showActionIndicator(action) {
  // Voorkom dubbele notificaties binnen korte tijd
  const now = Date.now();
  if (lastAction.type === action && now - lastAction.timestamp < 1000) {
    return; // Negeer herhaalde acties binnen 1 seconde
  }

  // Update de laatste actie
  lastAction.type = action;
  lastAction.timestamp = now;

  // Verwijder alle bestaande indicators
  const container = document.getElementById("actionIndicators");
  container.innerHTML = "";

  // Maak een nieuwe indicator
  const indicator = document.createElement("div");
  indicator.className = "action-indicator";

  // Bepaal de tekst en eventueel icoon op basis van de actie
  let indicatorText = "";

  switch (action) {
    case "playPause":
      indicatorText = playerState.isPlaying ? "▶️ Afspelen" : "⏸️ Pauze";
      break;
    case "skipForward":
      indicatorText = "⏩ +5 seconden";
      break;
    case "skipBackward":
      indicatorText = "⏪ -5 seconden";
      break;
    case "toggleMute":
      indicatorText = playerState.isMuted ? "🔇 Geluid uit" : "🔊 Geluid aan";
      break;
    case "volume":
      indicatorText = `🔊 Volume: ${playerState.volume}%`;
      break;
    default:
      indicatorText = action;
  }

  indicator.textContent = indicatorText;
  container.appendChild(indicator);
}

// Functie om de status van de player naar de remote te sturen
function updateRemoteState() {
  // Stuur de huidige afspeelstatus
  socket.emit("command", `player_state:${playerState.isPlaying ? "playing" : "paused"}`);

  // Stuur de huidige mute status
  socket.emit("command", `player_state:${playerState.isMuted ? "muted" : "unmuted"}`);

  // Stuur het huidige volume
  socket.emit("command", `player_state:volume:${playerState.volume}`);
}

// Luisteren naar berichten van de remote
socket.on("command", (command) => {
  console.log("Ontvangen Socket.IO bericht:", command);

  // Verwerk de verschillende commando's
  if (command === "playPause") {
    console.log("Play/Pause functie wordt aangeroepen");
    togglePlayPause();
    showActionIndicator("playPause");
  } else if (command === "skipForward") {
    console.log("+5 sec functie wordt aangeroepen");
    skipForward();
    showActionIndicator("skipForward");
  } else if (command === "skipBackward") {
    console.log("-5 sec functie wordt aangeroepen");
    skipBackward();
    showActionIndicator("skipBackward");
  } else if (command === "toggleMute") {
    console.log("Mute/Unmute functie wordt aangeroepen");
    toggleMute();
    showActionIndicator("toggleMute");
  } else if (command === "get_player_state") {
    console.log("Status wordt opgevraagd");
    updateRemoteState();
    // Geen indicator tonen voor status updates
  } else if (command.startsWith("volume:")) {
    console.log("Volume wordt aangepast");
    const volume = parseInt(command.split(":")[1]);
    setVolume(volume);
    // Toon alleen de volume indicator als er een significante verandering is
    if (Math.abs(volume - playerState.volume) > 5) {
      showActionIndicator("volume");
    }
  } else if (command.length === 11) {
    // YouTube video ID's zijn 11 tekens lang
    console.log("Nieuwe video wordt geladen:", command);
    loadVideo(command);
    showActionIndicator("Nieuwe video wordt geladen");
  } else {
    console.warn("Onbekend commando ontvangen:", command);
  }
});

// Laad de YouTube IFrame API
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Initialiseer de YouTube player
let player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: "M7lc1UVf-VE", // Standaard video
    playerVars: {
      playsinline: 1,
      autoplay: 1,
      mute: 0, // Video start niet gedempt
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// Functie om video af te spelen of te pauzeren
function togglePlayPause() {
  var state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    playerState.isPlaying = false;
  } else {
    player.playVideo();
    playerState.isPlaying = true;
  }
  updateRemoteState();
}

// Functie om 5 seconden vooruit te spoelen
function skipForward() {
  var currentTime = player.getCurrentTime();
  player.seekTo(currentTime + 5, true);
}

// Functie om 5 seconden terug te spoelen
function skipBackward() {
  var currentTime = player.getCurrentTime();
  player.seekTo(Math.max(0, currentTime - 5), true);
}

// Functie om het geluid aan/uit te zetten
function toggleMute() {
  if (player.isMuted()) {
    player.unMute();
    playerState.isMuted = false;
  } else {
    player.mute();
    playerState.isMuted = true;
  }
  updateRemoteState();
}

// Functie om het volume aan te passen
function setVolume(volume) {
  player.setVolume(volume);
  playerState.volume = volume;
  updateRemoteState();
}

// Functie om een nieuwe video te laden
function loadVideo(videoId) {
  player.loadVideoById(videoId);
  playerState.isPlaying = true;
  updateRemoteState();
}

// Functie die wordt aangeroepen wanneer de player klaar is
function onPlayerReady(event) {
  event.target.playVideo();
  playerState.isPlaying = true;
  playerState.volume = player.getVolume();
  playerState.isMuted = player.isMuted();
  updateRemoteState();
}

// Functie die wordt aangeroepen wanneer de player status verandert
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    playerState.isPlaying = true;
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    playerState.isPlaying = false;
  }

  // Update de mute status en volume
  playerState.isMuted = player.isMuted();
  playerState.volume = player.getVolume();

  // Stuur de bijgewerkte status naar de remote
  updateRemoteState();
}

// Controleer periodiek of de mute status of volume is veranderd
// (omdat YouTube API niet altijd events triggert voor deze wijzigingen)
setInterval(() => {
  if (player && player.getPlayerState) {
    const currentMuted = player.isMuted();
    const currentVolume = player.getVolume();

    if (currentMuted !== playerState.isMuted || currentVolume !== playerState.volume) {
      playerState.isMuted = currentMuted;
      playerState.volume = currentVolume;
      updateRemoteState();
      // Geen indicator tonen voor automatische updates
    }
  }
}, 1000);
