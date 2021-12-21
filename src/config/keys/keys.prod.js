export default {
  // same as cookieMaxAge
  jwtTokenExpiry: "30 days",
  cookie: {
    cookieName: "access_token",
    // 30 days
    cookieMaxAge: 1000 * 60 * 60 * 24 * 30,
  },
};