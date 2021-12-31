import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    default: 0,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
});

// sets "createdAt" and "updatedAt" fields
CartItemSchema.set("timestamps", true);

export default mongoose.model("CartItem", CartItemSchema);