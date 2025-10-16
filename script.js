// Danh sách nhạc và video (file nằm cùng thư mục với HTML)
const musicListData = [
  { title: "trình", file: "trinh.mp3", cover: "trinh.jpg" },
  { title: "Nơi này có anh - Sơn Tùng MTP", file: "noinaicoanh.mp3", cover: "music2.jpg" }
];

const videoListData = [
  { title: "MV Em Của Ngày Hôm Qua", file: "emcuangayhomqua.mp4", thumb: "video.jpg" },
  { title: "Spirited Away Trailer", file: "spiritedaway.mp4", thumb: "video2.jpg" }
];

// --- CHUYỂN TAB ---
const musicTab = document.getElementById("musicTab");
const videoTab = document.getElementById("videoTab");
const musicSection = document.getElementById("musicSection");
const videoSection = document.getElementById("videoSection");

musicTab.onclick = () => {
  musicTab.classList.add("active");
  videoTab.classList.remove("active");
  musicSection.classList.add("active");
  videoSection.classList.remove("active");
};

videoTab.onclick = () => {
  videoTab.classList.add("active");
  musicTab.classList.remove("active");
  videoSection.classList.add("active");
  musicSection.classList.remove("active");
};

// --- NHẠC ---
const musicList = document.getElementById("musicList");
const audioPlayer = document.getElementById("audioPlayer");

musicListData.forEach(song => {
  const item = document.createElement("div");
  item.className = "music-item";
  item.innerHTML = `
    <img src="${song.cover}" alt="cover">
    <div>
      <strong>${song.title}</strong>
      <p>${song.file}</p>
    </div>
  `;
  item.onclick = () => {
    audioPlayer.src = song.file;
    audioPlayer.play();
  };
  musicList.appendChild(item);
});

// --- VIDEO ---
const videoList = document.getElementById("videoList");
const videoPlayer = document.getElementById("videoPlayer");

videoListData.forEach(vid => {
  const item = document.createElement("div");
  item.className = "video-item";
  item.innerHTML = `
    <img src="${vid.thumb}" alt="thumb">
    <div>
      <strong>${vid.title}</strong>
      <p>${vid.file}</p>
    </div>
  `;
  item.onclick = () => {
    videoPlayer.src = vid.file;
    videoPlayer.play();
  };
  videoList.appendChild(item);
});
