import { Test, TestingModule } from '@nestjs/testing';

import { ConversationsController } from '~/conversations/conversations.controller';
import { ConversationsService } from '~/conversations/conversations.service';

describe('ConversationsController', () => {
    let controller: ConversationsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ConversationsController],
            providers: [ConversationsService],
        }).compile();

        controller = module.get<ConversationsController>(ConversationsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
