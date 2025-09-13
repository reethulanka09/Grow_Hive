const axios = require("axios");
const User = require("../models/User"); // Update path as needed

// const SERVICE_NOW_INSTANCE_URL = "https://dev210958.service-now.com";
// const SERVICE_NOW_USERNAME = "saibhanu";
// const SERVICE_NOW_PASSWORD = "22A91A05k0@2003";
const SERVICENOW_CONFIG = {
  instance: "dev210958.service-now.com",
  username: "saibhanu",
  password: "22A91A05k0@2003",
  table: "x_1745159_growhive_growlogindata",
  department: "x_1745159_growhive_departments",
  contact: "x_1745159_growhive_contactandsupport",
};

const postedUsers = new Set();

// GET user details by ID
exports.users = async (req, res) => {
  try {
    const { userId } = req.params;

    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(foundUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.posttoServiceNow = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user in MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user already exists in ServiceNow by mongoid
    const checkResponse = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.table}?sysparm_query=mongoid=${user._id}`,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // If user already exists in ServiceNow, return message
    if (checkResponse.data.result && checkResponse.data.result.length > 0) {
      return res.json({
        message: "User already exists in ServiceNow",
        existingRecord: checkResponse.data.result[0],
      });
    }

    // If user doesn't exist in ServiceNow, proceed to create
    const serviceNowData = {
      name: user.name,
      email: user.email,
      mobile: user.phoneNumber,
      mongoid: user._id,
    };

    // Post to ServiceNow
    const response = await axios.post(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.table}`,
      serviceNowData,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Remove from postedUsers set since we're now checking ServiceNow directly
    // postedUsers.add(userId); // This line can be removed

    res.json({
      message: "User posted successfully to ServiceNow",
      serviceNowRecord: response.data.result,
    });
  } catch (error) {
    console.error(
      "Error with ServiceNow operation:",
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      res.status(401).json({ error: "ServiceNow authentication failed" });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: "ServiceNow table not found" });
    } else {
      res.status(500).json({ error: "Failed to communicate with ServiceNow" });
    }
  }
};

//Getting Departments

exports.getDepartments = async (req, res) => {
  try {
    const response = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.department}?sysparm_fields=departmentname,sys_id&sysparm_limit=10`,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    const departments = response.data.result.map((d, index) => ({
      sys_id: d.sys_id,
      name: d.departmentname,
    }));

    res.status(200).json(departments);
  } catch (error) {
    console.error(
      "Department fetch failed",
      error.response?.data || error.message
    );
    res.status(401).json({ message: "Failed to fetch departments" });
  }
};

//Now For Create Case
exports.createServiceNowCase = async (req, res) => {
  const { name, email, subject, description, department } = req.body;

  try {
    const payload = {
      name: name,
      email: email,
      subject: subject,
      description: description,
      department: department,
    };

    const response = await axios.post(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}`, // Replace with actual table
      payload,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(201).json({
      message: "Case created successfully in ServiceNow",
      data: response.data.result,
    });
  } catch (error) {
    console.error(
      "ServiceNow Case Creation Error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      error: "Failed to create case in ServiceNow",
    });
  }
};

//For Recent Reports
// exports.getCasesFromServiceNow = async (req, res) => {
//   try {
//     const response = await axios.get(
//       `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}?sysparm_fields=issue_id,subject,createdon,status,department&sysparm_query=ORDERBYDESCcreatedon`,
//       {
//         auth: {
//           username: SERVICENOW_CONFIG.username,
//           password: SERVICENOW_CONFIG.password,
//         },

//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const records = response.data.result;
//     res.status(200).json(records);
//   } catch (error) {
//     console.error(
//       "ServiceNow fetch failed:",
//       error.response?.data || error.message
//     );
//     res.status(500).json({ error: "Failed to fetch data from ServiceNow" });
//   }
// };

// Recent Reports
// exports.getReportsByEmail = async (req, res) => {
//   const { email } = req.params;

//   try {
//     const response = await axios.get(
//       `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}?sysparm_query=email=${email}^status!=completed^ORDERBYDESCcreatedon&sysparm_fields=sys_id,number,subject,description,status,createdon,department,email`,
//       {
//         auth: {
//           username: SERVICENOW_CONFIG.username,
//           password: SERVICENOW_CONFIG.password,
//         },

