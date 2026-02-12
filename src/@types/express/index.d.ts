import * as express from 'express';
import { Types } from 'mongoose';
import { IUser } from '@/models/user.model';

declare global {
  namespace Express {
    interface Request {
      userId?: Types.ObjectId;
      user?: IUser;
    }
  }
}
