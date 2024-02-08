const useSchema = require("../model/user");

module.exports.signUpForm = (req, res) => {
  res.render("user/signUp.ejs");
};

module.exports.signUpUser = async (req, res) => {
  try {
    let { email, username, password } = req.body;
    const newUser = new useSchema({ email, username });
    const registerUser = await useSchema.register(newUser, password);
    console.log(newUser);
    req.login(registerUser, (err) => {
      if (err) {
        return next();
      }
      req.flash("success", "Welcome to wanderLust!");
      res.redirect("/listing");
    });
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/signUp");
  }
};

module.exports.loginForm = (req, res) => {
  res.render("user/login.ejs");
};

module.exports.loginUser = async (req, res) => {
  req.flash("success", "Welcome back to wanderLust!");
  let redirectUrl = res.locals.redirectUrl || "/listing";
  res.redirect(redirectUrl);
};

module.exports.logoutUser = (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next();
    }
    req.flash("success", "Successfully logged out!");
    res.redirect("/listing");
  });
};
