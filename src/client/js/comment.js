const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const videoComments = document.querySelector(".video__comments ul");

const addComment = (text, id) => {
  const newComment = document.createElement("li");
  newComment.className = "video__comment";
  newComment.dataset.id = id;
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = " " + text;
  const deleteSpan = document.createElement("span");
  deleteSpan.innerText = "❌";
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(deleteSpan);
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (response.status === 201) {
    console.log(response);
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

const handleDeleteComment = async (event) => {
  const target = event.target.parentElement;
  const commentId = target.dataset.id;
  await fetch(`/api/comment/${commentId}/delete`, {
    method: "DELETE",
  });
  target.remove();
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}

if (videoComments.querySelector("li")) {
  const deleteBtn = videoComments.querySelectorAll("#deleteBtn");
  deleteBtn.forEach((comment) => {
    comment.addEventListener("click", handleDeleteComment);
  });
}
