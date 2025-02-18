import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/db";
import User from "./userModel";

interface ResponseAttributes {
  id?: number;
  userId: number;
  responses: Record<number, number | number[]>;
  totalScore?: number;
  currentQuestion?: number;
}

interface ResponseCreationAttributes
  extends Optional<ResponseAttributes, "id" | "currentQuestion"> {}

class QuestionnaireResponse
  extends Model<ResponseAttributes, ResponseCreationAttributes>
  implements ResponseAttributes
{
  public id!: number;
  public userId!: number;
  public responses!: Record<number, number | number[]>;
  public totalScore!: number;
  public currentQuestion!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QuestionnaireResponse.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    responses: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    currentQuestion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "questionnaire_responses",
    timestamps: true,
    underscored: false,
  }
);

User.hasOne(QuestionnaireResponse, { foreignKey: "userId", as: "responses" });
QuestionnaireResponse.belongsTo(User, { foreignKey: "userId" });

export default QuestionnaireResponse;
