var mongoose = require("mongoose");

var detailSchema = new mongoose.Schema({
    nickname: String,
    dob: Date,
    kiitmail: String,
    address: String,
    roomno: String,
    section: String,
    phoneno: Number,
    whatsapp: Number,
    facebook: String,
    snapchat: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    github: String,
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        email: String,
        image: String,
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
    ]
});
module.exports = mongoose.model("Details",detailSchema);