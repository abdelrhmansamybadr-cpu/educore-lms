import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@school.com' })
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string
}

export class OtpDto {
  @ApiProperty({ example: '+201234567890' })
  @IsString()
  phone: string
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  phone: string

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string
}
