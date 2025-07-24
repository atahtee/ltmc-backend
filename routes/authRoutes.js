const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {OAuth2Client} = require('google-auth-library');
const nodemailer = require("nodemailer");
const {json} = require("body-parser");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const rateLimiter = require("express-rate-limit")
require("dotenv").config();

const router = express.Router();


const loginLimiter = rateLimiter ({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many login attempts. Please try again later.",
   standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimiter({
  windowsMs: 60 * 60 * 1000,
  max: 2,
  message: "Too many signup requests. Please try again later",
   standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1,
  message: "Password reset already requested. Please wait 15 minutes."
})

router.post("/signup", signupLimiter, async (req, res) => {
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

router.post("/login",  async (req, res) => {
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

router.post("/request-password-reset", async (req, res) => {
  try {
    const {email} = req.body;
    if (!email) {
      return res.status(400).json({error: "Email is required"});
    }
    const user = await User.findOne({email});
    if (!user){
      return res.status(404).json({error: "No user found with this email"});
    }
    const resetToken = jwt.sign(
      {userId: user._id},
      process.env.JWT_SECRET,
      {expiresIn: "15m"}
    );
    const resetLink = `https://lettertomychild.site/reset-password?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"CherishLetters" <${process.env.EMAIL_USER}> `,
      to: user.email,
      subject: "Reset your cherish password",
      html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Cherish Letters account.</p>
        <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
        <a href="${resetLink}"
          style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>— The Cherish Letters Team</p>
      </div>
    `    });
    res.status(200).json({message: "Password reset link sent"});
  } catch (error) {
    console.error("Request password reset error", error);
    res.status(500).json({error: "Internal server error"});
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const {token, newPassword, confirmPassword} = req.body;
    if (!token || !newPassword || !confirmPassword){
      return res.status(400).json({error: "All fields are required"})
    }
    if (newPassword !== confirmPassword){
      return res.status(400).json({error: "Passwords do not match"})
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user){
      return res.status(404).json({error: "User not found"});
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({message: "Password updated successfully"});
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({error: "Invalid or expired token"})
  }
})



module.exports = router;

