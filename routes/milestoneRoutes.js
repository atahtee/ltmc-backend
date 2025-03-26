const express = require("express");
const router = express.Router();
const Milestone = require("../models/milestone");
const User = require("../models/user");
const Child = require("../models/child");
const verifyToken = require("../middleware/authMiddleware");

router.post("/add-milestone", verifyToken, async (req, res) => {
    try {
        const { childId, title, description, date } = req.body;

        const user = await User.findById(req.userId);
        // if (!user.isPremium) {
        //     return res.status(403).json({ error: "Premium feature. Upgrade to access" });
        // }

        const childProfile = await Child.findOne({ _id: childId, parent: req.userId });
        if (!childProfile) {
            return res.status(404).json({ error: "Child profile not found or does not belong to the user" });
        }

        const newMilestone = new Milestone({
            userId: req.userId,
            childId,
            title,
            description,
            date,
        });

        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (error) {
        console.error("Add milestone error: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:childId", verifyToken, async (req, res) => {
    try {
        const { childId } = req.params;
        const user = await User.findById(req.userId);
        // if (!user.isPremium) {
        //     return res.status(403).json({ error: "Premium feature. Upgrade to access" });
        // }

        const childProfile = await Child.findOne({ _id: childId, parent: req.userId });
        if (!childProfile) {
            return res.status(404).json({ error: "Child profile not found or does not belong to the user" });
        }

        const milestones = await Milestone.find({ childId }).sort({ date: -1 });
        res.status(200).json(milestones);
    } catch (error) {
        console.error("Get milestones error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.delete("/:milestoneId", verifyToken, async (req, res) => {
    try {
        const {milestoneId} = req.params;
        const user = await User.findById(req.userId);

        const milestone = await Milestone.findById(milestoneId);
        if(!milestone){
            return res.status(404).json({error: "Milestone not found"})
        }

        const child = await Child.findOne({
            _id: milestone.childId,
            parent: req.userId
        });

        if (!child){
            return res.status(403).json({
                error: "Not authorized to delete this milestone"
            })
        }

        await Milestone.findByIdAndDelete(milestoneId);

        res.status(200).json({
            success: true,
            message: "Milestone deleted successfully",
            deletedId: milestoneId
        })
    } catch (error) {
        console.error("Delete milestone error:", error);
        res.status(500).json({error: "Internal server error"})
    }
});



module.exports = router;
