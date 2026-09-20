import { isBlacklisted } from "../utils/blacklist.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided." });
  }

  const token = authorization.slice("Bearer ".length);

  if (!token || isBlacklisted(token)) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
