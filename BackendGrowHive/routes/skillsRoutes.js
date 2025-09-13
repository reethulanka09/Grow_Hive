// routes/skillsRoutes.js

const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skillsController');
const { protect } = require('../middleware/authMiddleware'); // Your existing protect middleware

// All these routes require authentication
router.route('/')
    .get(protect, skillsController.getSkills) // GET /api/auth/skills
    .post(protect, skillsController.addSkill); // POST /api/auth/skills

router.route('/:id')
    .put(protect, skillsController.updateSkill) // PUT /api/auth/skills/:id
    .delete(protect, skillsController.deleteSkill); // DELETE /api/auth/skills/:id

module.exports = router;
