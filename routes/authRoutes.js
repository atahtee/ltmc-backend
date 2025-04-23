const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
require("dotenv").config();

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be atleast 8 characters long" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({error: "Passwords do not match"});
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      termsAccepted: true,
    });
    await newUser.save();
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Signup error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid){
      return res.status(401).json({error: "Invalid credentials"});
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        children: user.children,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/google-signin", (req, res) => {
  res.send("Google sign-in GET route is accessible");
});

router.post("/google-signin", async (req, res) => {
  try {
    const {idToken} = req.body;

    if (!idToken){
      return res.status(400).json({error: "ID token is required"});
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email || !payload.email_verified){
      return res.status(401).json({error: "Email verification failed"})
    }

    let user = await User.findOne({ email});

    if (!user){
      user = new User({
        name: payload.name,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-12), 10),
        googleId: payload.sub,
        profilePicture: payload.picture
      });
      await user.save();
    } else if (!user.googleId){
      user.googleId = payload.sub;
      if (payload.picture) {
        user.profilePicture = payload.picture;
      }
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {userId: user._id, email: user.email},
      process.env.JWT_SECRET,
      {expiresIn: "7d"}
    );

    res.status(200).json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        children: user.children
      },
      token
    })
  } catch (error) {
    console.error("Google Sign-In error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

router.get("/google-signin", (req, res) => {
  res.send("Google is working")
})

router.get("/google-signin-test", (req, res) => {
  res.send("Google sign-in test route is accessible");
});

router.get("/test-google", (req, res) => {
  console.log("✅ Test route hit");
  res.send("Google test route is working");
});



module.exports = router;
