const video = document.querySelector("video");
const playButton = document.getElementById("play");
const muteButton = document.getElementById("mute");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const volumeRange = document.getElementById("volume");
const timeline = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let controlsTimeout = null;
let controlsMovementTimeout = null;
let volumeValue = 0.5;

video.volume = volumeValue;

const handlePlayClick = (event) => {
  // 비디오가 플레이 중이라면 정지
  if (video.paused) {
    video.play();
  } else {
    // 아니라면 플레이
    video.pause();
  }
  playButton.innerText = video.paused ? "Play" : "Pause";
};

const handleMute = (event) => {
  if (video.muted) {
    video.muted = false;
    muteButton.innerText = "mute";
  } else {
    video.muted = true;
    muteButton.innerText = "unmute";
  }
  muteButton.innerText = video.muted ? "Unmute" : "Mute";
  volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
  const {
    target: { value },
  } = event;
  if (video.muted) {
    video.muted = false;
    muteButton.innerText = "Mute";
  }

  if (Number(value) === 0) {
    muteButton.innerText = "Unmute";
    video.muted = true;
  } else {
    muteButton.innerText = "Mute";
    video.muted = false;
  }

  volumeValue = value;
  video.volume = value;
};

const formatTime = (seconds) => {
  return new Date(seconds * 1000).toISOString().substring(14, 19);
};

const handleLoadedMetadata = () => {
  totalTime.innerHTML = formatTime(Math.floor(video.duration));
  timeline.max = Math.floor(video.duration);
};

const handleTimeUpdate = () => {
  currentTime.innerHTML = formatTime(Math.floor(video.currentTime));
  timeline.value = Math.floor(video.currentTime);
};

const handleTimelineChange = (event) => {
  const {
    target: { value },
  } = event;
  video.currentTime = value;
};

const handleFullScreen = () => {
  const fullscreen = document.fullscreenElement;
  if (!fullscreen) {
    fullScreenBtn.innerText = "Exit Full Screen";
    videoContainer.requestFullscreen();
  } else {
    fullScreenBtn.innerText = "Enter Full Screen";
    document.exitFullscreen();
  }
};

const hideControls = () => {
  return videoControls.classList.remove("showing");
};

const handleMouseMove = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }

  if (controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }

  videoControls.classList.add("showing");
  controlsMovementTimeout = setTimeout(hideControls, 3000);
};

const handleMouseLeave = () => {
  controlsTimeout = setTimeout(hideControls, 3000);
};

const handleClickVideo = () => {
  if (video.paused) {
    video.play();
    playButton.innerText = "Pause";
  } else {
    video.pause();
    playButton.innerText = "Play";
  }
};

const handlePressKey = (event) => {
  const { keyCode } = event;
  if (keyCode === 32) {
    if (video.paused) {
      video.play();
      playButton.innerText = "Pause";
    } else {
      video.pause();
      playButton.innerText = "Play";
    }
  }
};

const handleEnded = () => {
  const { id } = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, { method: "POST" });
};

playButton.addEventListener("click", handlePlayClick);
muteButton.addEventListener("click", handleMute);
volumeRange.addEventListener("input", handleVolumeChange);
timeline.addEventListener("input", handleTimelineChange);
video.addEventListener("loadedmetadata", handleLoadedMetadata);
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("click", handleClickVideo);
video.addEventListener("ended", handleEnded);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
fullScreenBtn.addEventListener("click", handleFullScreen);
document.addEventListener("keydown", handlePressKey);
