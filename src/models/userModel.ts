import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/db";

interface UserAttributes {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, "userId"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public userId!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "First name cannot be empty" },
      },
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Last name cannot be empty" },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: "unique_email",
        msg: "The provided email is already in use.",
      },
      validate: {
        isEmail: { msg: "Must be a valid email address" },
      },
      set(value: string) {
        this.setDataValue("email", value.toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

export default User;
