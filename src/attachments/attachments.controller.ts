import { BadRequestException, Controller, Headers, Post, Req, UseGuards, type RawBodyRequest } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AttachmentsService } from '~/attachments/attachments.service';
import { Attachment } from '~/attachments/entities';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('attachments')
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) {}

    @Post('upload')
    @ApiConsumes('application/octet-stream')
    @ApiHeader({
        name: 'x-file-name',
        description: 'Original file name',
        required: true,
        schema: { type: 'string', example: 'image.jpg' },
    })
    @ApiHeader({
        name: 'content-type',
        description: 'File MIME type',
        required: true,
        schema: { type: 'string', example: 'image/jpeg' },
    })
    @ApiBody({
        description: 'Raw file binary data',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiOperation({ summary: 'Upload a file/image as raw binary for message attachment' })
    @ApiResponse({ status: 201, description: 'File uploaded successfully', type: Attachment })
    @ApiResponse({ status: 400, description: 'Bad request - Missing filename or file data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async uploadFile(
        @Req() req: Express.AuthenticatedRequest & RawBodyRequest<Request>,
        @Headers('x-file-name') fileName?: string,
        @Headers('content-type') contentType?: string,
    ): Promise<Attachment> {
        if (!fileName) {
            throw new BadRequestException('Header x-file-name is required');
        }

        const buffer = req.rawBody;

        if (!buffer || buffer.length === 0) {
            throw new BadRequestException('No file data uploaded');
        }

        return this.attachmentsService.uploadMessageAttachment(buffer, fileName, contentType || 'application/octet-stream', req.user.id);
    }
}
