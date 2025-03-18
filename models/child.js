const mongoose = require('mongoose');

const childProfileSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        birthday: {
            type: Date,
            required: true
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },{timestamps: true}
);
module.exports = mongoose.model('ChildProfile', childProfileSchema);