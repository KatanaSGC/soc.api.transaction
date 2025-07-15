import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCode } from 'src/common/response/responseCode';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();        

        return next.handle().pipe(
            map((data) => {
                let statusCode = 200;

                switch (true) {
                    case data?.status == ResponseCode.SUCCESS:
                      statusCode = 200;
                      break;
                    case data?.status == ResponseCode.ERROR:
                      statusCode = 400;
                      break;
                    case data?.status == ResponseCode.EXCEPTION:
                      statusCode = 500;
                      break;
                    case data?.status == ResponseCode.UNATHORIZED:
                      statusCode = 401;
                      break;
                    case data?.status == ResponseCode.NOT_CONTENT:
                      statusCode = 404;
                      break;
                  }

                response.status(statusCode); 

                return data
            }),
        );
    }
}