import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import keys from "../config/keys/keys.js";
import Product from "./Product.js";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    default: "",
  },
  firstName: {
    type: String,
    default: "",
  },
  lastName: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password should be at least 6 characters long"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/128/1946/1946429.png",
  },
  emailVerificationCode: {
    type: String,
    default: "",
  },
  orders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  },
});

// sets "createdAt" and "updatedAt" fields
UserSchema.set("timestamps", true);

UserSchema.methods.isPasswordMatch = function (plainPassword) {
  return bcrypt.compareSync(plainPassword, this.password);
};

UserSchema.methods.generateJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_TOKEN_SECRET, { expiresIn: keys.jwtTokenExpiry });
};

UserSchema.methods.getUserSummary = function () {
  // don't return the password
  return {
    username: this.username,
    email: this.email,
    isVerified: this.isVerified,
    image: this.image,
  };
};

export default mongoose.model("User", UserSchema);