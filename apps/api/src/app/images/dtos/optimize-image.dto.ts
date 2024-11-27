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

    /**
     * Width
     */
    @ApiProperty({
        description: 'Width',
    })
    @IsNumber()
    @IsNotEmpty()
    w: number;

    /**
     * Height
     */
    @ApiProperty({
        description: 'Height',
    })
    @IsNumber()
    @IsNotEmpty()
    h: number;

    /**
     * Quality
     */
    @ApiPropertyOptional({
        description: 'Quality',
    })
    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    q = 75;
}
