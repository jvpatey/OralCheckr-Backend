import jwt from "jsonwebtoken";
import userSchema from "../schemas/userSchema.ts";
import bcrypt from "bcryptjs";
import {
  createTable,
  checkRecordExists,
  insertRecord,
} from "../utils/sqlFunctions.ts";

export interface User extends Record<string, unknown> {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const generateAccessToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

// Password validation
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
export const register = async (req: any, res: any) => {
  const { email, password, firstName, lastName } = req.body;

  // Validation for input fields
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "All fields are required!" });
    return;
  }

  // Validate the password using the validation function
  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a user object - userID auto generated
    const user: User = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
    };

    // Ensure the table exists
    await createTable(userSchema);

    // Check if the email already exists
    const userAlreadyExists = await checkRecordExists("users", "email", email);
    if (userAlreadyExists) {
      res.status(409).json({ error: "Email already exists" });
    } else {
      // Insert the user into the database and retrieve the result
      const result = await insertRecord("users", user);
      const newUserId = (result as { insertId: number }).insertId;

      res.status(201).json({
        message: "User created successfully!",
        userId: newUserId,
        access_token: generateAccessToken(newUserId),
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// User login
export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res
      .status(400)
      .json({ error: "Email or Password fields cannot be empty!" });
    return;
  }

  try {
    const existingUser = (await checkRecordExists(
      "users",
      "email",
      email
    )) as User | null;

    if (existingUser && existingUser.password) {
      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (passwordMatch && existingUser.userId !== undefined) {
        res.status(200).json({
          userId: existingUser.userId,
          email: existingUser.email,
          access_token: generateAccessToken(existingUser.userId),
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
