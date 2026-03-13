import { IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  legalName!: string;

  @IsNotEmpty()
  jurisdiction!: string;
}
