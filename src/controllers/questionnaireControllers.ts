import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  QuestionnaireProgress,
  QuestionnaireError,
  ValidationError,
  DecodedToken,
  SequelizeValidationError,
  QuestionnaireRequestBody,
} from "../interfaces/questionnaire";

/* -- Questionnaire Controller -- */

/* -- Save questionaire responss on submission of questionnaire -- */
export const saveResponse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the JWT token from the cookies
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
    const { responses, totalScore } = req.body as QuestionnaireRequestBody;

    // Check if the responses and totalScore are provided
    if (!responses || totalScore === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      console.log(
        "Questionnaire responses save failed: Missing required fields"
      );
      return;
    }

    // Get the user
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
    console.error(
      `Questionnaire responses save failed: Error saving response: ${error}`
    );
    if (error instanceof Error) {
      // Check if it's a Sequelize validation error
      if (
        "errors" in error &&
        Array.isArray((error as SequelizeValidationError).errors)
      ) {
        const validationErrors = (error as SequelizeValidationError).errors
          .map((err: ValidationError) => err.message)
          .join(", ");
        res.status(400).json({
          error: "Questionnaire validation failed",
          details: `Invalid data: ${validationErrors}`,
          errors: (error as SequelizeValidationError).errors,
        } as QuestionnaireError);
      } else {
        res.status(400).json({
          error: "Questionnaire submission failed",
          details: `Error: ${error.message}`,
        } as QuestionnaireError);
      }
    } else {
      res.status(500).json({
        error: "Internal server error",
        details:
          "An unexpected error occurred while processing your questionnaire submission",
      } as QuestionnaireError);
    }
  }
};

/* -- Get questionnaire responses by user ID -- */
export const getResponseByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the JWT token from the cookies
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

    // Get the user to check if they're a guest
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log(
        `Questionnaire responses get failed: User not found for id: ${userId}`
      );
      return;
    }

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

    // Check if the response record exists
    if (!responseRecord) {
      // If no response exists yet, return 204 No Content for all users
      res.status(204).end();
      return;
    }

    // Send a success response to the client
    res.status(200).json(responseRecord);
  } catch (error) {
    console.error(
      `Questionnaire responses get failed: Error fetching user response: ${error}`
    );
    if (error instanceof Error) {
      res.status(400).json({
        error: `Failed to fetch questionnaire responses: ${error.message}`,
      });
    } else {
      res.status(500).json({
        error:
          "Failed to fetch questionnaire responses due to an unexpected error. Please try again.",
      });
    }
  }
};

/* -- Save or update questionnaire progress (partial responses and current question) -- */
export const updateProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the JWT token from the cookies
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      console.log("Questionnaire progress update failed: No token provided");
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const userId = decoded.userId;

    // Get the responses and current question from the request body
    const { responses, currentQuestion } = req.body as QuestionnaireProgress;

    // Check if the responses and current question are provided
    if (responses === undefined || currentQuestion === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      console.log(
        "Questionnaire progress update failed: Missing required fields"
      );
      return;
    }

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
    // Get the JWT token from the cookies
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token provided" });
      console.log("Questionnaire progress get failed: No token provided");
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const userId = decoded.userId;

    // Get the user to check if they're a guest
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log(
        `Questionnaire progress get failed: User not found for id: ${userId}`
      );
      return;
    }

    // Fetch the user's progress record
    const responseRecord = await QuestionnaireResponse.findOne({
      where: { userId },
    });
    if (!responseRecord) {
      // If no progress exists yet, return 204 No Content for all users
      res.status(204).end();
      return;
    }

    // Send a success response to the client
    res.status(200).json({
      responses: responseRecord.responses,
      currentQuestion: responseRecord.currentQuestion,
    } as QuestionnaireProgress);
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

    // Get the responses and total score from the request body
    const { responses, totalScore } = req.body;

    // Get the guest user ID
    const guestUserId = req.user.userId as number;

    // Create a new questionnaire response
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
    // Check if the user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      console.log("Questionnaire deletion failed: No user found");
      return;
    }

    // Find and delete the user's questionnaire response
    const response = await QuestionnaireResponse.findOne({
      where: { userId: req.user.userId },
    });

    // Check if the questionnaire response exists
    if (!response) {
      res
        .status(404)
        .json({ error: "No questionnaire data found for this user" });
      console.log(
        `Questionnaire deletion failed: No data found for user ${req.user.userId}`
      );
      return;
    }

    // Delete the questionnaire response
    await response.destroy();
    console.log(
      `Questionnaire data deleted successfully for user ${req.user.userId}`
    );

    // Send a success response to the client
    res
      .status(200)
      .json({ message: "Questionnaire data deleted successfully" });
  } catch (error) {
    console.error("Error deleting questionnaire data:", error);
    res.status(500).json({ error: "Failed to delete questionnaire data" });
  }
};

/* -- Save questionnaire responses on submission of questionnaire -- */
export const saveQuestionnaireResponses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the JWT token from the cookies
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
    const { responses, totalScore } = req.body as {
      responses: Record<number, number | number[]>;
      totalScore: number;
    };

    // Check if the responses and totalScore are provided
    if (!responses || totalScore === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      console.log(
        "Questionnaire responses save failed: Missing required fields"
      );
      return;
    }

    // Get the user
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log("Questionnaire responses save failed: User not found");
      return;
    }

    // Save the responses to the database
    const questionnaireResponse = await QuestionnaireResponse.create({
      userId,
      responses,
      totalScore,
      currentQuestion: 0, // Reset to 0 after completion
    });

    res.status(201).json({
      message: "Questionnaire responses saved successfully",
      data: questionnaireResponse,
    });
    console.log("Questionnaire responses saved successfully");
  } catch (error) {
    console.error("Error saving questionnaire responses:", error);
    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to save questionnaire responses",
        details: error.message,
      } as QuestionnaireError);
    } else {
      res.status(500).json({
        error: "Internal server error",
        details: "An unexpected error occurred",
      } as QuestionnaireError);
    }
  }
};
