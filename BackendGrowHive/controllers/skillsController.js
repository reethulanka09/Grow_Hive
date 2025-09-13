// server/controllers/skillsController.js

const User = require('../models/User'); // Assuming your User model is here

/**
 * @desc    Get user's skills (owned, to-learn) and domains
 * @route   GET /api/auth/skills
 * @access  Private
 * @returns {object} { skillsOwned: [], skillsToLearn: [], domains: [] }
 */
exports.getSkills = async (req, res) => {
    try {
        // Fetch all three relevant fields for the frontend
        const user = await User.findById(req.user._id).select('skillsOwned skillsToLearn domains');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({
            skillsOwned: user.skillsOwned,
            skillsToLearn: user.skillsToLearn,
            domains: user.domains
        });
    } catch (error) {
        console.error('Error in getSkills:', error.message);
        res.status(500).json({ message: 'Server error fetching skills.' });
    }
};

/**
 * @desc    Add a new skill (owned or to-learn) or a new domain for the user
 * @route   POST /api/auth/skills
 * @access  Private
 * @body    { type: "owned", skill: "Skill Name", proficiency: "Level", domain: "Domain Name" }
 * OR
 * @body    { type: "to-learn", skill: "Skill Name", domain: "Domain Name" }
 * OR
 * @body    { type: "domain", domainName: "New Domain Name" }
 * @returns {object} updated user skill/domain arrays
 */
exports.addSkill = async (req, res) => {
    const { type, skill, proficiency, domain, domainName } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (type === 'owned') {
            if (!skill || !proficiency || !domain) {
                return res.status(400).json({ message: 'Skill name, proficiency, and domain are required for owned skills.' });
            }
            const validProficiencies = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
            if (!validProficiencies.includes(proficiency)) {
                return res.status(400).json({ message: 'Invalid proficiency level provided.' });
            }

            // Check if skill already exists in skillsOwned for this domain (case-insensitive)
            const skillExists = user.skillsOwned.some(
                (s) => s.skill.toLowerCase() === skill.toLowerCase() && s.domain.toLowerCase() === domain.toLowerCase()
            );
            if (skillExists) {
                return res.status(400).json({ message: `Skill "${skill}" already exists in your owned skills for "${domain}".` });
            }

            user.skillsOwned.push({ skill, proficiency, domain });

            // Add domain to user's top-level domains array if it's new
            if (!user.domains.includes(domain)) {
                user.domains.push(domain);
            }

        } else if (type === 'to-learn') {
            if (!skill || !domain) {
                return res.status(400).json({ message: 'Skill name and domain are required for skills to learn.' });
            }

            // Check if skill already exists in skillsToLearn for this domain (case-insensitive)
            const skillExists = user.skillsToLearn.some(
                (s) => s.skill.toLowerCase() === skill.toLowerCase() && s.domain.toLowerCase() === domain.toLowerCase()
            );
            if (skillExists) {
                return res.status(400).json({ message: `Skill "${skill}" already exists in your skills to learn for "${domain}".` });
            }

            user.skillsToLearn.push({ skill, domain });

            // Add domain to user's top-level domains array if it's new
            if (!user.domains.includes(domain)) {
                user.domains.push(domain);
            }

        } else if (type === 'domain') {
            if (!domainName || domainName.trim() === '') {
                return res.status(400).json({ message: 'Domain name is required.' });
            }
            const trimmedDomainName = domainName.trim();
            if (user.domains.includes(trimmedDomainName)) {
                return res.status(400).json({ message: `Domain "${trimmedDomainName}" already exists.` });
            }
            user.domains.push(trimmedDomainName);
        } else {
            return res.status(400).json({ message: 'Invalid skill type specified. Must be "owned", "to-learn", or "domain".' });
        }

        await user.save();

        // Return updated arrays to sync frontend
        res.status(201).json({
            message: 'Successfully added.',
            skillsOwned: user.skillsOwned,
            skillsToLearn: user.skillsToLearn,
            domains: user.domains
        });
    } catch (error) {
        console.error('Error in addSkill:', error.message);
        // Handle Mongoose validation errors if any field fails schema validation
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error adding.' });
    }
};

