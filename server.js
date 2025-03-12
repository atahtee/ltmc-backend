const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors")
const connectDB = require("./config/db")
const letterRoutes = require("./routes/letterRoutes")
const authRoutes = require("./routes/authRoutes")

dotenv.config();
connectDB();


const app = express()
app.use(cors())
app.use(express.json());

app.use("/auth", authRoutes)
app.use("/api/letters", letterRoutes);

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));