const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const ChildProfile = require('../models/child');
const router = express.Router();



router.post('/post-a-child', verifyToken, async (req, res) => {
    try {
        const {name, birthday} = req.body;
        const newChildProfile = new ChildProfile({
            name,
            birthday,
            parent: req.userId
        });
        const savedChildProfile = await newChildProfile.save();
        res.status(201).json(savedChildProfile);
    } catch (error) {
res.status(500).json({error: error.message})
    }
});


router.get('/get-children', verifyToken, async (req, res) => {
    try {
        const childProfiles = await ChildProfile.find({parent: req.userId});
        res.status(200).json(childProfiles);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})


router.put('/:id', verifyToken, async (req, res) => {
    try {
      const updatedChildProfile = await ChildProfile.findOneAndUpdate(
        { _id: req.params.id, parent: req.userId },
        { $set: req.body },
        { new: true }
      );
      if (!updatedChildProfile) {
        return res.status(404).json({ message: 'Child profile not found' });
      }
      res.status(200).json(updatedChildProfile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  router.delete('/:id', verifyToken, async (req, res) => {
    try {
      const deletedChildProfile = await ChildProfile.findOneAndDelete({
        _id: req.params.id,
        parent: req.userId,
      });
      if (!deletedChildProfile) {
        return res.status(404).json({ message: 'Child profile not found' });
      }
      res.status(200).json({ message: 'Child profile deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  module.exports = router;