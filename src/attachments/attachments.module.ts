import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentsController } from '~/attachments/attachments.controller';
import { AttachmentsService } from '~/attachments/attachments.service';
import { Attachment } from '~/attachments/entities';

@Module({
    imports: [TypeOrmModule.forFeature([Attachment])],
    controllers: [AttachmentsController],
    providers: [AttachmentsService],
    exports: [AttachmentsService],
})
export class AttachmentsModule {}
