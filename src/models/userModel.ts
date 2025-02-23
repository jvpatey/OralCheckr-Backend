import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../db/db";

interface UserAttributes {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isGuest?: boolean;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "userId" | "isGuest"> {}

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
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  //Create a new guest user with a unique guest email and a default guest password.
  public static async createGuest(): Promise<User> {
    const guestEmail = `guest_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}@guest.com`;
    // Use a default guest password
    const guestPassword = "guestPassword!";
    // Hash the guest password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(guestPassword, salt);
    // Create and return the new guest user
    return await User.create({
      firstName: "Guest",
      lastName: "User",
      email: guestEmail,
      password: hashedPassword,
      isGuest: true,
    });
  }
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
    isGuest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
