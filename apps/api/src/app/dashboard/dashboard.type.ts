import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class StatOverview {
    @Field(() => Int)
    totalMovies: number;

    @Field(() => Int)
    totalUsers: number;

    @Field(() => Int)
    totalComments: number;

    @Field(() => Int)
    totalCategories: number;

    @Field(() => Int)
    moviesAddedToday: number;

    @Field(() => Int)
    moviesUpdatedToday: number;

    @Field(() => Int)
    commentsToday: number;

    @Field(() => Int)
    newUsersToday: number;
}

@ObjectType()
export class MoviesByType {
    @Field(() => String)
    type: string;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class TopViewedMovie {
    @Field(() => String)
    _id: string;

    @Field(() => String)
    name: string;

    @Field(() => String)
    slug: string;

    @Field(() => String)
    thumbUrl: string;

    @Field(() => Int, { nullable: true })
    view: number;
}

@ObjectType()
export class RecentComment {
    @Field(() => String)
    _id: string;

    @Field(() => String)
    content: string;

    @Field(() => String)
    movieId: string;

    @Field(() => String)
    movieName: string;

    @Field(() => String)
    movieSlug: string;

    @Field(() => String)
    userName: string;

    @Field(() => Date)
    createdAt: Date;
}

@ObjectType()
export class UserGrowth {
    @Field(() => Date)
    date: Date;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class MovieGrowth {
    @Field(() => Date)
    date: Date;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class TrendingMovie {
    @Field(() => String)
    _id: string;

    @Field(() => String)
    name: string;

    @Field(() => String)
    slug: string;

    @Field(() => String)
    thumbUrl: string;

    @Field(() => Int, { nullable: true })
    viewsToday: number;

    @Field(() => Date, { nullable: true })
    updatedAt: Date;
}

@ObjectType()
export class RecentActivity {
    @Field(() => String)
    type: string;

    @Field(() => String)
    message: string;

    @Field(() => String, { nullable: true })
    entityId: string;

    @Field(() => String, { nullable: true })
    entityName: string;

    @Field(() => String, { nullable: true })
    entitySlug: string;

    @Field(() => Date)
    timestamp: Date;
}

@ObjectType()
export class DashboardData {
    @Field(() => StatOverview)
    overview: StatOverview;

    @Field(() => [MoviesByType])
    moviesByType: MoviesByType[];

    @Field(() => [TopViewedMovie])
    topViewedMovies: TopViewedMovie[];

    @Field(() => [RecentComment])
    recentComments: RecentComment[];

    @Field(() => [UserGrowth])
    userGrowth: UserGrowth[];

    @Field(() => [MovieGrowth])
    movieGrowth: MovieGrowth[];

    @Field(() => [TrendingMovie])
    trendingToday: TrendingMovie[];

    @Field(() => [RecentActivity])
    recentActivities: RecentActivity[];
}
