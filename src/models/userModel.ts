import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/db";

interface UserAttributes {
  userId: number;
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
      field: "userId",
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "firstName",
      validate: {
        notEmpty: { msg: "First name cannot be empty" },
        isAlpha: { msg: "First name can only contain letters" },
      },
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "lastName",
      validate: {
        notEmpty: { msg: "Last name cannot be empty" },
        isAlpha: { msg: "Last name can only contain letters" },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: "unique_email",
        msg: "The provided email is already in use.",
      },
      field: "email",
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
      field: "password",
      validate: {
        notEmpty: { msg: "Password cannot be empty" },
        len: {
          args: [8, 255],
          msg: "Password must be at least 8 characters long",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: false,
  }
);

export default User;
