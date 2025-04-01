import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel";
import { generateAccessToken, getCookieConfig } from "../utils/authUtils";
import { Op } from "sequelize";

/* -- Google OAuth Controller -- */

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* -- Login with Google OAuth-- */
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Google login request received:", {
      body: req.body,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        contentType: req.headers["content-type"],
      },
    });

    // Get the token from the request body
    const { token, credential } = req.body;
    const authToken = token || credential;

    // Check if the token is provided
    if (!authToken) {
      console.log("Google login failed: No token or credential provided");
      res.status(400).json({ error: "Token or credential is required" });
      return;
    }

    console.log("Attempting to verify Google token");

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: authToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Get the payload from the ticket
    const payload = ticket.getPayload();

    // Check if the payload is valid
    if (!payload) {
      console.log("Google login failed: Invalid token payload");
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    console.log("Google token verified successfully:", {
      sub: payload.sub,
      email: payload.email,
    });

    // Check if user exists by googleId or email
    let user = await User.findOne({
      where: {
        [Op.or]: [{ googleId: payload.sub }, { email: payload.email }],
      },
    });

    if (user) {
      // Update existing user if needed
      if (!user.googleId) {
        await user.update({
          googleId: payload.sub,
          avatar: payload.picture || user.avatar,
        });
      }
    } else {
      // Create new user if doesn't exist
      user = await User.create({
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        email: payload.email || "",
        password: "", // Empty password for Google users
        googleId: payload.sub,
        avatar: payload.picture,
        isGuest: false,
      });
    }

    // Generate access token and store it in an HTTP-only cookie
    const accessToken = generateAccessToken(user.userId);
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    );

    // Send a success response to the client
    res.status(200).json({
      message: "Google login successful",
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        isGuest: user.isGuest,
      },
    });
  } catch (error: any) {
    console.error("Google login error details:", {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
};
