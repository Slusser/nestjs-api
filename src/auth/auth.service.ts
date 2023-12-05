import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signUp(dto: AuthDto): Promise<{ access_token: string }> {
    //generate pass
    const hash: string = await argon.hash(dto.password);

    //save in db
    try {
      const user: User = await this.prisma.user.create({
        data: { email: dto.email, hash },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      //catch 500
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email taken');
        }
      }
    }
  }

  async signIn(dto: AuthDto): Promise<{ access_token: string }> {
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
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return { access_token: access_token };
  }
}
