// 🎵 Danh sách nhạc
const musicList = [
  { title: "Lạc Trôi - Sơn Tùng MTP", src: "music/lactroi.mp3" },
  { title: "Nơi Này Có Anh - Sơn Tùng MTP", src: "music/noinaicoanh.mp3" },
];

// 🎬 Danh sách phim
const movieList = [
  { title: "Spirited Away", src: "videos/spiritedaway.mp4" },
  { title: "Avengers: Endgame", src: "videos/avengers.mp4" },
];

// --- XỬ LÝ TAB ---
const musicTab = document.getElementById("musicTab");
const movieTab = document.getElementById("movieTab");
const musicSection = document.getElementById("musicSection");
const movieSection = document.getElementById("movieSection");

musicTab.addEventListener("click", () => switchTab("music"));
movieTab.addEventListener("click", () => switchTab("movie"));

function switchTab(tab) {
  if (tab === "music") {
    musicSection.classList.add("active");
    movieSection.classList.remove("active");
    musicTab.classList.add("active");
    movieTab.classList.remove("active");
  } else {
    movieSection.classList.add("active");
    musicSection.classList.remove("active");
    movieTab.classList.add("active");
    musicTab.classList.remove("active");
  }
}

// --- HIỂN THỊ DANH SÁCH NHẠC ---
const musicListEl = document.getElementById("musicList");
const audioPlayer = document.getElementById("audioPlayer");

musicList.forEach((song) => {
  const li = document.createElement("li");
  li.textContent = song.title;
  li.addEventListener("click", () => {
    audioPlayer.src = song.src;
    audioPlayer.play();
  });
  musicListEl.appendChild(li);
});

// --- HIỂN THỊ DANH SÁCH PHIM ---
const movieListEl = document.getElementById("movieList");
const videoPlayer = document.getElementById("videoPlayer");

movieList.forEach((movie) => {
  const li = document.createElement("li");
  li.textContent = movie.title;
  li.addEventListener("click", () => {
    videoPlayer.src = movie.src;
    videoPlayer.play();
  });
  movieListEl.appendChild(li);
});
