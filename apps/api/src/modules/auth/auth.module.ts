import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
    }),
  ],
  providers: [ClerkAuthGuard],
  exports: [ClerkAuthGuard, JwtModule],
})
export class AuthModule {}
