import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  // in cents
  price: {
    type: Number,
    required: true,
  },
  shortDescription: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  // for product list page
  image: {
    type: String,
    default: "",
  },
});

// sets "createdAt" and "updatedAt" fields
ProductSchema.set("timestamps", true);

export default mongoose.model("Product", ProductSchema);