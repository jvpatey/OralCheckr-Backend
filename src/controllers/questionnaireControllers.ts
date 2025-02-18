import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import User from "../models/userModel";

interface DecodedToken {
  userId: number;
}

// Save or update the final questionnaire response (submission)
export const saveResponse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract JWT token from cookies
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const userId = decoded.userId;

    // Get responses and totalScore from request body
    const { responses, totalScore } = req.body;

    if (!responses || totalScore === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Ensure the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if a response already exists for this user
    const existingResponse = await QuestionnaireResponse.findOne({
      where: { userId },
    });

    if (existingResponse) {
      // Update existing response
      await existingResponse.update({ responses, totalScore });
      res.status(200).json({
        message: "Questionnaire response updated",
        response: existingResponse,
      });
    } else {
      // Create new response
      const newResponse = await QuestionnaireResponse.create({
        userId,
        responses,
        totalScore,
      });
      res.status(201).json({
        message: "Questionnaire response saved",
        response: newResponse,
      });
    }
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get final questionnaire response by user ID
export const getResponseByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract JWT token from cookies
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const userId = decoded.userId;

    // Fetch the user's response
    const responseRecord = await QuestionnaireResponse.findOne({
      where: { userId },
    });
    if (!responseRecord) {
      res.status(404).json({ error: "No response found for this user" });
      return;
    }

    res.status(200).json(responseRecord);
  } catch (error) {
    console.error("Error fetching user response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------
// New Endpoints for Progress
// ---------------------

// Save or update questionnaire progress (partial responses and current question)
export const updateProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return;
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const userId = decoded.userId;

    const { responses, currentQuestion } = req.body;

    if (responses === undefined || currentQuestion === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Find existing progress record for this user
    const existingResponse = await QuestionnaireResponse.findOne({
      where: { userId },
    });

    if (existingResponse) {
      // Update progress fields. This assumes your model includes a "currentQuestion" field.
      await existingResponse.update({ responses, currentQuestion });
      res.status(200).json({
        message: "Questionnaire progress updated",
        progress: { responses, currentQuestion },
      });
    } else {
      // Create a new record if none exists yet.
      const newResponse = await QuestionnaireResponse.create({
        userId,
        responses,
        currentQuestion,
      });
      res.status(201).json({
        message: "Questionnaire progress saved",
        progress: { responses, currentQuestion },
      });
    }
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Retrieve questionnaire progress for the authenticated user
export const getProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return;
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const userId = decoded.userId;

    // Fetch the user's progress record
    const responseRecord = await QuestionnaireResponse.findOne({
      where: { userId },
    });
    if (!responseRecord) {
      res.status(404).json({ error: "No progress found for this user" });
      return;
    }

    res.status(200).json({
      responses: responseRecord.responses,
      currentQuestion: responseRecord.currentQuestion,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
