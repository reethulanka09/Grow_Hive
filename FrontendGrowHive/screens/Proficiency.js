import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";

import { COLORS } from "../screens/constants";

import { IP } from '../Config/config';
// Base API URL, which will be prefixed with /skills in backend
const API_BASE_URL = `${IP}/api/auth`; // This should match the prefix used in index.js for skillsRoutes

const PROFICIENCY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];

// Keep initial options for new additions
const INITIAL_DOMAIN_OPTIONS = [
  "Select Domain",
  "Create New Category",
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Web Development",
  "Mobile Development",
  "Blockchain",
  "Game Development",
  "UI/UX Design",
  "Cloud Computing",
  "DevOps",
  "Software Engineering",
  "Database Management",
  "Network Administration",
  "Digital Marketing",
  "Project Management",
  "Quality Assurance",
  "Data Analysis",
  "Business Intelligence",
];

const INITIAL_SKILLS_BY_DOMAIN = {
  "Artificial Intelligence": [
    "Natural Language Processing",
    "Computer Vision",
    "Deep Learning",
    "Neural Networks",
    "Machine Learning Algorithms",
    "AI Ethics",
    "Reinforcement Learning",
    "Expert Systems",
    "Robotics",
    "Speech Recognition",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Machine Learning": [
    "Supervised Learning",
    "Unsupervised Learning",
    "Deep Learning",
    "Feature Engineering",
    "Model Evaluation",
    "Ensemble Methods",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Data Science": [
    "Data Analysis",
    "Statistical Modeling",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  Cybersecurity: [
    "Network Security",
    "Ethical Hacking",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Web Development": [
    "HTML5",
    "CSS3",
    "JavaScript",
    "React.js",
    "Angular",
    "Vue.js",
    "Node.js",
    "REST APIs",
    "GraphQL",
    "MongoDB",
    "PostgreSQL",
    "Responsive Design",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Mobile Development": [
    "React Native",
    "Flutter",
    "iOS Development",
    "Android Development",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  Blockchain: [
    "Smart Contracts",
    "Solidity",
    "Ethereum",
    "Bitcoin",
    "DeFi",
    "NFTs",
    "Web3",
    "Cryptocurrency",
    "Blockchain Architecture",
    "Consensus Algorithms",
    "dApps",
    "Tokenomics",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Game Development": [
    "Unity",
    "Unreal Engine",
    "C#",
    "C++",
    "Game Design",
    "3D Modeling",
    "Animation",
    "Physics Simulation",
    "Multiplayer Programming",
    "Mobile Games",
    "VR/AR Development",
    "Game Testing",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "UI/UX Design": [
    "User Research",
    "Wireframing",
    "Prototyping",
    "User Testing",
    "Design Systems",
    "Figma",
    "Adobe XD",
    "Sketch",
    "Information Architecture",
    "Interaction Design",
    "Visual Design",
    "Accessibility",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Cloud Computing": [
    "AWS",
    "Microsoft Azure",
    "Google Cloud Platform",
    "Docker",
    "Kubernetes",
    "Serverless Architecture",
    "Microservices",
    "Cloud Security",
    "Infrastructure as Code",
    "Load Balancing",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  DevOps: [
    "CI/CD",
    "Jenkins",
    "Docker",
    "Kubernetes",
    "Terraform",
    "Ansible",
    "Monitoring",
    "Logging",
    "Infrastructure Automation",
    "Configuration Management",
    "Version Control",
    "Agile",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Software Engineering": [
    "Object-Oriented Programming",
    "Design Patterns",
    "Software Architecture",
    "Testing",
    "Code Review",
    "Version Control",
    "Agile Methodologies",
    "SOLID Principles",
    "Refactoring",
    "Documentation",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Database Management": [
    "SQL",
    "NoSQL",
    "Database Design",
    "Query Optimization",
    "Data Modeling",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Database Administration",
    "Backup & Recovery",
    "Performance Tuning",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Network Administration": [
    "Network Configuration",
    "TCP/IP",
    "DNS",
    "DHCP",
    "VPN",
    "Firewall Management",
    "Network Monitoring",
    "Troubleshooting",
    "Cisco Networking",
    "Wireless Networks",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Digital Marketing": [
    "SEO",
    "SEM",
    "Social Media Marketing",
    "Content Marketing",
    "Email Marketing",
    "Google Analytics",
    "PPC Advertising",
    "Marketing Automation",
    "Brand Management",
    "Lead Generation",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Project Management": [
    "Agile",
    "Scrum",
    "Kanban",
    "Risk Management",
    "Resource Planning",
    "Stakeholder Management",
    "Budget Management",
    "Timeline Management",
    "Team Leadership",
    "Communication",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Quality Assurance": [
    "Manual Testing",
    "Automated Testing",
    "Test Planning",
    "Bug Tracking",
    "Performance Testing",
    "Security Testing",
    "API Testing",
    "Mobile Testing",
    "Regression Testing",
    "Test Automation",
    "Merchant Acquisition",
    "Smart Payment",
  ],
  "Data Analysis": [
    "Excel",
    "Python",
    "R",
    "SQL",
    "Tableau",
    "Power BI",
    "Statistical Analysis",
    "Data Cleaning",
    "Data Visualization",
    "Predictive Modeling",
    "Business Intelligence",
    "Smart Payment",
  ],
  "Business Intelligence": [
    "Data Warehousing",
    "ETL",
    "OLAP",
    "Reporting",
    "Dashboard Development",
    "KPI Development",
    "Business Analytics",
    "Data Governance",
    "Data Quality",
    "Performance Metrics",
    "Merchant Acquisition",
    "Smart Payment",
  ],
};

export default function Proficiency() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userToken, userId } = route.params || {};

  const [domains, setDomains] = useState([]); // State for owned domains and their skills
  const [domainOptions, setDomainOptions] = useState(INITIAL_DOMAIN_OPTIONS);
  const [selectedDomain, setSelectedDomain] = useState("Select Domain");
  const [skillsByDomain, setSkillsByDomain] = useState(
    INITIAL_SKILLS_BY_DOMAIN
  );

  const [skillsToLearnList, setSkillsToLearnList] = useState([]);
  const [selectedSkillToLearnDomain, setSelectedSkillToLearnDomain] =
    useState("Select Domain");
  const [selectedSkillToLearn, setSelectedSkillToLearn] =
    useState("Select Skill");

  const [loading, setLoading] = useState(false);

  const [selectedSkillFromDropdown, setSelectedSkillFromDropdown] =
    useState("Select Skill");
  const [proficiency, setProficiency] = useState("");
  const [showProficiencyInput, setShowProficiencyInput] = useState(false);
  // editingSkill now includes the _id of the sub-document
  const [editingSkill, setEditingSkill] = useState(null); // { domainIndex, skillIndex, _id, skillName, domainName }
  const [activeDomainIndex, setActiveDomainIndex] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_600SemiBold,
  });

  // New state for initial loading of user data
  const [initialLoading, setInitialLoading] = useState(true);

  // Helper function to reconstruct domain state for owned skills display
  const reconstructDomainsState = useCallback((skillsOwnedFromApi) => {
    const newDomainsState = [];
    skillsOwnedFromApi.forEach(ownedSkill => {
      let domainEntry = newDomainsState.find(d => d.domainName === ownedSkill.domain);
      if (!domainEntry) {
        domainEntry = { domainName: ownedSkill.domain, skills: [] };
        newDomainsState.push(domainEntry);
      }
      domainEntry.skills.push({
        _id: ownedSkill._id,
        skill: ownedSkill.skill,
        proficiency: ownedSkill.proficiency,
        domain: ownedSkill.domain, // Ensure domain is also stored here
      });
    });
    return newDomainsState;
  }, []);

  // Helper function to update skillsByDomain and domainOptions
  const updateAuxiliaryStates = useCallback((skillsOwnedFromApi, skillsToLearnFromApi, domainsFromApi) => {
    const newSkillsByDomainState = { ...INITIAL_SKILLS_BY_DOMAIN };
    // Populate with existing known skills first (deep copy is important)
    Object.keys(INITIAL_SKILLS_BY_DOMAIN).forEach(domain => {
        newSkillsByDomainState[domain] = [...INITIAL_SKILLS_BY_DOMAIN[domain]];
    });

    // Add skills from skillsOwned
    skillsOwnedFromApi.forEach(skill => {
        if (!newSkillsByDomainState[skill.domain]) {
            newSkillsByDomainState[skill.domain] = [];
        }
        if (!newSkillsByDomainState[skill.domain].includes(skill.skill)) {
            newSkillsByDomainState[skill.domain].push(skill.skill);
        }
    });

    // Add skills from skillsToLearn
    skillsToLearnFromApi.forEach(skill => {
        if (!newSkillsByDomainState[skill.domain]) {
            newSkillsByDomainState[skill.domain] = [];
        }
        if (!newSkillsByDomainState[skill.domain].includes(skill.skill)) {
            newSkillsByDomainState[skill.domain].push(skill.skill);
        }
    });

    setSkillsByDomain(newSkillsByDomainState);

    // Update domain options (ensure unique and 'Create New Category' is last)
    const newDomainOptionsState = [
      ...INITIAL_DOMAIN_OPTIONS.filter((opt) => opt !== "Create New Category"),
      ...(domainsFromApi || []), // Use domains array from API response
      "Create New Category",
    ];
    setDomainOptions(Array.from(new Set(newDomainOptionsState)));
  }, []);


  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    if (!userToken || !userId) {
      console.warn("User token or ID missing. Cannot fetch user data.");
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      };
      // GET /api/auth/skills
      const response = await axios.get(`${API_BASE_URL}/skills`, config);
      const { skillsOwned, skillsToLearn, domains: fetchedDomains } = response.data;

      // Reconstruct main 'domains' state (for owned skills display)
      setDomains(reconstructDomainsState(skillsOwned));

      // Update skillsToLearn list (ensure _id is preserved)
      setSkillsToLearnList(skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })) || []);

      // Update auxiliary states (skillsByDomain and domainOptions)
      updateAuxiliaryStates(skillsOwned, skillsToLearn, fetchedDomains);

      console.log("Fetched user skills and domains successfully.");
    } catch (error) {
      console.error(
        "Error fetching user data:",
        error.response ? error.response.data : error.message
      );
      Alert.alert(
        "Error",
        "Failed to load your skills and domains. Please try again."
      );
    } finally {
      setInitialLoading(false);
    }
  }, [userToken, userId, reconstructDomainsState, updateAuxiliaryStates]); // Dependencies for useCallback

  useEffect(() => {
    console.log("SkillsPage mounted.");
    console.log("Received userToken:", userToken ? "Present" : "Not Present");
    console.log("Received userId:", userId || "Not Present");

    if (userToken && userId) {
      fetchUserData();
    } else {
      setInitialLoading(false); // If no token/ID, stop initial loading
      console.warn(
        "SkillsPage: No userToken or userId received. This might cause issues for API calls or data fetching."
      );
    }
  }, [fetchUserData, userToken, userId]); // Re-run effect if fetchUserData changes (due to its dependencies)

  if (!fontsLoaded || initialLoading) { // Check initialLoading here
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getAvailableSkills = (
    domainName,
    domainIndex = null,
    type = "owned"
  ) => {
    if (!domainName || domainName === "Select Domain") return ["Select Skill"];

    let allSkills = skillsByDomain[domainName] || [];
    allSkills = ["Select Skill", "Create New Skill", ...allSkills];

    if (type === "owned" && domainIndex !== null && domains[domainIndex]) {
      const addedSkills = domains[domainIndex].skills.map(
        (skill) => skill.skill
      );
      return allSkills.filter(
        (skill) =>
          skill === "Select Skill" ||
          skill === "Create New Skill" ||
          !addedSkills.includes(skill)
      );
    } else if (type === "learn") {
      const addedSkills = skillsToLearnList
        .filter((skill) => skill.domain === domainName)
        .map((skill) => skill.skill);
      return allSkills.filter(
        (skill) =>
          skill === "Select Skill" ||
          skill === "Create New Skill" ||
          !addedSkills.includes(skill)
      );
    }

    return allSkills;
  };

  // --- UPDATED handleAddDomain to call API for new domains (type: 'domain') ---
  const handleAddDomain = async () => {
    if (selectedDomain === "Select Domain") {
      Alert.alert("Select Domain", "Please select a domain to add.");
      return;
    }

    if (selectedDomain === "Create New Category") {
      setModalVisible(true);
      return;
    }

    // Check if the domain already exists in the displayed domains (local state)
    const domainExistsLocally = domains.some(
      (domain) => domain.domainName === selectedDomain
    );
    if (domainExistsLocally) {
      Alert.alert("Domain Exists", `The domain "${selectedDomain}" has already been added.`);
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      };
      // API call to add the new domain to user's profile
      const response = await axios.post(`${API_BASE_URL}/skills`, {
        type: 'domain',
        domainName: selectedDomain,
      }, config);

      // Update all states from API response
      setDomains(reconstructDomainsState(response.data.skillsOwned));
      setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
      updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

      setSelectedDomain("Select Domain");
      Alert.alert(
        "Domain Added",
        `${selectedDomain} has been added.`
      );
    } catch (error) {
      console.error(
        "Error adding domain:",
        error.response ? error.response.data : error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add domain. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  // --- UPDATED handleCreateDomain to use the addSkill API endpoint (type: 'domain') ---
  const handleCreateDomain = async () => {
    if (!newDomainName.trim()) {
      Alert.alert("Error", "Please enter a domain name.");
      return;
    }

    const trimmedNewDomainName = newDomainName.trim();
    if (domainOptions.includes(trimmedNewDomainName)) {
      Alert.alert("Error", "This domain already exists.");
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      };
      const response = await axios.post(`${API_BASE_URL}/skills`, {
        type: 'domain',
        domainName: trimmedNewDomainName,
      }, config);

      // Update all states from API response
      setDomains(reconstructDomainsState(response.data.skillsOwned));
      setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
      updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

      setSelectedDomain(trimmedNewDomainName); // Select the newly created domain
      setNewDomainName("");
      setModalVisible(false);
      Alert.alert("Success", `Domain "${trimmedNewDomainName}" created and added.`);
    } catch (error) {
      console.error("Error creating new domain:", error.response ? error.response.data : error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to create new domain. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // --- handleRemoveDomain (Local only, as no specific backend API for deleting domains) ---
  const handleRemoveDomain = (domainIndex) => {
    const domainToRemove = domains[domainIndex];
    Alert.alert(
      "Remove Domain",
      `Are you sure you want to remove "${domainToRemove.domainName}" and its associated skills from your displayed list? Note: This will not delete skills from the backend unless they are explicitly removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => { // Make this function async
            // Local state update only. Backend domain removal is implied if no skills remain.
            const newDomains = domains.filter(
              (_, index) => index !== domainIndex
            );
            setDomains(newDomains);
            if (activeDomainIndex === domainIndex) {
              setActiveDomainIndex(null);
            } else if (activeDomainIndex > domainIndex) {
              setActiveDomainIndex(activeDomainIndex - 1);
            }
            // Also remove from domain options if it was a custom domain and no other skills use it
            if (!INITIAL_DOMAIN_OPTIONS.includes(domainToRemove.domainName)) {
                const skillsStillUsingDomain = [...skillsToLearnList].some(s => s.domain === domainToRemove.domainName) ||
                                              [...domains].some((d, idx) => idx !== domainIndex && d.domainName === domainToRemove.domainName);

                if (!skillsStillUsingDomain) {
                    setDomainOptions(prevOptions => prevOptions.filter(opt => opt !== domainToRemove.domainName));
                }
            }
            Alert.alert("Domain Removed", `"${domainToRemove.domainName}" removed from your list.`);
          },
        },
      ]
    );
  };

  const handleAddSkillToDomain = (domainIndex) => {
    if (selectedSkillFromDropdown === "Select Skill") {
      Alert.alert("Select Skill", "Please select a skill to add.");
      return;
    }

    if (selectedSkillFromDropdown === "Create New Skill") {
      setSkillModalVisible(true);
      setActiveDomainIndex(domainIndex); // Set active domain for skill creation
      return;
    }

    // Ensure proficiency is reset when adding a new skill
    setProficiency("");
    setShowProficiencyInput(true);
    setActiveDomainIndex(domainIndex);
  };

  // handleCreateSkill only updates local state (skillsByDomain and selected dropdown).
  // The actual skill is added to backend when handleSaveProficiency is called (for owned skills)
  // or handleAddSkillToLearn is called (for skills to learn).
  const handleCreateSkill = () => {
    if (!newSkillName.trim()) {
      Alert.alert("Error", "Please enter a skill name.");
      return;
    }

    const domainNameForNewSkill =
      activeDomainIndex !== null
        ? domains[activeDomainIndex]?.domainName
        : selectedSkillToLearnDomain;

    if (!domainNameForNewSkill || domainNameForNewSkill === "Select Domain") {
      Alert.alert("Error", "No domain selected for the new skill.");
      setSkillModalVisible(false);
      return;
    }

    const trimmedNewSkillName = newSkillName.trim();
    if (skillsByDomain[domainNameForNewSkill] && skillsByDomain[domainNameForNewSkill].includes(trimmedNewSkillName)) {
      Alert.alert("Error", "This skill already exists in the selected domain.");
      return;
    }

    // Update skillsByDomain with the new skill locally first
    setSkillsByDomain(prevSkillsByDomain => ({
      ...prevSkillsByDomain,
      [domainNameForNewSkill]: [...(prevSkillsByDomain[domainNameForNewSkill] || []), trimmedNewSkillName],
    }));

    // Set the newly created skill as selected in the appropriate dropdown
    if (activeDomainIndex !== null) {
      setSelectedSkillFromDropdown(trimmedNewSkillName);
    } else {
      setSelectedSkillToLearn(trimmedNewSkillName);
    }

    setNewSkillName("");
    setSkillModalVisible(false);

    // If it's a skill for an owned domain, immediately show proficiency input
    if (activeDomainIndex !== null) {
        setShowProficiencyInput(true);
    }
  };


  // --- UPDATED handleSaveProficiency to use the addSkill API endpoint (type: 'owned') ---
  const handleSaveProficiency = async () => {
    if (
      selectedSkillFromDropdown !== "Select Skill" &&
      proficiency.trim() &&
      activeDomainIndex !== null
    ) {
      const domainName = domains[activeDomainIndex].domainName;
      const skillName = selectedSkillFromDropdown;

      setLoading(true);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        };

        const response = await axios.post(`${API_BASE_URL}/skills`, {
          type: 'owned',
          skill: skillName,
          proficiency: proficiency.trim(),
          domain: domainName,
        }, config);

        // Update all states from the comprehensive API response
        setDomains(reconstructDomainsState(response.data.skillsOwned));
        setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
        updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

        setSelectedSkillFromDropdown("Select Skill");
        setProficiency("");
        setShowProficiencyInput(false);
        setActiveDomainIndex(null); // Reset active domain index
        Alert.alert("Success", `Skill "${skillName}" added.`);
      } catch (error) {
        console.error("Error adding skill:", error.response ? error.response.data : error.message);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to add skill. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert("Error", "Please select a skill and proficiency to save.");
    }
  };

  // --- UPDATED handleEditSkill to store the _id and full skill/domain info ---
  const handleEditSkill = (domainIndex, skillIndex) => {
    const skill = domains[domainIndex].skills[skillIndex];
    setEditingSkill({
        domainIndex,
        skillIndex,
        _id: skill._id,
        skillName: skill.skill,
        domainName: skill.domain,
    });
    setProficiency(skill.proficiency);
    setShowProficiencyInput(false); // Hide the "add new skill" proficiency input
  };

  // --- UPDATED handleSaveEditedProficiency to use the updateSkill API endpoint ---
  const handleSaveEditedProficiency = async () => {
    if (proficiency.trim() && editingSkill && editingSkill._id) {
      setLoading(true);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        };

        const response = await axios.put(
          `${API_BASE_URL}/skills/${editingSkill._id}`, // Use the _id for update
          {
            skill: editingSkill.skillName, // Send current skill name for verification/consistency
            proficiency: proficiency.trim(),
            domain: editingSkill.domainName, // Send current domain name for verification/consistency
          },
          config
        );

        // Update all states from the comprehensive API response
        setDomains(reconstructDomainsState(response.data.skillsOwned));
        setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
        updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

        setEditingSkill(null);
        setProficiency("");
        Alert.alert("Success", "Proficiency updated successfully!");
      } catch (error) {
        console.error("Error updating proficiency:", error.response ? error.response.data : error.message);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to update proficiency. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert("Error", "Please select proficiency to save changes.");
    }
  };

  // --- UPDATED handleRemoveSkillFromDomain to use the deleteSkill API endpoint (type: 'owned') ---
  const handleRemoveSkillFromDomain = (domainIndex, skillIndex) => {
    const skillToRemove = domains[domainIndex].skills[skillIndex];
    Alert.alert(
      "Remove Skill",
      `Are you sure you want to remove "${skillToRemove.skill}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => { // Make this function async
            setLoading(true); // Indicate loading
            try {
              const config = {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
                data: { // For DELETE requests with body, use 'data' property in Axios
                  type: 'owned',
                }
              };
              const response = await axios.delete(`${API_BASE_URL}/skills/${skillToRemove._id}`, config); // Use _id for deletion

              // Update all states from the comprehensive API response
              setDomains(reconstructDomainsState(response.data.skillsOwned));
              setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
              updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

              Alert.alert("Success", "Skill removed successfully!");
            } catch (error) {
              console.error(
                "Error deleting owned skill:",
                error.response ? error.response.data : error.message
              );
              Alert.alert(
                "Error",
                error.response && error.response.data && error.response.data.message
                  ? error.response.data.message
                  : "Failed to remove skill. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // --- UPDATED handleAddSkillToLearn to use the addSkill API endpoint (type: 'to-learn') ---
  const handleAddSkillToLearn = async () => {
    if (
      selectedSkillToLearnDomain === "Select Domain" ||
      selectedSkillToLearn === "Select Skill"
    ) {
      Alert.alert("Error", "Please select a domain and skill to learn.");
      return;
    }

    if (selectedSkillToLearn === "Create New Skill") {
      setSkillModalVisible(true);
      setActiveDomainIndex(null); // Indicate it's for skills to learn
      return;
    }

    const skillToLearnExists = skillsToLearnList.some(
        (item) => item.skill === selectedSkillToLearn && item.domain === selectedSkillToLearnDomain
    );
    if (skillToLearnExists) {
        Alert.alert("Skill Exists", "This skill has already been added to your 'skills to learn' list for this domain.");
        return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      };

      const response = await axios.post(`${API_BASE_URL}/skills`, {
        type: 'to-learn',
        skill: selectedSkillToLearn,
        domain: selectedSkillToLearnDomain,
      }, config);

      // Update all states from the comprehensive API response
      setDomains(reconstructDomainsState(response.data.skillsOwned));
      setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
      updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

      setSelectedSkillToLearn("Select Skill");
      setSelectedSkillToLearnDomain("Select Domain");
      Alert.alert(
        "Success",
        `"${selectedSkillToLearn}" added to skills to learn.`
      );
    } catch (error) {
      console.error("Error adding skill to learn:", error.response ? error.response.data : error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add skill to learn. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED handleRemoveSkillToLearn to use the deleteSkill API endpoint (type: 'to-learn') ---
  const handleRemoveSkillToLearn = (index) => {
    const skillToLearnToRemove = skillsToLearnList[index];
    Alert.alert(
      "Remove Skill",
      `Are you sure you want to remove "${skillToLearnToRemove.skill}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => { // Make this function async
            setLoading(true); // Indicate loading
            try {
              const config = {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userToken}`,
                },
                data: { // For DELETE requests with body, use 'data' property in Axios
                  type: 'to-learn',
                }
              };
              const response = await axios.delete(`${API_BASE_URL}/skills/${skillToLearnToRemove._id}`, config); // Use _id for deletion

              // Update all states from the comprehensive API response
              setDomains(reconstructDomainsState(response.data.skillsOwned));
              setSkillsToLearnList(response.data.skillsToLearn.map(s => ({ _id: s._id, skill: s.skill, domain: s.domain })));
              updateAuxiliaryStates(response.data.skillsOwned, response.data.skillsToLearn, response.data.domains);

              Alert.alert("Success", "Skill to learn removed successfully!");
            } catch (error) {
              console.error(
                "Error deleting skill to learn:",
                error.response ? error.response.data : error.message
              );
              Alert.alert(
                "Error",
                error.response && error.response.data && error.response.data.message
                  ? error.response.data.message
                  : "Failed to remove skill to learn. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // --- handleNext is simplified to navigation only, as persistence is granular ---
  const handleNext = () => {
    // All adds/updates/deletes are now handled individually via API calls.
    // So, 'Next' button simply navigates.
    navigation.navigate("UploadCertificatesScreen", { userToken, userId });
  };


  const handleBack = () => {
    console.log("SkillsPage: Going back.");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 38 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: 36 }} />
        <Text style={styles.title}>Skills & Domains</Text>
        <Text style={styles.subtitle}>
          Add your domains of expertise and showcase your skills in each area.
        </Text>

        {/* Domain Selection */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabelRow}>
            <MaterialIcons name="category" size={22} color={COLORS.secondary} />
            <Text style={styles.inputLabel}>Skills Owned</Text>
          </View>
          <View style={styles.domainAddRow}>
            <View style={[styles.pickerWrapper, { flex: 1, marginRight: 10 }]}>
              <Picker
                selectedValue={selectedDomain}
                onValueChange={(itemValue) => setSelectedDomain(itemValue)}
                style={styles.picker}
                dropdownIconColor={COLORS.secondary}
                enabled={!loading} // Disable picker during loading
              >
                {domainOptions.map((domain, i) => (
                  <Picker.Item key={i} label={domain} value={domain} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddDomain}
              disabled={selectedDomain === "Select Domain" || loading}
            >
              {loading ? ( // Show loader only when this specific button is loading
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Icon name="plus-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Display Domains and Their Skills */}
        {domains.map((domain, domainIndex) => (
          <View key={domain.domainName || domainIndex} style={styles.domainSection}> {/* Use domainName as key if stable */}
            <View style={styles.domainHeader}>
              <View style={styles.domainTitleRow}>
                <MaterialIcons name="folder" size={20} color={COLORS.primary} />
                <Text style={styles.domainTitle}>{domain.domainName}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeDomainBtn}
                onPress={() => handleRemoveDomain(domainIndex)}
                disabled={loading} // Disable button during any loading state
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                  <MaterialIcons name="delete" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            </View>

            {/* Add Skills to This Domain - Dropdown Selection */}
            {!showProficiencyInput && !editingSkill && (
              <View style={styles.skillAddSection}>
                <View style={styles.skillAddRow}>
                  <View
                    style={[styles.pickerWrapper, { flex: 1, marginRight: 8 }]}
                  >
                    <Picker
                      selectedValue={selectedSkillFromDropdown}
                      onValueChange={(itemValue) =>
                        setSelectedSkillFromDropdown(itemValue)
                      }
                      style={styles.picker}
                      dropdownIconColor={COLORS.secondary}
                      enabled={!loading}
                    >
                      {getAvailableSkills(
                        domain.domainName,
                        domainIndex,
                        "owned"
                      ).map((skill, i) => (
                        <Picker.Item key={i} label={skill} value={skill} />
                      ))}
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddSkillToDomain(domainIndex)}
                    disabled={selectedSkillFromDropdown === "Select Skill" || loading}
                  >
                    {loading && selectedSkillFromDropdown !== "Select Skill" ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Icon name="plus-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Proficiency Input for New Skill */}
            {showProficiencyInput && activeDomainIndex === domainIndex && (
              <View style={styles.proficiencyRow}>
                <Text style={styles.proficiencyLabel}>
                  Proficiency for "{selectedSkillFromDropdown}":
                </Text>
                <View style={styles.dropdownContainer}>
                  {PROFICIENCY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,
                        proficiency === option && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => setProficiency(option)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          proficiency === option &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProficiency}
                  disabled={!proficiency.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.card} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Edit Proficiency for Existing Skill */}
            {editingSkill && editingSkill.domainIndex === domainIndex && (
              <View style={styles.proficiencyRow}>
                <Text style={styles.proficiencyLabel}>
                  Edit proficiency for "
                  {domain.skills[editingSkill.skillIndex].skill}":
                </Text>
                <View style={styles.dropdownContainer}>
                  {PROFICIENCY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,
                        proficiency === option && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => setProficiency(option)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          proficiency === option &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveEditedProficiency}
                  disabled={!proficiency.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.card} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* List of Skills in This Domain */}
            <View style={styles.skillsList}>
              {domain.skills.map((skill, skillIndex) => (
                <View key={skill._id || skillIndex} style={styles.skillItemRow}> {/* Use skill._id as key */}
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.skillText}>
                    {skill.skill}{" "}
                    <Text style={styles.skillProficiency}>
                      ({skill.proficiency})
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEditSkill(domainIndex, skillIndex)}
                    disabled={loading}
                  >
                    <Icon name="edit-2" size={18} color={COLORS.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() =>
                      handleRemoveSkillFromDomain(domainIndex, skillIndex)
                    }
                    disabled={loading}
                  >
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={COLORS.accent}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Skills to Learn */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabelRow}>
            <MaterialIcons
              name="lightbulb-outline"
              size={22}
              color={COLORS.primary}
            />
            <Text style={styles.inputLabel}>Skills to Learn</Text>
          </View>

          <View style={styles.skillToLearnSection}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedSkillToLearnDomain}
                onValueChange={(itemValue) => {
                  setSelectedSkillToLearnDomain(itemValue);
                  setSelectedSkillToLearn("Select Skill");
                }}
                style={styles.picker}
                dropdownIconColor={COLORS.secondary}
                enabled={!loading}
              >
                {domainOptions
                  .filter((opt) => opt !== "Create New Category")
                  .map((domain, i) => (
                    <Picker.Item key={i} label={domain} value={domain} />
                  ))}
              </Picker>
            </View>

            {selectedSkillToLearnDomain !== "Select Domain" && (
              <View style={styles.skillAddRow}>
                <View
                  style={[styles.pickerWrapper, { flex: 1, marginRight: 8 }]}
                >
                  <Picker
                    selectedValue={selectedSkillToLearn}
                    onValueChange={(itemValue) =>
                      setSelectedSkillToLearn(itemValue)
                    }
                    style={styles.picker}
                    dropdownIconColor={COLORS.secondary}
                    enabled={!loading}
                  >
                    {getAvailableSkills(
                      selectedSkillToLearnDomain,
                      null,
                      "learn"
                    ).map((skill, i) => (
                      <Picker.Item key={i} label={skill} value={skill} />
                    ))}
                  </Picker>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAddSkillToLearn}
                  disabled={
                    selectedSkillToLearn === "Select Skill" ||
                    selectedSkillToLearnDomain === "Select Domain" ||
                    loading
                  }
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Icon name="plus-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ marginTop: 8 }}>
            {skillsToLearnList.map((skillItem, idx) => (
              <View key={skillItem._id || idx} style={styles.skillItemRow}> {/* Use skillItem._id as key */}
                <MaterialIcons
                  name="lightbulb-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <View style={styles.skillToLearnContent}>
                  <Text style={styles.skillText}>{skillItem.skill}</Text>
                  <Text style={styles.skillDomain}>
                    Domain: {skillItem.domain}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveSkillToLearn(idx)}
                  disabled={loading}
                >
                  <MaterialIcons name="close" size={20} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        {/* <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
            <MaterialIcons
              name="arrow-back"
              size={28}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.card} size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      {/* Modal for Creating New Domain */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Domain</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter domain name"
              placeholderTextColor={COLORS.muted}
              value={newDomainName}
              onChangeText={setNewDomainName}
              editable={!loading}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewDomainName("");
                  setSelectedDomain("Select Domain");
                }}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCreateDomain}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.card} size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: COLORS.card }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Creating New Skill */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={skillModalVisible}
        onRequestClose={() => setSkillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Skill</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter skill name"
              placeholderTextColor={COLORS.muted}
              value={newSkillName}
              onChangeText={setNewSkillName}
              editable={!loading}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setSkillModalVisible(false);
                  setNewSkillName("");
                  if (activeDomainIndex !== null) {
                    setSelectedSkillFromDropdown("Select Skill");
                  } else {
                    setSelectedSkillToLearn("Select Skill");
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCreateSkill}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.card} size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: COLORS.card }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} // This is the closing brace for the default export function.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 26,
    paddingTop: 38,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 5,
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 22,
    lineHeight: 22,
    fontFamily: "Poppins_400Regular",
  },
  inputSection: {
    marginBottom: 18,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  inputLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Poppins_700Bold",
  },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.shadow,
    padding: 10,
    minHeight: 44,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    textAlignVertical: "top",
  },
  domainAddRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillAddRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  domainSection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.shadow,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  domainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.shadow,
  },
  domainTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  domainTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: COLORS.text,
    fontFamily: "Poppins_700Bold",
  },
  removeDomainBtn: {
    padding: 4,
  },
  skillsList: {
    marginTop: 8,
  },
  proficiencyRow: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.shadow,
    padding: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  proficiencyLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  dropdownOption: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.shadow,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 6,
  },
  dropdownOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dropdownOptionText: {
    color: COLORS.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
  },
  dropdownOptionTextSelected: {
    color: COLORS.card,
    fontFamily: "Poppins_700Bold",
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    width: 100,
    alignSelf: "flex-end",
  },
  saveBtnText: {
    color: COLORS.card,
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  skillItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.shadow,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  skillText: {
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
  },
  skillProficiency: {
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  editBtn: {
    marginLeft: 8,
    padding: 4,
  },
  removeBtn: {
    marginLeft: 4,
    padding: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.shadow,
    elevation: 1,
  },
  nextButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: COLORS.card,
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  pickerWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.shadow,
    overflow: "hidden",
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: "100%",
    color: COLORS.text,
    fontFamily: "Poppins_400Regular",
  },
  skillToLearnSection: {
    marginBottom: 10,
  },
  skillToLearnContent: {
    flex: 1,
    marginLeft: 8,
  },
  skillDomain: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  modalInput: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.shadow,
    padding: 10,
    minHeight: 44,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.shadow,
    marginHorizontal: 5,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
  },
});
