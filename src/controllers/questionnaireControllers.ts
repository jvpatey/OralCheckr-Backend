import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

interface DecodedToken {
  userId: number;
}

/* -- Save questionaire responss on submission of questionnaire -- */
export const saveResponse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract JWT token from cookies
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      console.log("Questionnaire responses save failed: No token provided");
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
      console.log(
        "Questionnaire responses save failed: Missing required fields"
      );
      return;
    }

    // Ensure the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log("Questionnaire responses save failed: User not found");
      return;
    }

    // Check if a response already exists for this user
    const existingResponse = await QuestionnaireResponse.findOne({
      where: { userId },
    });

    if (existingResponse) {
      // Update existing response and reset currentQuestion to 1
      await existingResponse.update({
        responses,
        totalScore,
        currentQuestion: 1,
      });
      res.status(200).json({
        message: "Questionnaire response updated",
        response: existingResponse,
      });
      console.log(
        `Updated existing questionnaire response: ${existingResponse.id} for user: ${userId}`
      );
    } else {
      // Create new response and set currentQuestion to 1
      const newResponse = await QuestionnaireResponse.create({
        userId,
        responses,
        totalScore,
        currentQuestion: 1,
      });
      res.status(201).json({
        message: "Questionnaire response saved",
        response: newResponse,
      });
      console.log(
        `Created new questionnaire response: ${newResponse.id} for user: ${userId} and set current question to 1`
      );
    }
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Get questionnaire responses by user ID -- */
export const getResponseByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract JWT token from cookies
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      console.log("Questionnaire responses get failed: No token provided");
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
      attributes: [
        "id",
        "userId",
        "responses",
        "totalScore",
        "currentQuestion",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!responseRecord) {
      res.status(404).json({ error: "No response found for this user" });
      console.log(
        `Questionnaire responses get failed: No response found for user: ${userId}`
      );
      return;
    }

    res.status(200).json(responseRecord);
    console.log(
      `Questionnaire responses get successful: Fetched response for user: ${userId}`
    );
  } catch (error) {
    console.error(
      `Questionnaire responses get failed: Error fetching user response: ${error}`
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Save or update questionnaire progress (partial responses and current question) -- */
export const updateProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      console.log("Questionnaire progress update failed: No token provided");
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
      console.log(
        "Questionnaire progress update failed: Missing required fields"
      );
      return;
    }

    console.log(
      `Questionnaire progress update: Processing update for user: ${userId} and current question: ${currentQuestion}`
    );

    // Find existing progress record for the user
    const existingResponse = await QuestionnaireResponse.findOne({
      where: { userId },
    });

    if (existingResponse) {
      // Update the existing record with the new progress
      await existingResponse.update({ responses, currentQuestion });
      res.status(200).json({
        message: "Questionnaire progress updated",
        progress: { responses, currentQuestion },
      });
      console.log(
        `Questionnaire progress update successful: Updated existing response: ${existingResponse.id} for user: ${userId}`
      );
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
        response: newResponse,
      });
      console.log(
        `Questionnaire progress update successful: Created new response: ${newResponse.id} for user: ${userId}`
      );
    }
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Retrieve questionnaire progress for authenticated users -- */
export const getProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      console.log("Questionnaire progress get failed: No token provided");
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
      console.log(
        `Questionnaire progress get failed: No progress found for user: ${userId}`
      );
      return;
    }

    res.status(200).json({
      responses: responseRecord.responses,
      currentQuestion: responseRecord.currentQuestion,
    });
    console.log(
      `Questionnaire progress get successful: Fetched progress for user: ${userId}`
    );
  } catch (error) {
    console.error(
      `Questionnaire progress get failed: Error fetching progress: ${error}`
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Save guest questionnaire responses -- */
export const saveGuestQuestionnaireResponse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check that the user is authenticated and has a guest role
    if (!req.user || req.user.role !== "guest") {
      res.status(401).json({ error: "Unauthorized" });
      console.log("Questionnaire responses save failed: User is not a guest");
      return;
    }

    const { responses, totalScore } = req.body;
    // Use the unique numeric guest userId from the token
    const guestUserId = req.user.userId as number;

    await QuestionnaireResponse.create({
      userId: guestUserId,
      responses,
      totalScore,
    });
    console.log(
      `Questionnaire responses save successful: Guest responses saved for user: ${guestUserId}`
    );
    res.status(200).json({ message: "Guest responses saved" });
  } catch (error) {
    console.error("Error saving guest questionnaire response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Delete questionnaire data -- */
export const deleteQuestionnaireData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      console.log("Questionnaire deletion failed: No user found");
      return;
    }

    // Find and delete the user's questionnaire response
    const response = await QuestionnaireResponse.findOne({
      where: { userId: req.user.userId },
    });

    if (!response) {
      res
        .status(404)
        .json({ error: "No questionnaire data found for this user" });
      console.log(
        `Questionnaire deletion failed: No data found for user ${req.user.userId}`
      );
      return;
    }

    await response.destroy();
    console.log(
      `Questionnaire data deleted successfully for user ${req.user.userId}`
    );
    res
      .status(200)
      .json({ message: "Questionnaire data deleted successfully" });
  } catch (error) {
    console.error("Error deleting questionnaire data:", error);
    res.status(500).json({ error: "Failed to delete questionnaire data" });
  }
};
