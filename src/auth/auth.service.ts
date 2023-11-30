import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signUp(dto: AuthDto): Promise<User> {
    //generate pass
    const hash: string = await argon.hash(dto.password);

    //save in db
    try {
      const user: User = await this.prisma.user.create({
        data: { email: dto.email, hash },
      });

      //remove hash
      delete user.hash;

      return user;
    } catch (error) {
      //catch 500
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email taken');
        }
      }
    }
  }

  async signIn(dto: AuthDto): Promise<User> {
    //find by email
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    //if user not exist throw exeption

    if (!user) {
      throw new ForbiddenException('User do not exist');
    }
    //compare pass
    const pwMatches = await argon.verify(user.hash, dto.password);
    //if incorect throw exeprion
    if (!pwMatches) {
      throw new ForbiddenException('Wrong pass');
    }
    //send back user

    delete user.hash;
    return user;
  }
}
