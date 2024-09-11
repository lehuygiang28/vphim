import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';

export const movieTypeTranslations = {
    [MovieTypeEnum.SINGLE]: 'Phim lẻ',
    [MovieTypeEnum.SERIES]: 'Phim bộ',
    [MovieTypeEnum.TV_SHOWS]: 'Chương trình TV',
    [MovieTypeEnum.HOAT_HINH]: 'Hoạt hình',
};
