import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateVerificationCode,
  hashPassword,
  sendEmailUponRegistration,
  sendVerificationCode,
} from "../utils/utils.auth.js";
import keys from "../config/keys/keys.js";

export const registerUser = async (req, res) => {
  // console.log("******registerUser - Req.body", req.body);
  const errors = {};
  let { email, password, confirmPassword } = req.body;
  email = email.toLowerCase().trim();
  password = password.trim();
  confirmPassword = confirmPassword.trim();
  
  if (email.length > 3) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.email = "Email already registered";
    }
  }
  
  if (!email) {
    errors.email = "Email cannot be blank";
  }
  
  if (password.length < 6) {
    errors.password = "Password cannot be less than 6 characters";
  }
  
  if (!password) {
    errors.password = "Password cannot be blank";
  }
  
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm password";
  }
  
  if (password !== confirmPassword) {
    errors.password = "Passwords do not match";
  }
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }
  
  sendEmailUponRegistration({ to: email })
    .then(async (emailRes) => {
      // console.log("*********EmailRes", emailRes);
      if (emailRes.messageId) {
        const { verificationCode } = emailRes;
        // create user
        const hashedPassword = hashPassword(password);
        const newUser = new User({
          email,
          password: hashedPassword,
          emailVerificationCode: verificationCode,
        });
        const user = await newUser.save();
        //
        return res.status(200).json({
          message: "User successfully registered - please check your email to verify your email",
          user: user.getUserSummary(),
        });
      }
      // error sending email
      return res.status(400).json({
        message: `Error while registering user - Please check if email is valid`,
      });
    })
    .catch((err) => {
      // console.log("*******Error registering user");
      return res.status(400).json({
        message: `${err.message}`,
      });
    });
};

export const verifyRegisteredUser = async (req, res) => {
  // console.log("*******Req.body", req.body);
  let { email, verificationCode } = req.body;
  email = email.trim();
  verificationCode = verificationCode.trim();
  
  const errors = {};
  
  if (!email) {
    errors.email = "Email cannot be blank";
  }
  
  if (!verificationCode) {
    errors.verificationCode = "verification code cannot be blank";
  }
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }
  
  try {
    const user = await User.findOne({ email });
    if (user) {
      if (!user.isVerified && user.emailVerificationCode === verificationCode) {
        user.isVerified = true;
        user.emailVerificationCode = "";
        await user.save();
        return res.status(200).json({
          message: `User ${user.email} successfully verified - you can now login`,
        });
      }
      
      if (user.isVerified) {
        return res.status(200).json({
          message: `User ${user.email} already verified - you can login`,
        });
      }
    }
    return res.status(400).json({
      message: "wrong code or user not found",
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error verifying email. Please try again",
    });
  }
};

export const sendEmailVerificationCode = async (req, res) => {
  let { email } = req.body;
  email = email.trim();
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }
    if (user.isVerified) {
      return res.status(400).json({
        message: `User - ${email} is already verified`,
      });
    }
    // send email to not verified user
    if (!user.isVerified) {
      //
      const to = email;
      const verificationCode = generateVerificationCode();
      try {
        const emailRes = await sendVerificationCode({ to, verificationCode });
        // email sent
        if (emailRes.messageId) {
          user.emailVerificationCode = verificationCode;
          await user.save();
          return res.status(200).json({
            message: `Email sent successfully to ${email} - Please check your email`,
          });
        }
        // error sending email
        return res.status(400).json({
          message: `Error while sending email to ${email} - Please check if email is valid`,
        });
      } catch (error) {
        // console.log("*******Error sending verification code");
        return res.status(400).json({
          message: `${error.message}`,
        });
      }
    }
  } catch (err) {
    // console.log("*******Error getting user while trying to send verification code");
    return res.status(400).json({
      message: `${err.message}`,
    });
  }
};

export const loginUser = async (req, res) => {
  // console.log("******loginUser - Req.body", req.body);
  let { email, password } = req.body;
  email = email.toLowerCase().trim();
  password = password.trim();
  
  const errors = {};
  
  if (!email) {
    errors.email = "Email cannot be blank";
  }
  
  if (!password) {
    errors.password = "Password cannot be blank";
  }
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }
  
  try {
    const existingUser = await User.findOne({
      email,
    });
    // check password
    if (existingUser) {
      const passwordMatch = existingUser.isPasswordMatch(password);
      if (passwordMatch) {
        // check if verified email
        if (existingUser.isVerified) {
          const jwtToken = existingUser.generateJWT();
          const isDev = process.env.NODE_ENV === "development";
          console.log("**********Setting cookie");
          res.cookie(keys.cookie.cookieName, jwtToken, { domain: isDev? process.env.DEV_CLIENT_APP_URL : process.env.PROD_CLIENT_APP_URL, httpOnly: true, maxAge: keys.cookie.cookieMaxAge, sameSite: "none", secure: true });
          return res.json({
            message: "Successfully logged in",
            user: existingUser.getUserSummary(),
          });
        }
        return res.status(400).json({
          message: `${email} - Please verify your email before you can login`,
        });
      }
      return res.status(400).json({
        message: "Wrong email or password",
      });
    }
    return res.status(400).json({
      email: "Email not registered",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Error logging in - Please try again",
    });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie(keys.cookie.cookieName);
  return res.json({
    message: "Successful logout",
  });
};

export const getCurrentUser = async (req, res) => {
  const token = req.cookies[keys.cookie.cookieName];
  // console.log("*******Token", token);
  if (!token) {
    return res.status(200).json({
      user: null,
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
    // get user if token not expired
    const { userId } = decoded;
    const user = await User.findById(userId);
    if (user.isVerified) {
      return res.status(200).json({
        user: user.getUserSummary(),
      });
    }
    return res.status(200).json({
      user: null,
    });
  } catch (err) {
    // if token is expired or malformed, this block will run
    // generally if token is expired, it is removed from browser
    // so it is not sent to the server
    return res.status(200).json({
      user: null,
    });
  }
};
