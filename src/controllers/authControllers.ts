import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";

const generateAccessToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

// Password validation function
const validatePassword = (password: string): string | null => {
  const requirements = [
    { regex: /.{8,}/, message: "Password must be at least 8 characters" },
    {
      regex: /[A-Z]/,
      message: "Password must contain at least one uppercase letter",
    },
    {
      regex: /[a-z]/,
      message: "Password must contain at least one lowercase letter",
    },
    { regex: /\d/, message: "Password must contain at least one digit" },
    {
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      message: "Password must contain at least one special character",
    },
  ];

  const errors = requirements
    .filter((req) => !req.regex.test(password))
    .map((req) => req.message);

  return errors.length > 0 ? errors.join(", ") : null;
};

// Register a user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "All fields are required!" });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: newUser.userId,
      accessToken: generateAccessToken(newUser.userId),
    });
  } catch (error: any) {
    next(error);
  }
};

// User login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email or Password cannot be empty!" });
    return;
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.status(200).json({
      userId: user.userId,
      email: user.email,
      accessToken: generateAccessToken(user.userId),
    });
  } catch (error: any) {
    next(error);
  }
};
