if(process.env.NODE_ENV != "production") {
  require("dotenv").config();git 
}
console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const { render } = require("ejs");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingschema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const { error } = require("console");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStatergy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedin } = require("./middleware.js");
const { isOwner ,isReviewAuthor } = require("./middleware.js");
const multer = require('multer');
const upload = multer({dest : 'uploads/'})

const MONGO_URL = "dburl";
const user = require("./routes/user.js");

main()
  .then(() => {
    console.log("connceted to dbs");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expire: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

//home route

app.get("/", (req, res) => {
  res.send("hii, i harsh your server is perfectly running");
});

// passport and session regarding stuff

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStatergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});
// // demo user
// app.get("/demouser", async(req,res) => {
//   let fakeUser = new User({
//     email:"students@gmail.com",
//     username:"anonnymous",
//   });
//   let registerdUser = await User.register(fakeUser,"helloworld");
//   res.send(registerdUser);
// });

app.use("/", user);

// for validate the listings

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (eror) {
    let errMsg = error.detais.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (eror) {
    let errMsg = error.detais.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Index Route
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("index", { allListings });
  })
);
// app.post(
//   "/listings",
//   ( upload.single("listing[image]"), (req, res) => {
//     res.render(req.file);
//   }));

// new route
app.get("/listings/new", isLoggedin, (req, res) => {
  console.log(req.user);
  res.render("new.ejs");
});

// Show Route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path :"reviews",
        populate:{
         path: "author",
        },
        })
      .populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested does not exist");
      res.redirect("/listing");
    }
    console.log(listing);
    res.render("show", { listing });
  })
);

// Create Route
app.post(
  "/listings",
  isLoggedin,
  wrapAsync(async (req, res, next) => {
    // let result = listingSchema.validate(req.body);
    // console.log(result);
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New listing created");
    res.redirect("/listings");
  })
);

// Edit Route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested does not exist");
      res.redirect("/listing");
    }
    res.render("edit.ejs", { listing });
  })
);

//  Update route
app.put(
  "/listings/:id",
  isLoggedin,
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  })
);

// Delete Route
app.delete(
  "/listings/:id",
  isLoggedin,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing is deleted");
    res.redirect("/listings");
  })
);

// Form post route review
app.post(
  "/listings/:id/reviews",
  isLoggedin,
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    listing.reviews.push(newReview);
    console.log(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success", "review is created");

    res.redirect(`/listings/${listing._id}`);
  })
);

// form delete review route

app.delete(
  "/listings/:id/reviews/:reviewId", isReviewAuthor,
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Review.findById(reviewId);

    await Listing.findByIdAndDelete(id, { pull: { reviews: reviewId } });
    await Review.findByIdA(reviewId);
    res.redirect(`/listings/${id}`);
  })
);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
});

app.listen(8080, () => {
  console.log("server is listen at port 8080");
});
