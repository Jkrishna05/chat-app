import cloudinary from "../config/cloudnary.js";
import messageModel from "../models/messageModel.js";
import userModel from "../models/userModel.js";
import { io, onlineUsers } from "../server.js";

// Get information for sidebar
let getuserforsidebar = async (req, res) => {
  try {
    let filterusers = await userModel.find({ _id: { $ne: req.userId } }).lean();

    let unseenmsg = {};
    let promises = filterusers.map(async (user) => {
      let messages = await messageModel.find({
        senderId: user._id,
        reciverId: req.userId,
        seen: false
      });
      if (messages.length > 0) {
        unseenmsg[user._id] = messages.length;
      }
    });

    await Promise.all(promises);

    res.json({ success: true, users: filterusers, unseenmsg });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all messages for selected user
let loadmessage = async (req, res) => {
  try {
    let myid = req.userId;
    let { id: selecteduserId } = req.params;

    let message = await messageModel.find({
      $or: [
        { senderId: selecteduserId, reciverId: myid },
        { senderId: myid, reciverId: selecteduserId }
      ]
    }).sort({ createdAt: 1 }); // keep messages in order

    // find unseen messages sent by selected user to me
    const unseenMessages = await messageModel.find({ senderId: selecteduserId, reciverId: myid, seen: false });
    if (unseenMessages.length > 0) {
      const ids = unseenMessages.map(m => m._id);
      await messageModel.updateMany({ _id: { $in: ids } }, { seen: true });
      // notify each sender socket that their message was seen
      const senderSocketId = onlineUsers[selecteduserId];
      if (senderSocketId) {
        ids.forEach(id => {
          io.to(senderSocketId).emit('messageSeen', { messageId: id, seenBy: myid });
        });
      }
    }

    res.json({ success: true, message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark individual message seen
let messageseen = async (req, res) => {
  try {
    let { id } = req.params;
    const msg = await messageModel.findByIdAndUpdate(id, { seen: true }, { new: true });
    // emit to sender that this message was seen
    if (msg) {
      const senderId = msg.senderId.toString();
      const senderSocket = onlineUsers[senderId];
      if (senderSocket) {
        io.to(senderSocket).emit('messageSeen', { messageId: msg._id, seenBy: req.userId });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send message
let sendmessage = async (req, res) => {
  try {
    let { text, image } = req.body;
    let senderId = req.userId;
    let reciverId = req.params.id;

    // Verify receiver exists
    let receiver = await userModel.findById(reciverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    let imageUrl;
    if (image) {
      let uploadimg = await cloudinary.uploader.upload(image);
      imageUrl = uploadimg.secure_url;
    }
    console.log('req.userId:', req.userId);
console.log('req.body:', req.body);
console.log('req.params:', req.params);

    let newmessage = await messageModel.create({
      senderId,
      reciverId,
      text,
      image: imageUrl
    });

    // Emit to receiver
    let reciverSocketId = onlineUsers[reciverId];
    if (reciverSocketId) {
      io.to(reciverSocketId).emit("newMessage", newmessage);
    }

    res.json({ success: true, message: newmessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { messageseen, loadmessage, getuserforsidebar, sendmessage };
