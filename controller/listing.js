const Listing = require("../models/listing");
const expressError = require("../util/expressError.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const geocode = require("../public/js/coordinates.js");
const nodemailer = require('nodemailer');

module.exports.index = async(req,res)=>{        
    const allListing = await Listing.find();
    res.render("listing/index.ejs", {allListing});
};

module.exports.renderNewForm = (req,res,next)=>{
    res.render("listing/new.ejs");
};

module.exports.createRoute = async(req,res,next)=>{
    let url = req.file.path;
    let filename = req.file.filename;
    console.log(url, ".." , filename); 

    let result = listingSchema.validate(req.body);
    if(result.error){
        throw new expressError(400,result.error);
    }
    const newlisting = new Listing(req.body.listing);
    newlisting.owner = req.user._id;
    newlisting.image = {url, filename}; 

    let location = newlisting.location;
    const geometry = await geocode(location);
    newlisting.geometry = geometry;

    let savedlisting = await newlisting.save();
    console.log(savedlisting);
    if(Lead == ""){
        next;
    }
    else{
        res.render("/sendMail",{Lead});
    }  
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};

module.exports.filterListing = async (req, res) => {
    try {
        const { category } = req.query;

        let allListing;

        if (!category) {
            allListing = await Listing.find({});
        } else {
            allListing = await Listing.find({ category });
        }

        res.render("listing/index.ejs", { allListing });

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("/listings");
    }
};

module.exports.searchListing = async (req, res) => {

    const { q } = req.query;
    

    const allListing = await Listing.find({
        $or: [
            { title: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } }
        ]
    });

    if(allListing == ""){
        let qq = {q};
        const Lead = {
            username: req.user.username,
            email: req.user.email,
            category: qq.category
        }
    }

    res.render("listing/index", { allListing });

};

module.exports.sendMail = async (req,res) =>{
    let {Lead} = req.query;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
    auth: {
        user: Lead.email,        
        pass: 'your-16-character-app-password' 
            }
    });
    const mailOptions = {
        from: 'Air-Bnb', 
        to: Lead.email,               
        subject: 'Your Search matching',           
        text: 'Please visit our site your search category is now avaliable',       
        html: '<b>Hello!</b><p>Thank you for signing up!</p>' 
        };
    async function sendMail() {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully! Message ID: %s', info.messageId);
        } catch (error) {
            console.error('Error occurred while sending email:', error);
        }
    }

    sendMail();
    Lead = "";
    res.redirect("/listings");
}

module.exports.showRoute = async(req,res)=>{
    const {id} = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist");
        res.redirect("/listings");
    }
    res.render("listing/show.ejs",{listing})
};

module.exports.editRoute = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);

    let originalImage = listing.image.url;
    originalImage = originalImage.replace("/upload","/upload/h_300,w_250");
    res.render("listing/edit.ejs",{listing,originalImage});
};

module.exports.updateRoute = async (req,res)=>{
    let {id} = req.params;
    console.log(req.body);
    console.log(req.body.listing.category);
    let listing = await Listing.findByIdAndUpdate(id,{ ...req.body.listing});
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename}; 
        await listing.save();
    }
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    let deletedlist =  await Listing.findByIdAndDelete(id);
     req.flash("success", " Listing deleted");
    console.log(deletedlist);
    res.redirect("/listings");
};
