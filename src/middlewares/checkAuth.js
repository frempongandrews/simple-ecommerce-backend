import jwt from "jsonwebtoken";
import keys from "../config/keys/keys.js";
import User from "../models/User.js";

export const checkAuth = async (req, res, next) => {
  const token = req.cookies[keys.cookie.cookieName];
  if (!token) {
    return res.status(401).json({
      message: "Not authorised",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
    console.log(decoded);
    // get user if token not expired
    const { userId } = decoded;
    req.user = await User.findById(userId);
    return next();
  } catch (err) {
    console.log("Jwt Error", err.message);
    return res.status(401).json({
      message: "Not authorised",
    });
  }
};

export const isUserLoggedIn = async (req, res, next) => {
  const token = req.cookies[keys.cookie.cookieName];
  if (!token) {
    // user in not logged in
    req.user = null;
    next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
    console.log(decoded);
    // get user if token not expired
    const { userId } = decoded;
    req.user = await User.findById(userId);
    return next();
  } catch (err) {
    // user in not logged in
    req.user = null;
    next();
  }
};