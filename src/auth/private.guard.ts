import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './types';

@Injectable()
export class PrivateGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (!user?.userId) {
            throw new UnauthorizedException('Authentication required');
        }

        return true;
    }
}
