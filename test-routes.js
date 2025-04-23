const express = require("express");
const app = express();
const cors = require('cors');


const router = express.Router();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Test server is running")
});

app.get("/ping", (req, res) => {
    res.send("ponggg workinggg")
});

app.post("/test-auth", (req, res)=>{
    res.json({success: true, body: req.body})
});
router.get("/google-signin", (req, res) => {
    res.send("Google sign-in GET route is accessible");
  });
app.post("/test-google", (req, res) => {
    res.json({ success: true, message: "Google test is perfect" });
  });

  const PORT = 5001;
  app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));