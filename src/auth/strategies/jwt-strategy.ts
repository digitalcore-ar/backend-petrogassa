import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "../../users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class JwtStategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('JWT_SECRET')!
        })
    }

    async validate(payload: JwtPayload): Promise<User> {
        const { id } = payload;

        const user: User | null = await this.userRepository.findOneBy({ id });

        if(!user){
            throw new UnauthorizedException('Token not valid!');
        }

        if(!user.isActive){
            throw new UnauthorizedException('User is inactive, talk with administrator');
        }

        return user;
    }
}