//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.status(200).json(response.data.result);
//   } catch (error) {
//     console.error(
//       "Error fetching reports from ServiceNow:",
//       error.response?.data || error.message
//     );
//     res.status(500).json({ error: "Failed to fetch reports" });
//   }
// };

// exports.getReportsByEmail = async (req, res) => {
//   const { email } = req.params;

//   try {
//     const response = await axios.get(
//       `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}?sysparm_query=email=${email}&sysparm_limit=100&sysparm_display_value=false`,
//       {
//         auth: {
//           username: SERVICENOW_CONFIG.username,
//           password: SERVICENOW_CONFIG.password,
//         },
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return res.status(200).json(response.data.result); // No modification to status
//   } catch (error) {
//     console.error(
//       "Error fetching cases:",
//       error.response?.data || error.message
//     );
//     return res.status(500).json({ error: "Failed to fetch cases" });
//   }
// };

// exports.getReportsByEmail = async (req, res) => {
//   const { email } = req.params;

//   try {
//     const response = await axios.get(
//       `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}?sysparm_query=email=${email}^ORDERBYDESCsys_created_on&sysparm_limit=100&sysparm_display_value=false`,
//       {
//         auth: {
//           username: SERVICENOW_CONFIG.username,
//           password: SERVICENOW_CONFIG.password,
//         },
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return res.status(200).json(response.data.result);
//   } catch (error) {
//     console.error(
//       "Error fetching cases:",
//       error.response?.data || error.message
//     );
//     return res.status(500).json({ error: "Failed to fetch cases" });
//   }
// };

exports.getReportsByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const response = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}?sysparm_query=email=${email}^ORDERBYDESCsys_created_on&sysparm_limit=100&sysparm_display_value=true`,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data.result);
  } catch (error) {
    console.error(
      "Error fetching cases:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: "Failed to fetch cases" });
  }
};

exports.getAll = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const query = `email=${encodeURIComponent(email)}`;

    // Use sysparm_display_value=all to get both value and display_value for reference fields
    const response = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}?sysparm_query=${query}^ORDERBYDESCsys_created_on&sysparm_fields=sys_id,number,subject,status,description,department,solution,assignedto,sys_created_on,onholdreason&sysparm_limit=100&sysparm_display_value=all`,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const reports = response.data.result.map((report, index) => ({
      id: (index + 1).toString(),
      sys_id: report.sys_id?.value || report.sys_id,
      issueNumber: report.number?.value || report.number,
      subject: report.subject?.value || report.subject,
      status: report.status?.value || report.status,
      description: report.description?.value || report.description,
      department: report.department?.display_value || "N/A",
      solution: report.solution?.value || report.solution || "",
      assignedTo: report.assignedto?.display_value || "Unassigned",
      createdOn: report.sys_created_on?.value || report.sys_created_on || "",
      onholdReason: report.onholdreason?.value || report.onholdreason || "",
      // For additional internal usage or future API calls
      departmentSysId: report.department?.value || "",
      assignedToSysId: report.assignedto?.value || "",
      departmentRaw: report.department,
      assignedToRaw: report.assignedto,
    }));

    return res.status(200).json({ reports });
  } catch (error) {
    console.error(
      "Error fetching reports:",
      error.response?.data || error.message
    );
    return res.status(500).json({ message: "Failed to fetch reports" });
  }
};

//Report Summary

// exports.getReportSummary = async (req, res) => {
//   const { email } = req.params;

//   if (!email) {
//     return res.status(400).json({ error: "User email is required" });
//   }

//   try {
//     // 1. Fetch records (limit to 1000)
//     const response = await axios.get(
//       `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}`,
//       {
//         params: {
//           sysparm_limit: 1000,
//           sysparm_fields: "status,email", // include user-identifying field
//         },
//         auth: {
//           username: SERVICENOW_CONFIG.username,
//           password: SERVICENOW_CONFIG.password,
//         },
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const records = response.data.result || [];

//     // 2. Count statuses only for the matching user
//     const statusCounts = {
//       new: 0,
//       progress: 0,
//       onhold: 0,
//       completed: 0,
//     };

//     records.forEach((record) => {
//       const recordEmail = record.email?.toLowerCase();
//       const status = record.status?.toLowerCase();

//       if (
//         recordEmail === email.toLowerCase() &&
//         statusCounts.hasOwnProperty(status)
//       ) {
//         statusCounts[status]++;
//       }
//     });

