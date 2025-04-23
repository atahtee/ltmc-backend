const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password:{
        type: String,
        required: true
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    profilePicture: {
        type: String
    },
    authMethod: {
        type: String,
        enum: ['local', 'google', 'apple'],
        default: 'local'
    },
    termsAccepted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    children: [{
        name: String,
        birthDate: Date
    }]
}, {timestamps: true})

module.exports = mongoose.model("User", UserSchema);