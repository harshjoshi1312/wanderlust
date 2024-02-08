const express = require("express");
const route = express();
const passport = require("passport");
const { saveredirectUrl } = require("../middleware.js");
const userController = require("../controller/user.js");

route
  .route("/signUp")
  .get(userController.signUpForm)
  .post(userController.signUpUser);

route
  .route("/login")
  .get(userController.loginForm)
  .post(
    saveredirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.loginUser
  );

route.get("/logout", userController.logoutUser);
module.exports = route;
