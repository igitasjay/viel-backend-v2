import { Schema, model, Document } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  publicId: string;
  title?: string;
  link?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    title: { type: String },
    link: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const Banner = model<IBanner>('Banner', BannerSchema);
export default Banner;
