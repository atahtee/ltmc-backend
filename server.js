const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors")
const connectDB = require("./config/db")
const letterRoutes = require("./routes/letterRoutes")
const authRoutes = require("./routes/authRoutes")
const childProfilesRouter = require("./routes/childRoutes")
const milestoneRoutes = require("./routes/milestoneRoutes")

dotenv.config();
connectDB();


const app = express()
app.use(cors())
app.use(express.json());

app.get("/ping", (req, res) => {
    res.send("pong pongggggg");
  });

app.get("/", async (req,res) => {
    res.send("Site is working")
})

app.use("/auth", authRoutes)
app.use("/api/letters", letterRoutes);
app.use("/api/child-profiles", childProfilesRouter);
app.use("/api/milestones", milestoneRoutes);

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));