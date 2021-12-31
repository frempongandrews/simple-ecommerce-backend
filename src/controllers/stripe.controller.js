import stripe from "stripe";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import CartItem from "../models/CartItem.js";
import User from "../models/User.js";

const stripeAPI = stripe("sk_test_51KBPzUF0bPUvcJSl645vKyJp2pUu8Kh0Zrwbc28tjHqHUbmW1SKsqvNvBFQLfyF2aJ7TuFhv9GjB1bLYvxM0p7wK00hq4trB3V");

// @param on req.body =>
// required: firstName, lastName, email, address, country, city, postcode, cart
export const createStripeCheckout = async (req, res) => {
  const cartArr = req.body?.cart || [];
  if (cartArr.length === 0) {
    return res.status(400).json({
      message: "No items found",
    });
  }
  // console.log("*******cartArr", cartArr);
  // console.log("*******req.body", req.body);
  
  // required: firstName, lastName, email, address, country, city, postcode
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
    
    // todo: create new incompleted order
    // todo: add user info (address, postcode etc) only on the order not on the user
    const orderItems = [];
    // const orderItems = cartArrWithProductDetails.map(async (cartObj) => {
    //   const newCartItem = new CartItem({
    //     quantity: cartObj.quantity,
    //     product: cartObj.product,
    //   });
    //   return newCartItem;
    // });
  
    for (const cartObj of cartArrWithProductDetails) {
      const newCartItem = new CartItem({
        quantity: cartObj.quantity,
        product: cartObj.product,
      });
      const savedCartItem = await newCartItem.save();
      orderItems.push(savedCartItem);
    }
    // console.log("********orderItems", orderItems);
    
    let newOrder;
    // user is logged in
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
      await User.findByIdAndUpdate(req.user._id, { orders: [savedNewOrder, ...req.user.orders] })
    }
   
    // 61c99d593f01a29e670f316d
    // console.log("**********cartArrWithProductDetails", cartArrWithProductDetails);
    // console.log("**********orderItems", orderItems);
    
    // console.log("**********user", req.user);
    // return;
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
            unit_amount: cartItem.product.price,
          },
          quantity: cartItem.quantity,
        };
      }),
      customer_email: email,
      metadata: {
        info: "details related to my custom db",
        userId: String(req.user._id),
        orderId: String(newOrder._id),
      },
    });
    
    // console.log("*******stripe Session", session);
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
  console.log("*******stripe SessionId", stripeSessionId);
  
  try {
    const session = await stripeAPI.checkout.sessions.retrieve(stripeSessionId);
    console.log("***********Session - check metadata", session);
    // console.log("***********Is user logged in", req?.user);
    // return res.status(200).json({
    //   session,
    // });
    // purchase completed by logged in user
    if (req?.user) {
      const { orderId } = session.metadata;
      const { userId } = session.metadata;
      const customer = await User.findById(userId);
      
      if (session.payment_status === "paid") {
        const orderUpdated = await Order.findByIdAndUpdate(orderId, { isCompleted: true });
        console.log("*********orderUpdated", orderUpdated);
      }
      const order = await Order.findById(orderId).populate({
        path: "items",
        model: "CartItem",
        populate: {
          path: "product",
          model: "Product",
        },
      });
      console.log("*********Order", order);
      // console.log("*********Customer", customer);
      // console.log("*********Order items", order.items);
      return res.status(200).json({
        order,
      });
    }
  } catch (err) {
    return res.status(400).json({
      message: `Error getting order details`,
    });
  }
};