import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '~/user/entities';

import { UserController } from '~/user/user.controller';
import { UserService } from '~/user/user.service';
describe('UserController', () => {
    let controller: UserController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [UserService, { provide: getRepositoryToken(User), useValue: {} }],
        }).compile();

        controller = module.get<UserController>(UserController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
