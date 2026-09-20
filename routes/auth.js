import express from "express";
import bcrypt from "bcryptjs";

import { signToken } from "../utils/jwt.js";
import { findByUsername } from "../utils/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  // 1. get username and password from req.body
  const { username, password } = req.body ?? {};

  // 2. if either is missing → 400
  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password is required",
    });
  }
  // 3. find user by username
  const user = findByUsername(username);

  // 4. if user doesn't exist → 401
  if (!user) {
    return res.status(401).json({
      error: "Username does not exist",
    });
  }
  // 5. bcrypt.compare(...)
  const match = await bcrypt.compare(password, user.passwordHash)

  // 6. if password doesn't match → 401
  if (!match) {
    return res.status(401).json({
        error: "Password incorrect"
    })
  }

  // 7. create token
  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role
  })

  // 8. return 200 + token

  return res.status(200).json({
    token
  })
});

export default router