import { Request, Response } from "express";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import User from "../models/userModel";

// Save questionnaire response
export const saveResponse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, responses, totalScore } = req.body;

    if (!userId || !responses || totalScore === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Ensure the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Save response
    const newResponse = await QuestionnaireResponse.create({
      userId,
      responses,
      totalScore,
    });

    res
      .status(201)
      .json({ message: "Questionnaire response saved", newResponse });
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get questionnaire response by user ID
export const getResponseByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const response = await QuestionnaireResponse.findOne({ where: { userId } });
    if (!response) {
      res.status(404).json({ error: "No response found for this user" });
      return;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
