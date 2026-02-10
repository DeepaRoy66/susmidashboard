// --- LOAD MODULES ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Create 'uploads' folder if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));
app.use('/uploads', express.static('uploads')); 

// --- CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/userDashboard')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// --- SCHEMAS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    joined: { type: Date, default: Date.now }
}));

const materialSchema = new mongoose.Schema({
    title: String,
    type: String,
    semester: String,
    subject: String,
    description: String,
    fileName: String,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now }
});
const Material = mongoose.model('Material', materialSchema);

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user && user.password === password) {
            return res.status(200).json({ success: true, message: "Login successful!" });
        }
        res.status(401).json({ success: false, message: "Invalid email or password" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 2. UPLOAD MATERIAL
app.post('/upload-material', upload.single('file'), async (req, res) => {
    try {
        const { title, type, semester, subject, description } = req.body;
        const newMaterial = new Material({
            title, type, semester, subject, description,
            fileName: req.file.filename,
            filePath: req.file.path
        });
        await newMaterial.save();
        res.status(201).json({ message: "PDF Uploaded" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 3. FETCH MATERIALS (NEW)
app.get('/materials', async (req, res) => {
    try {
        const materials = await Material.find().sort({ uploadedAt: -1 });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: "Error fetching materials" });
    }
});

// 4. USER MANAGEMENT
app.post('/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: "Email already exists" });
    }
});

app.listen(PORT, () => console.log(`🚀 Backend running: http://localhost:${PORT}`));