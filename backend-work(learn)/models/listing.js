const mongoose = require("mongoose");
const review = require("./review");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  Image: {
    type: String,
    default:
      "https://unsplash.com/photos/a-man-standing-in-a-narrow-canyon-between-two-mountains-kzEFwhXPXwo",
    set: (v) =>
      v === ""
        ? "https://unsplash.com/photos/a-man-standing-in-a-narrow-canyon-between-two-mountains-kzEFwhXPXwo"
        : v,
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

listingSchema.post("findOneAndDelete", async (Listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
