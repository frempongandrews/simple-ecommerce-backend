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
  },
  lastName: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  postcode: {
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
NonRegisteredUserSchema.set("timestamps", true);

export default mongoose.model("NonRegisteredUser", NonRegisteredUserSchema);