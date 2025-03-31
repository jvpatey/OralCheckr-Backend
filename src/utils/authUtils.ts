import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/userModel";

/* -- Utility functions used in authentication controllers -- */

/* -- Generate a JWT token for the user -- */
export const generateAccessToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

/* -- Generate a JWT token for the guest user -- */
export const generateGuestAccessToken = (guestUserId: number): string => {
  return jwt.sign(
    { userId: guestUserId, role: "guest" },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d",
    }
  );
};

/* -- Password Validation Function -- */
export const validatePassword = (password: string): string | null => {
  const requirements = [
    { regex: /.{8,}/, message: "Password must be at least 8 characters" },
    { regex: /[A-Z]/, message: "Must contain at least one uppercase letter" },
    { regex: /[a-z]/, message: "Must contain at least one lowercase letter" },
    { regex: /\d/, message: "Must contain at least one digit" },
    {
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      message: "Must contain at least one special character",
    },
  ];

  // Check if the password meets all the requirements
  const errors = requirements
    .filter((req) => !req.regex.test(password))
    .map((req) => req.message);
  return errors.length > 0 ? errors.join(", ") : null;
};

/* -- Guest User Creation -- */
export const createGuestUser = async (): Promise<User> => {
  console.log("Creating guest user...");

  // Create a unique guest email
  const guestEmail = `guest_${Date.now()}_${Math.floor(
    Math.random() * 10000
  )}@guest.com`;

  // Create and hash a default guest password
  const guestPassword = "guestPassword!";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(guestPassword, salt);

  // Create the new guest user with the generated email and password
  const guestUser = await User.create({
    firstName: "Guest",
    lastName: "User",
    email: guestEmail,
    password: hashedPassword,
    isGuest: true,
  });
  console.log(`Guest user created: ${guestUser.email}`);
  return guestUser;
};

/* -- Cookie Configuration Function -- */
export const getCookieConfig = (maxAge?: number) => {
  // Check if the environment is production
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  // Base configuration for all environments
  const config: any = {
    httpOnly: true,
    secure: isProduction, // Only set secure in production
    path: "/",
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
  };

  // Test environment configuration (local development)
  if (isTest) {
    config.secure = false;
    config.sameSite = "lax";
  }

  // Development environment configuration (local development)
  if (!isProduction && !isTest) {
    config.secure = false;
    config.sameSite = "lax";
  }

  // Production environment configuration (production)
  if (isProduction && process.env.COOKIE_DOMAIN) {
    config.domain = process.env.COOKIE_DOMAIN;
  }

  // Always ensure secure is true if sameSite is 'none'
  if (config.sameSite === "none") {
    config.secure = true;
  }

  // Add maxAge if provided
  if (maxAge) {
    config.maxAge = maxAge;
  }

  console.log(`Cookie config: ${JSON.stringify(config)}`);
  return config;
};
