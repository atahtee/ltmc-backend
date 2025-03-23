const mongoose = require("mongoose")

const milestoneSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    childId: {type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    date: {type: Date, required: true},
    imageUrl: {type: String},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Milestone', milestoneSchema);