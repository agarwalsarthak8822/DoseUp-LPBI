import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User ?? mongoose.model("User", userSchema);
