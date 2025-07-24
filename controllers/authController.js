const bcrypt = require('bcrypt');
const jwt = require('jwt')
const User = require('../models/user');
const {OAuth2Client} = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signup = async (req, res) => {
    try {
        const {name, email, password, confirmPassword} = req.body;

        if (!name || !email || !password || password !== confirmPassword){
            return res.status(400).json({error: "Invalid input"});
        }
        const existingUser = await User.findOne({email});
        if (existingUser) return res.status(400).json({error: "User already exists"})

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await new User({name, email, password: hashedPassword}).save();

        const token = jwt.sign({userId: newUser._id}, process.env.JWT_SECRET, {expiresIn: "7d"});

        res.status(201).json({
            message: "User registered successfully",
            user: {id: newUser._id, name: newUser.name, email: newUser.email},
            token
        })
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({error: "Internal server error"});
    }
}