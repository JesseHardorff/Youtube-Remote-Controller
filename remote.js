// Socket.IO verbinding opzetten
const socket = io();

// Bijhouden van de huidige status
let playerState = {
  isPlaying: false,
  isMuted: false,
  volume: 100,
};

// Functie om commando's naar de server te sturen
function sendCommand(command) {
  console.log(`Sending command: ${command}`);
  socket.emit("command", command);
}

// Functie om het volume aan te passen
function setVolume(value) {
  playerState.volume = value;
  console.log(`Setting volume to: ${value}`);
  socket.emit("command", `volume:${value}`);
}

// Functie om video's te zoeken via de YouTube API
function searchVideos() {
  const query = document.getElementById("searchQuery").value;
  const apiKey = "AIzaSyAwATAwlS0xBWhgQYXipgovfArCXkZYri4";
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=6&type=video&key=${apiKey}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displaySearchResults(data.items);
    })
    .catch((error) => console.error("Error fetching data:", error));
}

// Functie om een video te selecteren en naar de player te sturen
function selectVideo(videoId) {
  socket.emit("command", videoId);
}

// Luisteren naar berichten van de player
socket.on("command", (command) => {
  console.log("Received command from player:", command);

  // Update de UI op basis van de status van de player
  if (command === "player_state:playing") {
    playerState.isPlaying = true;
    document.getElementById("playPauseBtn").textContent = "Pauzeren";
  } else if (command === "player_state:paused") {
    playerState.isPlaying = false;
    document.getElementById("playPauseBtn").textContent = "Afspelen";
  } else if (command === "player_state:muted") {
    playerState.isMuted = true;
    document.getElementById("muteBtn").textContent = "Geluid Aan";
  } else if (command === "player_state:unmuted") {
    playerState.isMuted = false;
    document.getElementById("muteBtn").textContent = "Geluid Uit";
  } else if (command.startsWith("player_state:volume:")) {
    const volume = command.split(":")[2];
    playerState.volume = volume;
    document.getElementById("volumeSlider").value = volume;
  }

  // Als je nog steeds berichten wilt toevoegen aan een lijst (zoals in je originele code)
  if (document.getElementById("messages")) {
    const li = document.createElement("li");
    li.textContent = command;
    document.getElementById("messages").appendChild(li);
  }
});

// Initialiseer de UI bij het laden van de pagina
window.addEventListener("load", () => {
  // Vraag de huidige status op van de player
  socket.emit("command", "get_player_state");
});
