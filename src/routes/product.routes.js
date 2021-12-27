import express from "express";
import { getProductById, getProducts } from "../controllers/product.controllers.js";

const router = express.Router();

router.get("/products", getProducts);

router.get("/products/:id", getProductById);

export default router;