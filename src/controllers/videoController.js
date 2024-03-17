import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner").populate("comments");
  if (video === null) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  return res.render("watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.session.user;
  const video = await Video.findById(id);

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }

  return res.render("edit", { pageTitle: `Editing: ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.session.user;
  const { title, description, hashtags } = req.body;
  const video = await Video.exists({ _id: id });

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(_id)) {
    req.flash("error", "비디오의 업로더가 아닙니다.");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndUpdate(id, {
    title: title,
    description: description,
    hashtags: Video.formatHashtags(hashtags),
  });

  req.flash("success", "비디오 업데이트 완료");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;

  const { video, thumbnail } = req.files;
  const { title, description, hashtags } = req.body;

  try {
    const newVideo = await Video.create({
      title: title,
      description: description,
      createdAt: Date.now(),
      hashtags: Video.formatHashtags(hashtags),
      fileUrl: video[0].path,
      thumbnailUrl: thumbnail[0].path.replace(/[\\]/g, "/"),
      owner: _id,
    });
    const user = await User.findById(_id);

    user.videos.push(newVideo._id);
    await user.save();

    return res.redirect("/");
  } catch (error) {
    return res.render("upload", {
      pageTitle: "Upload",
      errorMessage: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.session.user;

  const video = await Video.findById(id);

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(_id)) {
    req.flash("error", "권한이 없습니다.");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndDelete(id);

  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        // $regex: new RegExp(`^${keyword}`, "i"),  // 시작하는 단어
        // $regex: new RegExp(`${keyword}$`, "i"),  // 끝나는 단어
        $regex: new RegExp(keyword, "i"), // 모든 단어
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views += 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const {
    session: { user },
  } = req;
  const video = await Video.findById(id);

  if (!video) {
    return res.sendStatus(404);
  }

  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id,
  });

  video.comments.push(comment._id);
  video.save();
  return res.status(201).json({ newCommentId: comment._id });
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id)
    .populate("owner")
    .populate("video");

  if (!req.session.user) {
    req.flash("error", "댓글의 작성자가 아닙니다.");
    return res.sendStatus(403);
  }

  if (String(comment.owner._id) !== String(req.session.user._id)) {
    req.flash("error", "댓글의 작성자가 아닙니다.");
    return res.sendStatus(403);
  }

  const video = await Video.findById(comment.video._id);
  if (!video) {
    return res.sendStatus(404);
  }

  // console.log(video);

  video.comments = video.comments.filter((comment) => {
    return comment.toString() !== id;
  });
  await video.save();

  await Comment.findByIdAndDelete(id);
  return res.sendStatus(201);
};
