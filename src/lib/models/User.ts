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
    /** Set for email/password accounts; omitted for Google-only users. */
    passwordHash: { type: String, required: false, select: false },
    /** Google account subject (`sub` from userinfo). */
    googleId: { type: String, sparse: true, unique: true, trim: true, maxlength: 128 },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User ?? mongoose.model("User", userSchema);
