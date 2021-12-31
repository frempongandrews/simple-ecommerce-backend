import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  items: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "CartItem",
  },
  // refers to _id of registered user (User model) or non registered user (NonRegisteredUser model)
  customerId: {
    type: String,
    default: "",
  },
  // customer firstName + lastName + email + phoneNumber inserted when checking out the order
  customerDetails: {
    type: String,
    default: "",
  },
  // if paid or not
  isCompleted: {
    type: Boolean,
    default: false,
  },
  // shipping address
  // concat address + city + postcode
  shippingAddress: {
    type: String,
    default: "",
  },
});

// sets "createdAt" and "updatedAt" fields
OrderSchema.set("timestamps", true);

export default mongoose.model("Order", OrderSchema);