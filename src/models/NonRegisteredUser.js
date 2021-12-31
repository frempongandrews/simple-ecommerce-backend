import mongoose from "mongoose";

const NonRegisteredUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  firstName: {
    type: String,
    default: "",
    required: true,
  },
  lastName: {
    type: String,
    required: true,
    default: "",
  },
  phoneNumber: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
    required: true,
    default: "",
  },
  city: {
    type: String,
    required: true,
    default: "",
  },
  country: {
    type: String,
    required: true,
    default: "",
  },
  postcode: {
    type: String,
    required: true,
    default: "",
  },
  orders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  },
});

// sets "createdAt" and "updatedAt" fields
NonRegisteredUserSchema.set("timestamps", true);

export default mongoose.model("NonRegisteredUser", NonRegisteredUserSchema);