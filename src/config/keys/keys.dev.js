export default {
  // same as cookieMaxAge
  jwtTokenExpiry: "30 days",
  // 60secs
  // jwtTokenExpiry: 60,
  cookie: {
    cookieName: "access_token",
    // 30 days
    cookieMaxAge: 1000 * 60 * 60 * 24 * 30,
    // 60secs
    // cookieMaxAge: 1000 * 60,
  },
};