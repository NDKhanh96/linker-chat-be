import { Injectable, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { AppEvent } from '~utils/common';

@Injectable()
export class EventBus {
    constructor(private readonly emitter: EventEmitter2) {}

    emit<E extends AppEvent>(event: E) {
        this.emitter.emit(event.type, event.payload);
    }
}

@Module({
    providers: [EventBus],
    exports: [EventBus],
})
export class EventBusModule {}
