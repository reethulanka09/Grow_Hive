const Connection = require("../models/connectionschema");

// Send connection request
exports.sendRequest = async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  // console.log("hfjhf");
  try {
    const connection = new Connection({ fromUserId, toUserId });
    await connection.save();
    res.status(201).json(connection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Accept request
exports.acceptRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await Connection.findByIdAndUpdate(
      id,
      { status: "accepted" },
      { new: true }
    );
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reject or withdraw request
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'rejected' or 'withdrawn'
  try {
    const connection = await Connection.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all connections for a user
exports.getConnections = async (req, res) => {
  const { userId } = req.params;
  try {
    const connections = await Connection.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      status: "accepted",
    }).populate("fromUserId toUserId", "name profileImageUrl education");
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get pending received requests
exports.getReceivedRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await Connection.find({
      toUserId: userId,
      status: "pending",
    }).populate("fromUserId", "name profileImageUrl education");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sent requests
exports.getSentRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await Connection.find({
      fromUserId: userId,
      status: "pending",
    }).populate("toUserId", "name profileImageUrl education");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find and delete the connection request
    const deletedRequest = await Connection.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({
      message: "Request withdrawn successfully",
      toUserId: deletedRequest.toUserId,
    });
  } catch (error) {
    res.status(500).json({ message: "Error withdrawing request" });
  }
};

//Used In Home Page for getting no of connection of user
exports.getConnectionCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const count = await Connection.countDocuments({
      status: "accepted",
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching connection count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Related To Chat

// exports.getAcceptedConnections = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     // Fetch connections where user is either fromUser or toUser AND status is 'accepted'
//     const acceptedConnections = await Connection.find({
//       status: "accepted",
//       $or: [{ fromUserId: userId }, { toUserId: userId }],
//     })
//       .populate("fromUserId", "-password -__v") // Remove sensitive fields
//       .populate("toUserId", "-password -__v");

//     // Map to return only the "other" user's info (not the logged in user)
//     const results = acceptedConnections
//       .map((conn) => {
//         // Check for missing population (null reference)
//         if (!conn.fromUserId || !conn.toUserId) {
//           console.warn(
//             "Skipping connection due to missing user reference:",
//             conn._id
//           );
//           return null;
//         }

//         const isFromUser = conn.fromUserId._id.toString() === userId;
//         const otherUser = isFromUser ? conn.toUserId : conn.fromUserId;

//         return {
//           _id: conn._id,
//           user: otherUser,
//           status: conn.status,
//           createdAt: conn.createdAt,
//         };
//       })
//       .filter(Boolean); // Remove nulls from invalid records

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching accepted connections:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// exports.getAcceptedConnections = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const connections = await Connection.find({
//       $or: [
//         { sender: userId },
//         { receiver: userId }
//       ],
//       status: "Accepted",
//     })
//     .populate("sender", "_id name")
//     .populate("receiver", "_id name");

//     const connectedUsers = connections.map((conn) =>
//       conn.sender._id.toString() === userId
//         ? conn.receiver
//         : conn.sender
//     );

//     res.json(connectedUsers); // ✅ should be an array
//   } catch (error) {
//     console.error("Error in getAcceptedConnections:", error.message);
//     res.status(500).json({ error: "Server error" });
//   }
// };
// controllers/connectionController.js

exports.getAcceptedConnections = async (req, res) => {
  try {
    const userId = req.params.userId;

    const connections = await Connection.find({
      $or: [
        { fromUserId: userId, status: "accepted" },
        { toUserId: userId, status: "accepted" },
      ],
    }).populate("fromUserId toUserId");

    const acceptedUsers = connections
      .map((conn) => {
        const from = conn.fromUserId;
        const to = conn.toUserId;

        // Ensure both are populated and valid
        if (!from || !to) return null;

        const otherUser = from._id.toString() === userId.toString() ? to : from;

        return {
          _id: otherUser?._id,
          name: otherUser?.name,
          email: otherUser?.email,
          profileImageUrl: otherUser?.profileImageUrl,
        };
      })
      .filter(Boolean); // Remove nulls

    res.status(200).json(acceptedUsers);
  } catch (error) {
    console.error("Error in getAcceptedConnections:", error);
    res.status(500).json({ message: "Server error" });
  }
};
