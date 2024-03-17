import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  avatarUrl: String,
  socialOnly: { type: Boolean, default: false },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 5);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
