const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware");

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post(
  "/signup",
  wrapAsync(async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new User({ email, username });
      const registerdUser = await User.register(newUser, password);
      console.log(registerdUser);
      req.login(registerdUser, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", "wellcome to wanderlust");
        res.redirect("/listings");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect(res.locals.redirectUrl);
    }
  })
);

router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login", saveRedirectUrl,
  passport.authenticate("local", {
    failureredirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "wellcome to wonderlust");
    // let redirectUrl = res.locals.redirectUrl || "/listings",
    // res.redirect(redirectUrl);
    res.redirect("/listings");
  }
);
module.exports = router;

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are loggedout now!");
    res.redirect("/listings");
  });
});
