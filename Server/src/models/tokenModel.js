// models/Token.js
import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  token: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, expires: "7d" } // auto delete after 7 days
});
let Token= mongoose.models.Token || mongoose.model("Token", tokenSchema);
export default Token;
