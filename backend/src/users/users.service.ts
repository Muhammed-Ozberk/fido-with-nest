import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserProfile } from './dto/user-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.userModel.findOne({ username }).exec();
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findOne(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async getProfile(username: string): Promise<UserProfile | undefined> {
    const user = await this.findOne(username);
    const userCopy: UserProfile = {
      _id: user._id,
      username: user.username,
      name: user.name,
    };
    return userCopy;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
