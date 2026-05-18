import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import cloudinary from "../config/cloudnary.js";
import Token from "../models/tokenModel.js";

// helper to generate JWT
const token = (id, expiresIn) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// 🔑 Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const accessToken = token(user._id, "15m");
    const refreshToken = token(user._id, "7d");

  await Token.create({
    userId: user._id,
    token: refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });


    res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
    res.json({
      success: true,
      message: "Login successful",
      user: { _id: user._id, email: user.email, fullname: user.fullname },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📝 Signup
export const signupUser = async (req, res) => {
  try {
    const { fullname, email, password, bio } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email format" });
    }

    if (!validator.isStrongPassword(password)) {
      return res.json({ success: false, message: "Enter a stronger password" });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      fullname,
      email,
      password: hashpassword,
      bio: bio || "",
    });

    const accessToken = token(newUser._id, "15m");
    const refreshToken = token(newUser._id, "7d");
   const user = await userModel.findOne({ email });
  await Token.create({
    userId: user._id,
    token: refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

    res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      user: { _id: newUser._id, email: newUser.email, fullname: newUser.fullname },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Check auth
export const checkAuth = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🛠 Update profile
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullname, bio } = req.body;
    let updateduser;

    if (!profilePic) {
      updateduser = await userModel.findByIdAndUpdate(
        req.userId,
        { fullname, bio },
        { new: true }
      ).select("-password");
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updateduser = await userModel.findByIdAndUpdate(
        req.userId,
        { fullname, bio, profilePic: upload.secure_url },
        { new: true }
      ).select("-password");
    }

    res.json({ success: true, message: "Profile updated successfully", user: updateduser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
