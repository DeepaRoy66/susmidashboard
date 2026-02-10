// --- LOAD MODULES ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Built-in body parser
app.use(express.urlencoded({ extended: true }));

// Serve the HTML file from the current folder
app.use(express.static(path.join(__dirname, '.')));

// --- CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/userDashboard')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('   (Make sure you have MongoDB Community Server installed and running)');
    });

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    joined: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- ROUTES ---

// 1. GET ALL USERS
app.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ joined: -1 });
        res.json(users);
    } catch (error) {
        console.error("GET Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 2. ADD NEW USER
app.post('/users', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Adding user:", email); // Debug log

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error("POST Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 3. UPDATE USER
app.put('/users/:id', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Updating user:", req.params.id); // Debug log

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, password },
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        console.error("PUT Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 4. DELETE USER
app.delete('/users/:id', async (req, res) => {
    try {
        console.log("Deleting user:", req.params.id); // Debug log
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) {
        console.error("DELETE Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Serving files from: ${__dirname}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is busy. Close the other terminal or wait a moment.`);
    } else {
        console.log(err);
    }
});