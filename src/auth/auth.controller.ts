import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: AuthDto): Promise<User> {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  singIn(@Body() dto: AuthDto): Promise<User> {
    return this.authService.signIn(dto);
  }
}
