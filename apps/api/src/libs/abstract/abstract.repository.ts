import {
    Model,
    Connection,
    SaveOptions,
    ClientSession,
    Types,
    FilterQuery,
    QueryOptions,
    ProjectionType,
    UpdateQuery,
    PipelineStage,
    AggregateOptions,
} from 'mongoose';
import { Logger, NotFoundException } from '@nestjs/common';

import { AbstractDocument } from './abstract.schema';
import type { NullableType } from '../types';
import { PaginationRequestDto } from '../dtos';
import { isNullOrUndefined } from '../utils';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
    protected abstract readonly logger: Logger;

    constructor(
        protected readonly model: Model<TDocument>,
        private readonly connection: Connection,
    ) {}

    async create({
        document,
        saveOptions,
        session,
    }: {
        document: Omit<TDocument, '_id'>;
        saveOptions?: SaveOptions;
        session?: ClientSession;
    }): Promise<TDocument> {
        const createdDocument = new this.model({
            _id: new Types.ObjectId(),
            ...document,
            session,
        });
        return (
            await createdDocument.save({ ...saveOptions, session })
        ).toJSON() as unknown as TDocument;
    }

    async findOne({
        filterQuery,
        queryOptions,
        projectionType,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
    }): Promise<NullableType<TDocument>> {
        const document = await this.model
            .findOne(filterQuery, projectionType, {
                ...queryOptions,
            })
            .lean(queryOptions?.lean ?? true);
        return document as unknown as TDocument;
    }

    async findOneOrThrow({
        filterQuery,
        queryOptions,
        projectionType,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
    }): Promise<TDocument> {
        const document = await this.findOne({
            filterQuery,
            queryOptions,
            projectionType,
        });

        if (!document) {
            this.logger.warn(`${this.model.modelName} not found with filterQuery: %o`, filterQuery);
            throw new NotFoundException(`${this.model.modelName} not found!`);
        }

        return document as unknown as TDocument;
    }

    async findOneAndUpdate({
        filterQuery,
        updateQuery,
        queryOptions,
        session,
    }: {
        filterQuery: FilterQuery<TDocument>;
        updateQuery: UpdateQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;

        session?: ClientSession;
    }): Promise<NullableType<TDocument>> {
        delete updateQuery?._id;

        const document = await this.model.findOneAndUpdate(filterQuery, updateQuery, {
            lean: true,
            new: true,
            ...queryOptions,
            session,
        });
        return document ?? null;
    }

    async findOneAndUpdateOrThrow({
        filterQuery,
        updateQuery,
        queryOptions,
        session,
    }: {
        filterQuery: FilterQuery<TDocument>;
        updateQuery: UpdateQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        session?: ClientSession;
    }): Promise<TDocument> {
        delete updateQuery?._id;

        const document = await this.findOneAndUpdate({
            filterQuery,
            updateQuery,
            queryOptions,
            session,
        });
        if (!document) {
            this.logger.warn(`${this.model.modelName} not found with filterQuery: %o`, filterQuery);
            throw new NotFoundException(`${this.model.modelName} not found!`);
        }

        return document;
    }

    async upsert(filterQuery: FilterQuery<TDocument>, document: Partial<TDocument>) {
        delete document?._id;

        return this.model.findOneAndUpdate(filterQuery, document, {
            lean: true,
            upsert: true,
            new: true,
        });
    }

    /**
     * Pagination will automatically calculate, if query is provided
     * @returns
     */
    async find({
        filterQuery,
        queryOptions,
        projectionType,
        query,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
        query?: PaginationRequestDto;
    }): Promise<NullableType<TDocument[]>> {
        const limit = Math.min(query?.limit ?? 1, 500);
        const skip = Math.max(((query?.page ?? 1) - 1) * limit, 0);

        const filter: FilterQuery<TDocument> = { ...filterQuery };
        let options: Partial<QueryOptions<TDocument>> = {
            lean: true,
            skip: 0,
            limit: 10,
            ...queryOptions,
        };

        if (query?.sortBy && query?.sortOrder) {
            options = { ...options, sort: { [query.sortBy]: query.sortOrder } };
        }

        if (!isNullOrUndefined(query?.limit)) {
            options = { ...options, limit };
        }

        if (!isNullOrUndefined(query?.page)) {
            options = { ...options, skip };
        }

        const document = await this.model.find(filter, projectionType, options);

        return document ?? null;
    }

    /**
     * Pagination will automatically calculate, if query is provided
     * @returns
     */
    async findOrThrow({
        filterQuery,
        queryOptions,
        projectionType,
        query,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
        query?: PaginationRequestDto;
    }): Promise<TDocument[]> {
        const document = await this.find({
            filterQuery,
            queryOptions,
            projectionType,
            query,
        });

        if (!document || document.length <= 0) {
            this.logger.warn(
                `${this.model.modelName}s not found with filterQuery: %o`,
                filterQuery,
            );
            throw new NotFoundException(`${this.model.modelName}s not found`);
        }

        return document;
    }

    async count(filterQuery: FilterQuery<TDocument>): Promise<number> {
        return this.model.countDocuments(filterQuery);
    }

    async startTransaction(): Promise<ClientSession> {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
    }

    async commitTransaction(session: ClientSession): Promise<void> {
        await session.commitTransaction();
        await session.endSession();
    }

    async rollbackTransaction(session: ClientSession): Promise<void> {
        await session.abortTransaction();
        await session.endSession();
    }

    async endSession(session: ClientSession): Promise<void> {
        if (session.inTransaction()) {
            await session.endSession();
        }
    }

    async aggregate<T>(
        pipeline: PipelineStage[],
        options?: AggregateOptions,
    ): Promise<NullableType<T | TDocument[]>> {
        const documents = await this.model.aggregate(pipeline, options);
        return documents as unknown as TDocument[];
    }

    async insertMany(
        documents: Array<Omit<TDocument, '_id'> & { _id?: Types.ObjectId }>,
        session?: ClientSession,
    ): Promise<TDocument[]> {
        const insertedDocuments = await this.model.insertMany(
            documents.map((doc) => ({
                ...doc,
                _id: doc?._id ?? new Types.ObjectId(),
            })),
            session ? { session } : null,
        );
        return insertedDocuments.map((doc) => doc.toJSON()) as unknown as TDocument[];
    }

    async deleteOne(filterQuery: FilterQuery<TDocument>, session?: ClientSession) {
        return this.model.deleteOne(filterQuery, session ? { session } : null);
    }

    async deleteMany(filterQuery: FilterQuery<TDocument>, session?: ClientSession) {
        return this.model.deleteMany(filterQuery, session ? { session } : null);
    }
}
