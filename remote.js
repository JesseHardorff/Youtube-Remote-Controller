// Socket.IO verbinding opzetten
const socket = io();

// Functie om commando's naar de server te sturen
function sendCommand(command) {
  console.log(`Sending command: ${command}`);
  socket.emit('command', command);
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
  socket.emit('command', videoId);
}

// Luisteren naar berichten van de player
socket.on('command', (command) => {
  console.log('Received command from player:', command);
  // Hier kun je eventueel reageren op berichten van de player
  
  // Als je nog steeds berichten wilt toevoegen aan een lijst (zoals in je originele code)
  if (document.getElementById("messages")) {
    const li = document.createElement("li");
    li.textContent = command;
    document.getElementById("messages").appendChild(li);
  }
});

// Opmerking: De displaySearchResults functie wordt overschreven door de script tag in je HTML
