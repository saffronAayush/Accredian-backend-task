import { ErrorHandler } from "../utils/utility.js";
import { prisma } from "../prismaClient.js";
import jwt from "jsonwebtoken";
import { TryCatch } from "./error.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const isUserLoggedIn = TryCatch(async (req, res, next) => {
  let token = req.query.token;
  console.log("toke ", token);
  if (!token) {
    return next(new ErrorHandler(401, "Unauthorized: Token not provided"));
  }
  const decoded = jwt.verify(token, JWT_SECRET);
  const userId = decoded.userId;
  console.log("deconded ", decoded);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
    },
  });

  if (!user) return next(new ErrorHandler(404, "User not found"));

  req.user = userId;
  console.log("User is logged in");
  next();
});
