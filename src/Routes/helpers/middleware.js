import jwt from "jsonwebtoken";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied. Token not provided." });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return res.status(403).json({ error: "Invalid token." });
  }
};

export default verifyToken;
