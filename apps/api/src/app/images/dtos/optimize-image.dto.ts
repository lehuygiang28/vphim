import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class OptimizeImageDTO {
    @ApiProperty({
        description: 'Image public id',
    })
    @IsString()
    @IsUrl({ require_tld: false })
    @IsNotEmpty()
    url: string;

    @ApiProperty({
        description: 'Width',
    })
    @IsNumber()
    @IsNotEmpty()
    width: number;

    @ApiProperty({
        description: 'Height',
    })
    @IsNumber()
    @IsNotEmpty()
    height: number;

    @ApiPropertyOptional({
        description: 'Quality',
    })
    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    quality = 75;
}