//     return res.status(200).json({
//       message: "Report summary fetched successfully",
//       data: statusCounts,
//     });
//   } catch (error) {
//     console.error(
//       "ServiceNow Report Summary Error:",
//       error.response?.data || error.message
//     );
//     return res.status(500).json({
//       error: "Failed to fetch report summary from ServiceNow",
//     });
//   }
// };

exports.getReportSummary = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "User email is required" });
  }

  try {
    // 1. Fetch records (limit to 1000)
    const response = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/${SERVICENOW_CONFIG.contact}`,
      {
        params: {
          sysparm_limit: 1000,
          sysparm_fields: "status,email", // include user-identifying field
        },
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const records = response.data.result || [];

    // 2. Count statuses only for the matching user (including closed)
    const statusCounts = {
      new: 0,
      progress: 0,
      onhold: 0,
      completed: 0,
      closed: 0, // Added closed status
    };

    records.forEach((record) => {
      const recordEmail = record.email?.toLowerCase();
      const status = record.status?.toLowerCase();

      if (
        recordEmail === email.toLowerCase() &&
        statusCounts.hasOwnProperty(status)
      ) {
        statusCounts[status]++;
      }
    });

    return res.status(200).json({
      message: "Report summary fetched successfully",
      data: statusCounts,
    });
  } catch (error) {
    console.error(
      "ServiceNow Report Summary Error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      error: "Failed to fetch report summary from ServiceNow",
    });
  }
};


//Accept
exports.acceptIssue = async (req, res) => {
  const { sys_id, email } = req.body;

  if (!sys_id || !email) {
    return res.status(400).json({
      success: false,
      message: "System ID and email are required",
    });
  }

  try {
    // First, verify the contact/support issue belongs to the user
    const getQuery = `email=${encodeURIComponent(email)}^sys_id=${sys_id}`;
    const getResponse = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/x_1745159_growhive_contactandsupport?sysparm_query=${getQuery}&sysparm_fields=sys_id,subject,email,number,state,status`,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    if (getResponse.data.result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found or you don't have permission to modify it",
      });
    }

    const currentIssue = getResponse.data.result[0];

    // Check if the issue is in 'completed' status before allowing acceptance
    if (currentIssue.status !== "completed" && currentIssue.state !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed issues can be accepted and closed",
      });
    }

    // Update the issue status to 'closed'
    const updateData = {
      status: "closed",
      // Keep the existing solution and other fields
      // Add any additional fields you want to update when closing
    };

    const updateResponse = await axios.put(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/x_1745159_growhive_contactandsupport/${sys_id}`,
      updateData,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    if (updateResponse.status === 200) {
      // Verify the update was successful
      const verifyResponse = await axios.get(
        `https://${SERVICENOW_CONFIG.instance}/api/now/table/x_1745159_growhive_contactandsupport/${sys_id}?sysparm_fields=sys_id,number,status,state,solution,assignedto`,
        {
          auth: {
            username: SERVICENOW_CONFIG.username,
            password: SERVICENOW_CONFIG.password,
          },
          headers: { "Content-Type": "application/json" },
        }
      );

      const updatedRecord = verifyResponse.data.result;

      res.status(200).json({
        success: true,
        message: "Issue resolution accepted and case closed successfully",
        data: {
          sys_id: sys_id,
          issueNumber: currentIssue.number,
          previousStatus: currentIssue.status || currentIssue.state,
          newStatus: updatedRecord.status || updatedRecord.state || "closed",
          solution: updatedRecord.solution,
          assignedTo: updatedRecord.assignedto,
          updatedRecord: updatedRecord,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to accept and close the issue",
        statusCode: updateResponse.status,
      });
    }
  } catch (error) {
    console.error(
      "Error accepting issue:",
      error.response?.data || error.message
    );

    // Log detailed error information
    if (error.response?.data?.error) {
      console.error("ServiceNow Error Details:", error.response.data.error);
    }

    res.status(500).json({
      success: false,
      message: "Failed to accept and close the issue",
      error: error.response?.data || error.message,
      details: error.response?.data?.error || null,
    });
  }
};


