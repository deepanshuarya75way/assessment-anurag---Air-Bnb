const express = require("express");
const router = express.Router();
const wrapAsync = require("../util/wrapAsync.js");
const expressError = require("../util/expressError.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const Listing = require("../models/listing.js");
const methodOverride = require("method-override");
const {isLoggedIn , isOwner , validateListing} = require("../middleware.js");
const { findById } = require("../models/review.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage});
const { sendMail } = require('../controller/listing.js'); 



const ListingController = require("../controller/listing.js");

router.use(methodOverride("_method"));

//Index and crateRoute
router
  .route("/")
  .get(wrapAsync(ListingController.index))
  .post(
    isLoggedIn,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(ListingController.createRoute),
  );

//new route
router.get("/new",isLoggedIn,ListingController.renderNewForm);

//filter route & search 
 router.get("/filter", ListingController.filterListing);
router.get("/search", wrapAsync(ListingController.searchListing));
router.get("/search", isLoggedIn, wrapAsync(ListingController.searchListing));

//Show, Update and Delete Route  
router.route("/:id")
    .get(wrapAsync(ListingController.showRoute))
    .put(isLoggedIn,isOwner,upload.single("listing[image]"),validateListing,wrapAsync(ListingController.updateRoute))
    .delete(isLoggedIn,isOwner,wrapAsync(ListingController.destroyListing));

//edit route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(ListingController.editRoute));

module.exports = router;