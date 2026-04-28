import { model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ["USER", "ORGANIZATION", "HOSPITAL"], required: true },
  },
  { timestamps: true },
);

export const UserModel = model("User", UserSchema);
