var mongoose = require("mongoose");

//POST - text,image
var postSchema = new mongoose.Schema({
    text: String,
    postimage: String,
    created: {type: Date, default: Date.now},
});
module.exports = mongoose.model("Post", postSchema);
