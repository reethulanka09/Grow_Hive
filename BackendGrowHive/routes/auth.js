const express = require("express");
const router = express.Router();
const Connection = require("../models/connectionschema");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  completeProfile,
  authUser,
  send,
  verify,
  deleteUserAccount,
  changePassword,
  getProfile,
  getUsers,
  getUserById,
} = require("../controllers/authController");

// ✅ Correctly import User model (this was WRONG before)
const User = require("../models/User"); // ✅ FIXED: was wrongly importing Message
const {
  userskill,
  skillsowned,
  all,
  getCompleteUserInfo,
  getUserProfile,
} = require("../controllers/HomePageCon");

const {
  users,
  posttoServiceNow,
  getDepartments,
  createServiceNowCase,
  getReportsByEmail,
  getReportSummary,
  getAll,
  acceptIssue,
  rejectIssue,
  fetchKbCategories,
  getKnowledgeArticles,
} = require("../controllers/ContactPage");

const SERVICENOW_CONFIG = {
  instance: "dev210958.service-now.com",
  username: "saibhanu",
  password: "22A91A05k0@2003",
  table: "x_1745159_growhive_growlogindata",
  department: "x_1745159_growhive_departments",
  contact: "x_1745159_growhive_contactandsupport",
};

// 🔓 Public routes

// const {postToServiceNow} = require("../controllers/ContactPage");
router.post("/signup", registerUser);
router.post("/login", authUser);
router.post("/send", send);
router.post("/verify", verify);
router.get("/profile/:id", getUserProfile);
router.get("/profile", protect, getProfile);
router.get("/users", protect, getUsers);
router.get("/users/:id", protect, getUserById);

router.put("/profile", protect, completeProfile); // For updating general profile fields
router.delete("/delete-account", protect, deleteUserAccount);
router.put("/users/change-password", protect, changePassword);

//hopmepage routes
//Home Screen Api's
router.get("/user-learning-domains/:userId", userskill);
router.post("/domain-experts/:domainName", skillsowned);
// 🔒 Protected routes

//Contact And support
router.get("/user/:userId", users);
router.post("/post-user/:userId", posttoServiceNow);
router.get("/departments", getDepartments);
router.post("/contact", createServiceNowCase);
router.get("/cases/:email", getReportsByEmail);
router.get("/all/:email", getAll);

router.post("/reject", rejectIssue);
router.post("/accept", acceptIssue);

//Recent Reports
router.get("/summary/:email", getReportSummary);

router.get("/kbcategories", fetchKbCategories);
router.get("/kbarticles", getKnowledgeArticles);

// ✅ Get all users except the current one
router.get("/all-users/:id", async (req, res) => {
  try {
    const currentUserId = req.params.id;

    // ✅ Get all users except the current one
    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "-password"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Inside routes/auth.js or routes/connection.js
// router.get("/accepted-connections/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     // Assuming you have a Connection model
//     const acceptedConnections = await Connection.find({
//       $or: [
//         { sender: userId, status: "accepted" },
//         { receiver: userId, status: "accepted" },
//       ],
//     }).populate("sender receiver");

//     res.json(acceptedConnections);
//   } catch (err) {
//     console.error("Error fetching accepted connections:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

module.exports = router;
