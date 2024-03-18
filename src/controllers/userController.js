import User from "../models/User";
import Video from "../models/Video";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
  return res.render("join", { pageTitle: "회원가입" });
};
export const postJoin = async (req, res) => {
  const { username, email, name, password, confirmPassword } = req.body;
  const pageTitle = "회원가입";

  if (password !== confirmPassword) {
    return res.render("join", {
      pageTitle,
      errorMessage: "패스워드가 맞지 않습니다.",
    });
  }

  //   const exists = await User.exists({ $or: [{ username: username }, { email: email }] });
  //   if (exists) {
  //     return res.render("join", { pageTitle , errorMessage: "This email / username is already taken" });
  //   }

  const usernameExists = await User.exists({ username: username });
  if (usernameExists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "계정이 이미 존재합니다.",
    });
  }

  const emailExists = await User.exists({ email: email });
  if (emailExists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "이메일이 이미 존재합니다.",
    });
  }

  try {
    await User.create({
      username,
      email,
      name,
      password,
      location,
    });

    return res.redirect("/login");
  } catch (error) {
    return res
      .status(400)
      .render("join", { pageTitle, errorMessage: error._message });
  }
};
export const getLogin = (req, res) => {
  return res.render("login", { pageTitle: "로그인" });
};

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "로그인";

  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "계정이 존재하지 않습니다.",
    });
  }

  const isInformationCorrect = await bcrypt.compare(password, user.password);
  if (!isInformationCorrect) {
    return res.render("login", {
      pageTitle,
      errorMessage: "패스워드가 틀렸습니다.",
    });
  }

  req.session.loggedIn = true;
  req.session.user = user;

  return res.redirect("/");
};

export const getEdit = (req, res) => {
  return res.render("edit-profile", {
    pageTitle: "프로필 변경",
    user: res.locals.loggedInUser,
  });
};
export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl }, // req.session.loggedIn의 id는 다를 수 있음
    },
    body: { username, name, email, location },
    file,
  } = req;
  console.log(file);
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      name,
      email,
      username,
      location,
      avatarUrl: file ? file.location : avatarUrl,
    },
    { new: true }
  );

  req.session.user = updatedUser;

  return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "소셜 로그인 유저는 패스워드를 변경할 수 없습니다.");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "패스워드 변경" });
};

export const postChangePassword = async (req, res) => {
  // send notification
  const {
    session: {
      user: { _id, password },
    },
    body: { oldPassword, newPassword, newPasswordConfirm },
  } = req;

  const isInformationCorrect = await bcrypt.compare(oldPassword, password);
  if (!isInformationCorrect) {
    return res.status(400).render("users/change-password", {
      pageTitle: "패스워드 변경",
      errorMessage: "현재 패스워드가 일치하지 않습니다.",
    });
  }

  if (newPassword !== newPasswordConfirm) {
    return res.status(400).render("users/change-password", {
      pageTitle: "패스워드 변경",
      errorMessage: "새로운 패스워드가 일치하지 않습니다.",
    });
  }

  const user = await User.findById(_id);

  user.password = newPassword;
  await user.save();

  req.session.user.password = user.password;
  // req.session.destroy();
  // return res.redirect("/login");
  req.flash("info", "패스워드가 변경되었습니다.");
  return res.redirect("/");
};

export const logout = (req, res) => {
  req.session.user = null;
  req.session.loggedIn = false;
  req.flash("info", "정상적으로 로그아웃 되었습니다.");
  return res.redirect("/");
};

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  if (!user) {
    return res.status(404).render("404", {
      pageTitle: "404",
      errorMessage: "유저 정보가 존재하지 않습니다.",
    });
  }
  return res.render("users/profile", { pageTitle: `${user.name}`, user });
};

export const startGithubLogin = (req, res) => {
  // 사용자의 github ID 요청
  const baseUrl = `https://github.com/login/oauth/authorize`;
  const config = {
    client_id: process.env.GITHUB_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = `https://github.com/login/oauth/access_token`;
  const config = {
    client_id: process.env.GITHUB_CLIENT,
    client_secret: process.env.GITHUB_SECRET,
    code: req.query.code,
  };

  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  // tokenRequest = scope를 통해 지정한 access_token이 담긴 객체 요청
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();

  if ("access_token" in tokenRequest) {
    // access api
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    // userData = github 프로필 정보
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    // console.log(userData);
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      // create an account / 해당 email로 user가 없으므로 계정 생성 > github에서 가져온 user 정보에 모든게 담겨있음
      user = await User.create({
        name: userData.name,
        avatarUrl: userData.avatar_url,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};
