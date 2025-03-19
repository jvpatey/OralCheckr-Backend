import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/db";
import Habit from "./habitModel";
import { getIntegerType, DATE } from "../db/dataTypes";

interface HabitLogAttributes {
  logId: number;
  habitId: number;
  userId: number;
  date: Date;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/* -- Attributes that can be null/undefined when creating a new HabitLog -- */
interface HabitLogCreationAttributes
  extends Optional<HabitLogAttributes, "logId" | "createdAt" | "updatedAt"> {}

/* -- HabitLog model -- */
class HabitLog
  extends Model<HabitLogAttributes, HabitLogCreationAttributes>
  implements HabitLogAttributes
{
  public logId!: number;
  public habitId!: number;
  public userId!: number;
  public date!: Date;
  public count!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/* -- Initialize the HabitLog model -- */
HabitLog.init(
  {
    logId: {
      type: getIntegerType(true),
      autoIncrement: true,
      primaryKey: true,
      field: "logId",
    },
    habitId: {
      type: getIntegerType(true),
      allowNull: false,
      field: "habitId",
      references: {
        model: "habits",
        key: "habitId",
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "date",
    },
    count: {
      type: getIntegerType(true),
      allowNull: false,
      defaultValue: 0,
      field: "count",
      validate: {
        min: { args: [0], msg: "Count must be at least 0" },
      },
    },
  },
  {
    sequelize,
    tableName: "habit_logs",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ["habitId", "date"],
        name: "habit_date_unique",
      },
      {
        fields: ["date"],
        name: "date_index",
      },
      {
        fields: ["userId", "date"],
        name: "user_date_index",
      },
    ],
  }
);

/* -- Associations -- */
Habit.hasMany(HabitLog, {
  foreignKey: "habitId",
  as: "logs",
  onDelete: "CASCADE",
});

HabitLog.belongsTo(Habit, {
  foreignKey: "habitId",
  as: "habit",
});

export default HabitLog;
