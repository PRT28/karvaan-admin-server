import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

export const createToken = (payload: IUser) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '100y' });
};

