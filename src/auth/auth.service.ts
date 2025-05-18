import { MailerService } from '@nestjs-modules/mailer';
import { ConflictException, Injectable, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { genSalt, hash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import type { Repository } from 'typeorm';

import type { CreateAccountDto } from '~/auth/dto';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import { User } from '~/user/entities';
import type { EnvFileVariables } from '~utils/environment';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

        @InjectRepository(VerifyToken)
        private readonly verifyTokenRepository: Repository<VerifyToken>,

        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,

        private readonly configService: ConfigService<EnvFileVariables, true>,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
    ) {}

    async register(accountDTO: CreateAccountDto): Promise<Account> {
        const emailExists: Account | null = await this.accountRepository.findOne({ where: { email: accountDTO.email } });

        if (emailExists) {
            throw new ConflictException('Email already exists');
        }

        accountDTO.password = await this.hashPassword(accountDTO.password);

        const account = new Account({
            ...accountDTO,
            user: new User({ ...accountDTO }),
        });

        const [savedAccountError, savedAccount] = await this.accountRepository.save(account).toSafe();

        if (savedAccountError) {
            throw new UnprocessableEntityException(savedAccountError);
        }

        /**
         * Cần phải dùng plainToInstance để kích hoạt được @Exclude và @Expose trong entities.
         * @Exclude chỉ loại bỏ các thuộc tính được đánh dấu @Exclude trong class, trong trường hợp này có những thuộc tính không có trong class vẫn dc trả về.
         * Vậy nên cần excludeExtraneousValues: true để chỉ trả về những thuộc tính được đánh dấu @Expose .
         */
        return plainToInstance(Account, savedAccount, { excludeExtraneousValues: true });
    }

    /**
     * Có thể sử dụng mà không cần bắt ngoại lệ.
     */
    hashPassword = async (password: string): Promise<string> => {
        const [genSaltError, salt] = await genSalt().toSafe();

        if (genSaltError) {
            throw new ServiceUnavailableException(genSaltError);
        }
        const [hashError, hashPassword] = await hash(password, salt).toSafe();

        if (hashError) {
            throw new ServiceUnavailableException(hashError);
        }

        return hashPassword;
    };

    findOne(id: number) {
        return `This action returns a #${id} auth`;
    }

    remove(id: number) {
        return `This action removes a #${id} auth`;
    }
}
