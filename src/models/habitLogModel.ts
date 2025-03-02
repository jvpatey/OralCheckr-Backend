import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/db";
import Habit from "./habitModel";

interface HabitLogAttributes {
  logId: number;
  habitId: number;
  userId: number;
  date: Date;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributesthat can be null/undefined when creating a new HabitLog
interface HabitLogCreationAttributes
  extends Optional<HabitLogAttributes, "logId" | "createdAt" | "updatedAt"> {}

class HabitLog
  extends Model<HabitLogAttributes, HabitLogCreationAttributes>
  implements HabitLogAttributes
{
  public logId!: number;
  public habitId!: number;
  public userId!: number;
  public date!: Date;
  public count!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

HabitLog.init(
  {
    logId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "logId",
    },
    habitId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "habitId",
      references: {
        model: "habits",
        key: "habitId",
      },
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
      type: DataTypes.INTEGER.UNSIGNED,
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
    ],
  }
);

// Associations
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
