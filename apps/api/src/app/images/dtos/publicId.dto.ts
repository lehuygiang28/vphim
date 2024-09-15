import { PickType } from '@nestjs/swagger';
import { ImageUploadedResponseDTO } from './image-uploaded-response.dto';

export class PublicIdDTO extends PickType(ImageUploadedResponseDTO, ['publicId']) {}
