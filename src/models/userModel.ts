import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../db/db";
import { getIntegerType, STRING, BOOLEAN } from "../db/dataTypes";

/* -- User Model -- */

// Interfaces

interface UserAttributes {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isGuest?: boolean;
  avatar?: string;
  googleId?: string;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "userId" | "isGuest" | "avatar" | "googleId"
  > {}

/* -- User Model Definition -- */
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public userId!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public isGuest!: boolean;
  public avatar?: string;
  public googleId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to validate password
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

/* -- Initialize the User model -- */
User.init(
  {
    userId: {
      type: getIntegerType(true),
      autoIncrement: true,
      primaryKey: true,
      field: "userId",
    },
    firstName: {
      type: STRING(255),
      allowNull: false,
      field: "firstName",
      validate: {
        notEmpty: { msg: "First name cannot be empty" },
        isAlpha: { msg: "First name can only contain letters" },
      },
    },
    lastName: {
      type: STRING(255),
      allowNull: false,
      field: "lastName",
      validate: {
        notEmpty: { msg: "Last name cannot be empty" },
        isAlpha: { msg: "Last name can only contain letters" },
      },
    },
    email: {
      type: STRING(255),
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
      type: STRING(255),
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
    isGuest: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    avatar: {
      type: STRING(255),
      allowNull: true,
      field: "avatar",
      validate: {
        isUrl: { msg: "Avatar must be a valid URL" },
      },
    },
    googleId: {
      type: STRING(255),
      allowNull: true,
      field: "googleId",
      unique: true,
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
