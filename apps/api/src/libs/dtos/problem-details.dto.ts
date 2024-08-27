import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProblemDetails {
    constructor(data: ProblemDetails) {
        this.type = data?.type || '';
        this.title = data?.title || '';
        this.status = data?.status || 0;
        this.detail = data?.detail || '';
        this.instance = data?.instance || '';
        this.errors = data?.errors || {};
        this.data = data?.data || {};
    }

    @ApiProperty({
        description: 'A URI reference that identifies the problem type',
        example: 'https://example.com/probs/out-of-credit',
    })
    type: string;

    @ApiProperty({
        description: 'A short, human-readable summary of the problem type',
        example: 'You do not have enough credit.',
    })
    title: string;

    @ApiProperty({
        description: 'The HTTP status code',
        example: 400,
    })
    status: number;

    @ApiProperty({
        description: 'A human-readable explanation specific to this occurrence of the problem',
        example: 'Your current balance is 30, but that costs 50.',
    })
    detail: string;

    @ApiProperty({
        description: 'A URI reference that identifies the specific occurrence of the problem',
        example: '/account/12345/transactions/67890',
    })
    instance: string;

    @ApiProperty({
        type: 'object',
        additionalProperties: {
            oneOf: [{ type: 'string' }, { type: 'object' }],
        },
        description: 'A map of parameter names to invalid parameter values',
        example: {
            email: 'email is not a valid email',
            avatar: {
                url: 'url is not a valid url',
            },
        },
    })
    errors: Record<string, unknown>;

    @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
    data?: Record<string, string>;
}