exports.rejectIssue = async (req, res) => {
  const { sys_id, email, onholdReason } = req.body;

  if (!sys_id || !email || !onholdReason) {
    return res.status(400).json({
      success: false,
      message: "System ID, email, and onhold reason are required",
    });
  }

  try {
    // First, verify the contact/support issue belongs to the user
    const getQuery = `email=${encodeURIComponent(email)}^sys_id=${sys_id}`;
    const getResponse = await axios.get(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/x_1745159_growhive_contactandsupport?sysparm_query=${getQuery}&sysparm_fields=sys_id,subject,email,number,state,status`,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    if (getResponse.data.result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found or you don't have permission to modify it",
      });
    }

    const currentIssue = getResponse.data.result[0];
 
    const updateData = {
      status: "onhold",
      onholdreason: onholdReason,
      solution: "",
      
    };

   

    const updateResponse = await axios.put(
      `https://${SERVICENOW_CONFIG.instance}/api/now/table/x_1745159_growhive_contactandsupport/${sys_id}`,
      updateData,
      {
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

   

    if (updateResponse.status === 200) {
     
      const verifyResponse = await axios.get(
        `https://${SERVICENOW_CONFIG.instance}/api/now/table/x_1745159_growhive_contactandsupport/${sys_id}?sysparm_fields=sys_id,number,status,state,incident_state,onholdreason`,
        {
          auth: {
            username: SERVICENOW_CONFIG.username,
            password: SERVICENOW_CONFIG.password,
          },
          headers: { "Content-Type": "application/json" },
        }
      );

      const updatedRecord = verifyResponse.data.result;

      res.status(200).json({
        success: true,
        message: "GrowHive issue status updated to On Hold successfully",
        data: {
          sys_id: sys_id,
          issueNumber: currentIssue.number,
          previousStatus: currentIssue.status || currentIssue.state,
          newStatus:
            updatedRecord.status ||
            updatedRecord.state ||
            updatedRecord.incident_state,
          onholdReason: onholdReason,
          updatedRecord: updatedRecord,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update GrowHive issue status",
        statusCode: updateResponse.status,
      });
    }
  } catch (error) {
    console.error(
      "Error rejecting GrowHive issue:",
      error.response?.data || error.message
    );

   
    if (error.response?.data?.error) {
      console.error("ServiceNow Error Details:", error.response.data.error);
    }

    res.status(500).json({
      success: false,
      message: "Failed to update GrowHive issue status",
      error: error.response?.data || error.message,
      details: error.response?.data?.error || null,
    });
  }
};

exports.fetchKbCategories = async (req, res) => {
  try {
    const auth =
      "Basic " +
      Buffer.from(
        `${SERVICENOW_CONFIG.username}:${SERVICENOW_CONFIG.password}`
      ).toString("base64");

    const knowledgeBaseSysId = "9f428c8f832eaa101c27e270ceaad333"; // GrowHive sys_id
    const url = `https://${SERVICENOW_CONFIG.instance}/api/now/table/kb_knowledge?sysparm_query=kb_knowledge_base=${knowledgeBaseSysId}^workflow_state=published&sysparm_fields=kb_category`;

    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    });

    const articles = response.data.result;

 
    const categorySet = new Set();
    const categoryIds = [];

    for (let article of articles) {
      const category = article.kb_category;
      if (category && category.value && !categorySet.has(category.value)) {
        categorySet.add(category.value);
        categoryIds.push(category.value);
      }
    }

    if (categoryIds.length === 0) {
      return res.json([]); // No categories found
    }

    // Fetch category labels
    const labelQuery = categoryIds.map((id) => `sys_id=${id}`).join("^OR");
    const categoryUrl = `https://${SERVICENOW_CONFIG.instance}/api/now/table/kb_category?sysparm_query=${labelQuery}&sysparm_fields=label,sys_id`;

    const categoryResponse = await axios.get(categoryUrl, {
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    });

    const categories = categoryResponse.data.result;

    // Return to frontend
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

exports.getKnowledgeArticles = async (req, res) => {
  try {
    const response = await axios.get(
      "https://dev210958.service-now.com/api/now/table/kb_knowledge",
      {
        params: {
          sysparm_query:
            "kb_knowledge_base=9f428c8f832eaa101c27e270ceaad333^workflow_state=published",
          sysparm_display_value: true, // 👈 display human-readable category & author names
        },
        auth: {
          username: SERVICENOW_CONFIG.username,
          password: SERVICENOW_CONFIG.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const articles = response.data.result.map((item) => ({
      id: item.number,
      title: item.short_description,
      content: item.meta_description || item.article_body || "No content",
      category: item.kb_category?.display_value || "No Category",
      author_name: item.author?.display_value || "Unknown Author",
      rating:item.rating,
      views:item.sys_view_count,

    }));

    res.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error.message);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
};
