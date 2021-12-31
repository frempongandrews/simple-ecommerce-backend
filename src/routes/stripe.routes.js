import express from "express";
import { createStripeCheckout, getStripeSessionIdInfo } from "../controllers/stripe.controller.js";
import { isUserLoggedIn } from "../middlewares/checkAuth.js";

const router = express.Router();

router.post("/stripe-checkout", isUserLoggedIn, createStripeCheckout);

router.get("/stripe-session/:id", isUserLoggedIn, getStripeSessionIdInfo);

export default router;