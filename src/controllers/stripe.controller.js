import stripe from "stripe";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import CartItem from "../models/CartItem.js";
import User from "../models/User.js";
import NonRegisteredUser from "../models/NonRegisteredUser.js";

// env variables
// for some reason STRIPE_PRIVATE_KEY in .env does not load without
// the line below
dotenv.config();

const stripeAPIKEY = process.env.STRIPE_PRIVATE_KEY;
// console.log("**********stripeAPIKEY in stripe controller", stripeAPIKEY);
const stripeAPI = stripe(stripeAPIKEY);

// @param on req.body =>
// required: firstName, lastName, email, address, country, city, postcode, cart
export const createStripeCheckout = async (req, res) => {
  // console.log("**********stripeAPIKEY", stripeAPIKEY);
  // console.log("**********createStripeCheckout ran - req.body.cart", req.body.cart);
  const cartArr = req.body?.cart || [];
  if (cartArr.length === 0) {
    return res.status(400).json({
      message: "No items found",
    });
  }
  
  // @params required: firstName, lastName, email, address, country, city, postcode
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    addressLine1,
    addressLine2,
    city,
    postcode,
  } = req.body;
  
  const country = "UK";
  
  const errors = {};
  if (!firstName) {
    errors.firstName = "First name cannot be blank";
  }
  if (!lastName) {
    errors.lastName = "Last name cannot be blank";
  }
  if (!email) {
    errors.email = "Email cannot be blank";
  }
  if (!addressLine1) {
    errors.address = "Address cannot be blank";
  }
  if (!country) {
    errors.coutry = "Country cannot be blank";
  }
  if (!city) {
    errors.city = "City cannot be blank";
  }
  if (!postcode) {
    errors.postcode = "Postcode cannot be blank";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }
  try {
    // get products from db to get price
    const cartArrWithProductDetails = [];
  
    for (const cartItem of cartArr) {
      const product = await Product.findById(cartItem.product._id);
      cartArrWithProductDetails.push({
        quantity: cartItem.quantity,
        product,
      });
    }
    
    // add user info (address, postcode etc) only on the order not on the user
    const orderItems = [];
  
    for (const cartObj of cartArrWithProductDetails) {
      const newCartItem = new CartItem({
        quantity: cartObj.quantity,
        product: cartObj.product,
      });
      const savedCartItem = await newCartItem.save();
      orderItems.push(savedCartItem);
    }
    
    let newOrder;
    // if checkout by registered user and logged in user
    if (req.user) {
      const userIdString = String(req.user._id);
      newOrder = new Order({
        isCompleted: false,
        customerId: userIdString,
        items: [...orderItems],
        customerDetails: `${firstName} ${lastName} - phone: ${phoneNumber || ""} - email: ${email}`,
        shippingAddress: `${addressLine1} ${addressLine2} ${city} ${postcode} ${country}`,
      });
      const savedNewOrder = await newOrder.save();
      // console.log("**********savedNewOrder", savedNewOrder);
      newOrder = savedNewOrder;
      await User.findByIdAndUpdate(req.user._id, { orders: [savedNewOrder, ...req.user.orders] });
    }
    
    // if checkout by non registered user/non logged in user
    let nonRegisteredUser;
    if (!req.user) {
      // check if email has already ordered before
      const existingNonRegisteredUser = await NonRegisteredUser.findOne({ email });
      // if first order by this email
      if (!existingNonRegisteredUser) {
        nonRegisteredUser = new NonRegisteredUser({
          email,
        });
        const savedNewNonRegisteredUser = await nonRegisteredUser.save();
        newOrder = new Order({
          isCompleted: false,
          customerId: savedNewNonRegisteredUser._id,
          items: [...orderItems],
          customerDetails: `${firstName} ${lastName} - phone: ${phoneNumber || ""} - email: ${email}`,
          shippingAddress: `${addressLine1} ${addressLine2} ${city} ${postcode} ${country}`,
        });
        const savedNewOrder = await newOrder.save();
        // console.log("**********savedNewOrder", savedNewOrder);
        newOrder = savedNewOrder;
        nonRegisteredUser = savedNewNonRegisteredUser;
        await NonRegisteredUser.findByIdAndUpdate(savedNewNonRegisteredUser._id, { orders: [savedNewOrder, ...savedNewNonRegisteredUser.orders] })
      } else {
        nonRegisteredUser = existingNonRegisteredUser;
        newOrder = new Order({
          isCompleted: false,
          customerId: existingNonRegisteredUser._id,
          items: [...orderItems],
          customerDetails: `${firstName} ${lastName} - phone: ${phoneNumber || ""} - email: ${email}`,
          shippingAddress: `${addressLine1} ${addressLine2} ${city} ${postcode} ${country}`,
        });
        const savedNewOrder = await newOrder.save();
        // console.log("**********savedNewOrder", savedNewOrder);
        newOrder = savedNewOrder;
        await NonRegisteredUser.findByIdAndUpdate(existingNonRegisteredUser._id, { orders: [savedNewOrder, ...existingNonRegisteredUser.orders] })
      }
    }
    const isDev = process.env.NODE_ENV === "development";
    
    const session = await stripeAPI.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: isDev ? `${process.env.DEV_CLIENT_APP_URL}/payment-completed?session_id={{CHECKOUT_SESSION_ID}}` : `${process.env.PROD_CLIENT_APP_URL}/payment-completed?session_id={{CHECKOUT_SESSION_ID}}`,
      cancel_url: isDev ? `${process.env.DEV_CLIENT_APP_URL}/checkout` : `${process.env.PROD_CLIENT_APP_URL}/checkout`,
      line_items: cartArrWithProductDetails.map((cartItem) => {
        return {
          price_data: {
            currency: "gbp",
            product_data: {
              name: cartItem.product.title,
              images: [cartItem.product.publicImage],
            },
            // in cents
            unit_amount: cartItem.product.price,
          },
          quantity: cartItem.quantity,
        };
      }),
      customer_email: email,
      // details about my user
      metadata: {
        info: "details related to my custom db",
        userId: req.user ? String(req.user._id) : String(nonRegisteredUser._id),
        orderId: String(newOrder._id),
      },
    });
    return res.status(200).json({
      url: session.url,
    });
  } catch (err) {
    return res.status(400).json({
      message: `Error during payment - ${err.message}`,
    });
  }
};

export const getStripeSessionIdInfo = async (req, res) => {
  const stripeSessionId = req.params.id || "";
  // console.log("*******stripe SessionId", stripeSessionId);
  try {
    const session = await stripeAPI.checkout.sessions.retrieve(stripeSessionId);
    // purchase completed
    const { orderId } = session.metadata;
    
    if (session.payment_status === "paid") {
      const orderUpdated = await Order.findByIdAndUpdate(orderId, { isCompleted: true });
      console.log("*********orderUpdated", orderUpdated);
    }
    const order = await Order.findById(orderId)
      .populate({
        path: "items",
        model: "CartItem",
        populate: {
          path: "product",
          model: "Product",
        },
      });
    return res.status(200).json({
      order,
    });
  } catch (err) {
    return res.status(400).json({
      message: `Error getting order details`,
    });
  }
};