import multer from "multer";

export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.loggedInUser = req.session.user || {};
  res.locals.siteName = "Wetube";
  // console.log(req.session);

  next();
};

export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "권한이 없습니다.");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "권한이 없습니다.");
    return res.redirect("/");
  }
};

// 사용자가 보낸 파일을 uploads에 저장하는 multer
export const avatarUpload = multer({
  dest: "uploads/avatar/",
  limits: {
    fileSize: 3000000,
  },
});

export const videoUpload = multer({
  dest: "uploads/vidoes/",
  limits: {
    fileSize: 10000000,
  },
});
