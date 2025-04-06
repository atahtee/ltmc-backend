const express = require("express")
const router = express.Router();
const Letter = require ("../models/letter");
const verifyToken = require("../middleware/authMiddleware");
const child = require("../models/child");

router.post("/post-new-letter", verifyToken, async (req, res) => {
    try {
        const { sender, recipient, message, deliveryDate } = req.body;

        console.log("Request body:", req.body);

        const childProfile = await child.findOne({ _id: recipient, parent: req.userId });
        if (!childProfile) {
            return res.status(404).json({ error: "Child profile not found or does not belong to the user" });
        }

        const newLetter = new Letter({
            sender,
            recipient: childProfile._id,
            message,
            deliveryDate,
            userId: req.userId
        });

        await newLetter.save();
        res.status(201).json(newLetter);
    } catch (error) {
        console.log("This is the error:", error )
        res.status(500).json({ error: "Internal service error" });
    }
});

router.delete("/delete-letter/:id", verifyToken, async (req, res) => {

    const letterId = req.params.id;

    try {
        const letter = await Letter.findOne({_id: letterId, userId: req.userId});
        if(!letter){
            return res.status(404).json({error: "Letter not found or unauthorized"});

        }
        await Letter.deleteOne({_id: letterId});
        res.status(200).json({message: "Letter deleted successfully"})
    } catch (error) {
        console.error("Delete error", error);
        res.status(500).json({error: "Internal server error"});
    }
});

router.get("/my-letters", verifyToken, async (req, res) => {
    try {
        const letters = await Letter.find({userId: req.userId}).populate("recipient", "name birthday");
        res.status(200).json(letters);
    } catch (error) {
        res.status(500).json({error: "Internal server error"})
    }
});




module.exports = router;