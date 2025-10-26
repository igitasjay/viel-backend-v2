import { Schema, model } from 'mongoose';
import bcryt from 'bcrypt';

export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
}

const UserSchema = new Schema<IUser>(
  {
    firstname: {
      type: String,
      required: [true, 'Your first name is required'],
      minlength: [2, 'First name must be at least 2 characters long'],
    },
    lastname: {
      type: String,
      required: [true, 'Your last name is required'],
      minlength: [2, 'Last name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Email already exists'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: [true, 'Phone already exists'],
      maxlength: [13, 'Phone number cannot exceed 13 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role is either user or admin',
      },
      default: 'user',
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    this.password = await bcryt.hash(this.password, 10);
    next();
    return;
  }

  this.password = await bcryt.hash(this.password, 10);
  next();
});

export default model<IUser>('User', UserSchema);
