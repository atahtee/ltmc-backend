const express = require("express")
const router = express.Router();
const Letter = require ("../models/letter");
const verifyToken = require("../middleware/authMiddleware");

router.post("/post-new-letter", verifyToken, async (req, res) => {
    try {
        const {sender, recipient, message, deliveryDate} = req.body;
        const newLetter = new Letter({sender, recipient, message, deliveryDate, userId: req.userId});
        await newLetter.save();
        res.status(201).json(newLetter);
    } catch (error) {
        res.status(500).json({error: "Internal server error"})
    }
});

router.get("/my-letters", verifyToken, async (req, res) => {
    try {
        const letters = await Letter.find({userId: req.userId});
        res.status(200).json(letters);
    } catch (error) {
        res.status(500).json({error: "Internal server error"})
    }
})


module.exports = router;