import { ObjectId } from 'mongoose';

export interface UserProfile {
  _id: ObjectId;
  username: string;
  name: string;
}
