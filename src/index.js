import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import slugify from "slugify";
import ShortUniqueId from "short-unique-id";
import nodemailer from "nodemailer";
import User from "./models/User.js";
import Product from "./models/Product.js";
import { createSlug, generateUniqueId, products } from "./utils/index.js";

// env variables
dotenv.config();


// routes
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import { checkAuth } from "./middlewares/checkAuth.js";

console.log(process.env.NODE_ENV);
const stripeAPIKEY = process.env.STRIPE_PRIVATE_KEY;
console.log("**********stripeAPIKEY", stripeAPIKEY);
// connect to db
mongoose.connect(process.env.MONGO_DB_URI)
  .then(async () => {
    console.log("*********Connected to db");
    // todo: populate db for test
    // await User.deleteOne({ email: "test@gmail.com" });
    // await House.deleteOne({ address: "manchester" });
    //
    // const newUser = new User({
    //   email: "test@gmail.com",
    //   password: "123456",
    // });
    // await newUser.save();
    
    // todo: seed products
    // await Product.deleteMany({});
    // products.map(async (product) => {
    //   const newProduct = new Product({
    //     id: generateUniqueId(),
    //     slug: createSlug(product.title),
    //     title: product.title,
    //     price: product.price,
    //     shortDescription: product.shortDescription,
    //     description: product.description,
    //     image: product.image,
    //     publicImage: product.publicImage,
    //   });
    //
    //   await newProduct.save();
    // });
  })
  .catch((err) => {
    console.error("*********Error db", err);
  });

const PORT = 8080;
const app = express();

// todo: add client prod url
const corsWhitelist = ["http://localhost:3000", "http://localhost:3001"];

const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (corsWhitelist.indexOf(req.header("Origin")) !== -1) {
    // reflect (enable) the requested origin in the CORS response
    corsOptions = { origin: true, credentials: true };
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

// middlewares
app.use(cors(corsOptionsDelegate));
app.use(cookieParser());
// csrf

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// routes

app.get("/", (req, res) => {
  res.send({
    success: true,
  });
});

// authRoutes
app.use("/api/v1", authRoutes);
// productRoutes
app.use("/api/v1", productRoutes);
// stripe checkout
app.use("/api/v1", stripeRoutes);

app.listen(PORT, () => {
  console.log("********App started on port", PORT);
});
