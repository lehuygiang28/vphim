import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                uri: configService.getOrThrow<string>('MONGODB_URI'),
                retryDelay: 1000,
                connectionFactory: (connection: Connection) => {
                    connection.on('connected', () => {
                        Logger.debug(
                            `[Mongodb] is connected: ${connection?.host}/${connection?.name}`,
                        );
                    });
                    connection.emit('connected');
                    return connection;
                },
            }),
            inject: [ConfigService],
        }),
    ],
})
export class MongodbModule {
    static setup(uri: string, name?: string) {
        const options: MongooseModuleAsyncOptions = {
            connectionName: name ?? undefined,
            useFactory: () => ({
                uri,
                retryDelay: 1000,
                connectionFactory: (connection: Connection) => {
                    connection.on('connected', () => {
                        Logger.debug(
                            `[Mongodb] is connected: ${connection?.host}/${connection?.name}`,
                        );
                        connection.emit('connected');
                    });
                    return connection;
                },
            }),
        };
        return MongooseModule.forRootAsync(options);
    }
}