/**
 * @desc    Update an existing skill in user's skillsOwned
 * @route   PUT /api/auth/skills/:id
 * @access  Private
 * @param   id - The _id of the skillOwned sub-document
 * @body    { skill: "Current Skill Name", proficiency: "New Level", domain: "Current Domain Name" }
 * Note: `skill` and `domain` are sent for validation, only `proficiency` is updated here as per UI.
 */
exports.updateSkill = async (req, res) => {
    const { id } = req.params; // Skill ID from URL
    const { skill, proficiency, domain } = req.body; // Expecting current skill name, new proficiency, and current domain

    // Basic validation
    if (!skill || !proficiency || !domain) {
        return res.status(400).json({ message: 'Skill name, proficiency, and domain are required for update.' });
    }
    const validProficiencies = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!validProficiencies.includes(proficiency)) {
        return res.status(400).json({ message: 'Invalid proficiency level provided.' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Find the sub-document by its _id in skillsOwned
        const skillToUpdate = user.skillsOwned.id(id);
        if (!skillToUpdate) {
            return res.status(404).json({ message: 'Owned skill not found.' });
        }

        // Optional: Add a check if the original skill name/domain matches
        // if (skillToUpdate.skill !== skill || skillToUpdate.domain !== domain) {
        //     return res.status(400).json({ message: 'Provided skill or domain does not match the skill being updated.' });
        // }

        skillToUpdate.proficiency = proficiency; // Update only proficiency as per UI flow
        await user.save();

        res.status(200).json({
            message: 'Skill updated successfully.',
            skill: skillToUpdate, // Return the updated sub-document
            skillsOwned: user.skillsOwned,
            skillsToLearn: user.skillsToLearn,
            domains: user.domains
        });
    } catch (error) {
        console.error('Error in updateSkill:', error.message);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating skill.' });
    }
};

/**
 * @desc    Delete a skill from user's skillsOwned or skillsToLearn
 * @route   DELETE /api/auth/skills/:id
 * @access  Private
 * @param   id - The _id of the skill sub-document to delete
 * @body    { type: "owned" } OR { type: "to-learn" }
 */
exports.deleteSkill = async (req, res) => {
    const { id } = req.params; // Skill ID from URL
    const { type } = req.body; // To specify whether to delete from skillsOwned or skillsToLearn

    if (!type || (type !== 'owned' && type !== 'to-learn')) {
        return res.status(400).json({ message: 'Invalid or missing "type" in request body. Must be "owned" or "to-learn".' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let skillDeleted = false;
        let originalDomainOfDeletedSkill = null; // To check if domain needs removal

        if (type === 'owned') {
            const skillIndex = user.skillsOwned.findIndex(s => s._id.toString() === id);
            if (skillIndex !== -1) {
                originalDomainOfDeletedSkill = user.skillsOwned[skillIndex].domain;
                user.skillsOwned.splice(skillIndex, 1);
                skillDeleted = true;
            }
        } else if (type === 'to-learn') {
            const skillIndex = user.skillsToLearn.findIndex(s => s._id.toString() === id);
            if (skillIndex !== -1) {
                originalDomainOfDeletedSkill = user.skillsToLearn[skillIndex].domain;
                user.skillsToLearn.splice(skillIndex, 1);
                skillDeleted = true;
            }
        }

        if (!skillDeleted) {
            return res.status(404).json({ message: `${type === 'owned' ? 'Owned skill' : 'Skill to learn'} not found or already deleted.` });
        }

        // Logic to remove domain from top-level 'domains' array if no skills (owned or to-learn) remain for it
        if (originalDomainOfDeletedSkill) {
            const hasOtherOwnedSkillsInDomain = user.skillsOwned.some(s => s.domain === originalDomainOfDeletedSkill);
            const hasOtherToLearnSkillsInDomain = user.skillsToLearn.some(s => s.domain === originalDomainOfDeletedSkill);

            if (!hasOtherOwnedSkillsInDomain && !hasOtherToLearnSkillsInDomain) {
                user.domains = user.domains.filter(d => d !== originalDomainOfDeletedSkill);
            }
        }

        await user.save();
        res.status(200).json({
            message: 'Skill deleted successfully.',
            skillsOwned: user.skillsOwned,
            skillsToLearn: user.skillsToLearn,
            domains: user.domains // Return updated domains as well
        });
    } catch (error) {
        console.error('Error in deleteSkill:', error.message);
        res.status(500).json({ message: 'Server error deleting skill.' });
    }
};
