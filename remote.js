const socket = new WebSocket("ws://localhost:8080");
const messages = document.getElementById("messages");
const videoList = document.getElementById("videoList");

socket.addEventListener("message", (event) => {
  const li = document.createElement("li");
  li.textContent = event.data;
  messages.appendChild(li);
});

function sendCommand(command) {
  socket.send(command);
}

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

function displaySearchResults(videos) {
  videoList.innerHTML = "";
  videos.forEach((video) => {
    const videoElement = document.createElement("div");
    videoElement.innerHTML = `
      <h3>${video.snippet.title}</h3>
      <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.title}" />
      <button onclick="selectVideo('${video.id.videoId}')">Select Video</button>
     `;
    videoList.appendChild(videoElement);
  });
}

function selectVideo(videoId) {
  socket.send(videoId);
}
