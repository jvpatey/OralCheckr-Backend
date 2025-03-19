import { Model, Optional } from "sequelize";
import sequelize from "../db/db";
import { getIntegerType, STRING } from "../db/dataTypes";

/* -- Habit model attributes -- */
interface HabitAttributes {
  habitId: number;
  name: string;
  count: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/* -- Attributes that can be null/undefined when creating a new Habit -- */
interface HabitCreationAttributes
  extends Optional<HabitAttributes, "habitId" | "createdAt" | "updatedAt"> {}

/* -- Habit model -- */
class Habit
  extends Model<HabitAttributes, HabitCreationAttributes>
  implements HabitAttributes
{
  public habitId!: number;
  public name!: string;
  public count!: number;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/* -- Initialize the Habit model -- */
Habit.init(
  {
    habitId: {
      type: getIntegerType(true),
      autoIncrement: true,
      primaryKey: true,
      field: "habitId",
    },
    name: {
      type: STRING(255),
      allowNull: false,
      field: "name",
      validate: {
        notEmpty: { msg: "Habit name cannot be empty" },
      },
    },
    count: {
      type: getIntegerType(true),
      allowNull: false,
      field: "count",
      validate: {
        min: { args: [1], msg: "Count must be at least 1" },
      },
    },
    userId: {
      type: getIntegerType(true),
      allowNull: false,
      field: "userId",
      references: {
        model: "users",
        key: "userId",
      },
    },
  },
  {
    sequelize,
    tableName: "habits",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ["name", "userId"],
        name: "name_user_unique",
      },
    ],
  }
);

export default Habit;
