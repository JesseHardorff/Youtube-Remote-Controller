// Verbinding met socket io
// Dit zorgt ervoor dat de afstandsbediening kan communiceren met de player
const socket = io();

// Dit object houdt bij wat de huidige status is van de speler

let spelerStatus = {
  isAanHetAfspelen: false,
  isGedempt: false,
  volume: 100,
};

// Deze functie stuurt commando's naar de player
// Bijvoorbeeld play, pause etc
function stuurCommando(commando) {
  socket.emit("command", commando);
}

// Deze functie past het volume aan en stuurt het naar de player
function zetVolume(waarde) {
  spelerStatus.volume = waarde;
  socket.emit("command", `volume:${waarde}`);
}

// Deze functie zoekt video's via de YouTube API
function zoekVideos() {
  const zoekterm = document.getElementById("zoekTekst").value;
  const apiSleutel = "AIzaSyAwATAwlS0xBWhgQYXipgovfArCXkZYri4";
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${zoekterm}&maxResults=6&type=video&key=${apiSleutel}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      toonZoekResultaten(data.items);
    })
    .catch((error) => console.error("Fout bij ophalen data:", error));
}

// Deze functie selecteert een video en stuurt de ID naar de player
function selecteerVideo(videoId) {
  socket.emit("command", videoId);
}

// Hier luister het naar berichten van de player
// Zo blijft de remote gesynct met wat er speelt
socket.on("command", (commando) => {
  // Update de knoppen op basis van de status van de player
  if (commando === "player_state:playing") {
    spelerStatus.isAanHetAfspelen = true;
    document.getElementById("afspeelPauzeKnop").textContent = "Pauzeren";
  } else if (commando === "player_state:paused") {
    spelerStatus.isAanHetAfspelen = false;
    document.getElementById("afspeelPauzeKnop").textContent = "Afspelen";
  } else if (commando === "player_state:muted") {
    spelerStatus.isGedempt = true;
    document.getElementById("geluidKnop").textContent = "Geluid Aan";
  } else if (commando === "player_state:unmuted") {
    spelerStatus.isGedempt = false;
    document.getElementById("geluidKnop").textContent = "Geluid Uit";
  } else if (commando.startsWith("player_state:volume:")) {
    const volume = commando.split(":")[2];
    spelerStatus.volume = volume;
    document.getElementById("volumeSlider").value = volume;
  }
});

// Als de pagina geladen is, vraag ik de huidige status op van de player
// Zo zijn de knoppen meteen in de goeie state
window.addEventListener("load", () => {
  // Vraag de huidige status op van de speler
  socket.emit("command", "get_player_state");
});
