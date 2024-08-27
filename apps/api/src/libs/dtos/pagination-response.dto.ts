import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponseDto<TData> {
    constructor(data: { data: TData[]; total: number; limit: number; page: number }) {
        this.data = data.data;
        this.total = data.total;
    }

    @ApiProperty()
    data: TData[];

    @ApiProperty()
    total: number;
}
