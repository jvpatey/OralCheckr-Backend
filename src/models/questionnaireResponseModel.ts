import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/db";
import User from "./userModel";
import { getIntegerType } from "../db/dataTypes";

/* -- Interface for questionnaire response attributes -- */
interface ResponseAttributes {
  id?: number;
  userId: number; // foreign key
  responses: Record<number, number | number[]>;
  totalScore?: number;
  currentQuestion?: number;
}

/* -- Interface for creating an new questionnaire response -- */
interface ResponseCreationAttributes
  extends Optional<ResponseAttributes, "id" | "currentQuestion"> {}

/* -- QuestionnaireResponse model -- */
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

/* -- Initialize the QuestionnaireResponse model -- */
QuestionnaireResponse.init(
  {
    id: {
      type: getIntegerType(true),
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: getIntegerType(true),
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
      type: getIntegerType(),
      allowNull: true,
      defaultValue: 0,
    },
    currentQuestion: {
      type: getIntegerType(),
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

/* -- Associations -- */
User.hasOne(QuestionnaireResponse, { foreignKey: "userId", as: "responses" });
QuestionnaireResponse.belongsTo(User, { foreignKey: "userId" });

export default QuestionnaireResponse;
