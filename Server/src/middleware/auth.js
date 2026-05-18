import jwt from "jsonwebtoken";

 const auth = (req, res, next) => {
  const token = req.cookies.accessToken; // get from cookie

  if (!token) return res.status(401).json({ message: "Unauthorized login again " });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId=decoded.id;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};
export default auth;