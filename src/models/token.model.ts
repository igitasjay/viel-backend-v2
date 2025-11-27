import { Schema, model, Types } from 'mongoose';

export interface IToken {
  token: string;
  userId: Types.ObjectId;
}

const TokenSchema = new Schema<IToken>({
  token: {
    type: String,
    require: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    require: true,
  },
});

export default model<IToken>('Token', TokenSchema);
