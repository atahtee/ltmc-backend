const mongoose = require("mongoose")


const letterSchema = new mongoose.Schema({
    sender: {type: String, required: true},
    recipient: {type: String, required: true},
    message: {type: String, required: true},
    deliveryDate: {type: Date, required: true},
    createdAt: {type: Date, default: Date.now},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
})


const Letter = mongoose.model("Letter", letterSchema);
module.exports = Letter;