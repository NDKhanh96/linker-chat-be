import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '~/user/entities';
import { UserService } from '~/user/user.service';

describe('UserService', () => {
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserService, { provide: getRepositoryToken(User), useValue: {} }],
        }).compile();

        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });
});
