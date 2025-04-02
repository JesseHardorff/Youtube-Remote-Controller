
// Functie om het overlay te verwijderen na interactie
function dismissOverlay() {
  document.getElementById("overlay").style.display = "none";
  // Stuur een bericht naar de remote dat de player nu interactief is
  socket.send("player_interactive");
}

// WebSocket verbinding opzetten
const socket = new WebSocket("ws://localhost:8080");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const messages = document.getElementById("messages");

// Luisteren naar berichten van de remote
socket.addEventListener("message", async (event) => {
  // Converteer Blob naar tekst
  const data = await event.data.text(); 
  console.log("Ontvangen WebSocket bericht:", data);

  // Verwijder eventuele prefix
  let command = data.replace("Server: ", ""); 

  // Verwerk de verschillende commando's
  if (command === "playPause") {
    console.log("Play/Pause functie wordt aangeroepen");
    togglePlayPause();
  } else if (command === "skipForward") {
    console.log("+5 sec functie wordt aangeroepen");
    skipForward();
  } else if (command === "skipBackward") {
    console.log("-5 sec functie wordt aangeroepen");
    skipBackward();
  } else if (command === "toggleMute") {
    console.log("Mute/Unmute functie wordt aangeroepen");
    toggleMute();
  } else if (command.length === 11) {
    // YouTube video ID's zijn 11 tekens lang
    console.log("Nieuwe video wordt geladen:", command);
    loadVideo(command);
  } else {
    console.warn("Onbekend commando ontvangen:", command);
  }
});

// Verstuur berichten via de WebSocket
button.addEventListener("click", () => {
  const message = input.value;
  socket.send(message);
  input.value = "";
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
  });
}

// Functie om video af te spelen of te pauzeren
function togglePlayPause() {
  var state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
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
  } else {
    player.mute();
  }
}

// Functie om volledig scherm in/uit te schakelen


// Functie om een nieuwe video te laden
function loadVideo(videoId) {
  player.loadVideoById(videoId);
}

// Functie die wordt aangeroepen wanneer de player klaar is
function onPlayerReady(event) {
  event.target.playVideo();
}
