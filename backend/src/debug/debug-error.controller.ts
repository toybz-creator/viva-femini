import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Debug Error Resilience')
@Controller('debug/error')
export class DebugErrorController {
  @ApiOperation({
    summary: 'Throw a synchronous error inside a request handler',
  })
  @Get('sync')
  throwSyncError() {
    throw new Error('This is a simulated synchronous error!');
  }

  @ApiOperation({
    summary: 'Trigger an unhandled promise rejection asynchronously',
  })
  @Get('async-rejection')
  triggerAsyncRejection() {
    // Return immediately to client, but trigger rejection asynchronously
    setTimeout(() => {
      Promise.reject(
        new Error('This is a simulated unhandled promise rejection!'),
      );
    }, 100);
    return {
      message: 'Async rejection scheduled in 100ms. Check server logs.',
    };
  }

  @ApiOperation({
    summary: 'Trigger an uncaught exception asynchronously (setTimeout)',
  })
  @Get('uncaught')
  triggerUncaughtException() {
    // Return immediately to client, but throw exception inside an async block
    setTimeout(() => {
      throw new Error(
        'This is a simulated uncaught exception inside setTimeout!',
      );
    }, 100);
    return {
      message:
        'Async uncaught exception scheduled in 100ms. Check server logs.',
    };
  }
}
