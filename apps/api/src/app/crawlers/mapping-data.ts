import { removeTone, removeDiacritics } from '@vn-utils/text';
import { slugifyVietnamese } from 'apps/api/src/libs/utils/common';
import { MovieContentRatingEnum, MovieQualityEnum } from '../movies/movie.constant';
import type { ShowContentRatingResponse, MovieReleaseDatesResponse } from 'moviedb-promise';

export const MOVIE_TYPE_MAP = {
    'phim lẻ': 'single',
    'phim bộ': 'series',
    'tv shows': 'tvshows',
    'phim hoạt hình': 'hoathinh',
    single: 'single',
    series: 'series',
    tvshows: 'tvshows',
    hoathinh: 'hoathinh',
};

export const mapQuality = (quality: string): MovieQualityEnum | string => {
    switch (quality.toLowerCase()) {
        case '4k':
            return MovieQualityEnum._4K;
        case 'fhd':
        case 'full hd':
        case 'fullhd':
            return MovieQualityEnum.FHD;
        case 'hd':
        case 'hd 720p':
        case '^hd':
            return MovieQualityEnum.HD;
        case 'sd':
        case '360p':
            return MovieQualityEnum.SD;
        case 'cam':
            return MovieQualityEnum.CAM;
        default:
            return quality.toLowerCase();
    }
};

export const mapLanguage = (language: string): string => {
    let langRes = '';
    switch (language?.trim()?.normalize()?.toLowerCase()) {
        case 'việt nam':
        case 'vietsub':
        case 'vietsub (ai)':
        case '1':
            langRes = 'vietsub';
            break;
        case 'lồng tiếng':
        case 'lồng tiếng việt':
            langRes = 'lồng tiếng';
            break;
        case 'thuyết minh ':
        case 'thuyết minh':
            langRes = 'thuyết minh';
            break;
        case 'vietsub + thuyết minh':
        case 'vietsub + tm':
            langRes = 'vietsub, thuyết minh';
            break;
        case 'thuyết minh + lồng tiếng':
            langRes = 'thuyết minh, lồng tiếng';
            break;
        case 'nosub':
            langRes = 'chưa có phụ đề';
            break;
        case 'engsub':
            langRes = 'phụ đề tiếng anh';
            break;
        case 'vietsub + lt':
        case 'vietsub + lồng tiếng':
            langRes = 'vietsub, lồng tiếng';
            break;
        case 'vietsub + thuyết minh + lồng tiếng':
            langRes = 'vietsub, thuyết minh, lồng tiếng';
            break;
        default:
            langRes = language?.trim()?.toLowerCase();
            break;
    }

    return langRes;
};

export function mapStatus(status: string): string {
    switch (status?.trim()?.toLowerCase()) {
        case 'ongoing':
        case 'completed':
        case 'trailer':
            return status?.toLowerCase();
        case 'updating':
        default:
            return 'updating';
    }
}

const wordMap: { [key: string]: string } = {
    gio: 'tiếng',
    tieng: 'tiếng',
    phut: 'phút',
    giay: 'giây',
    tap: 'tập',
    'dang cap nhat': 'Đang cập nhật',
};

function normalizeAndCorrect(input: string): string {
    const normalized = removeDiacritics(removeTone(input?.trim())).toLowerCase();

    return normalized
        .split(/\s+/)
        .map((word) => {
            if (/^\d+$/.test(word)) return word;
            return wordMap[word] || word;
        })
        .join(' ');
}

export function convertToVietnameseTime(timeString: string): string {
    if (
        !timeString ||
        timeString.toLowerCase().includes('cập nhật') ||
        timeString.toLowerCase().includes('undefined') ||
        timeString.toLowerCase().includes('null') ||
        timeString.trim() === ''
    ) {
        return 'Đang cập nhật';
    }

    const normalizedTime = normalizeAndCorrect(timeString);

    // Handle range format (e.g., "120-140 phút")
    if (normalizedTime.includes('-')) {
        const [start, end] = normalizedTime.split('-').map((part) => part.trim());
        const startTime = convertSingleTime(start);
        const endTime = convertSingleTime(end);
        if (startTime === 'Đang cập nhật' || endTime === 'Đang cập nhật') {
            return 'Đang cập nhật';
        }
        return `${startTime} - ${endTime}`;
    }

    // Handle "per episode" format, correcting typos
    const perEpisodeMatch = normalizedTime.match(
        /(.+?)\s*(?:\/|per)\s*(?:tap|episode|t[aâ]p|ta|tâ|tậ)/i,
    );
    if (perEpisodeMatch) {
        const episodeTime = convertSingleTime(perEpisodeMatch[1]);
        return episodeTime === 'Đang cập nhật' ? 'Đang cập nhật' : `${episodeTime}/tập`;
    }

    return convertSingleTime(normalizedTime);
}

function convertSingleTime(timePart: string): string {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // Handle HH:MM:SS and MM:SS formats
    if (timePart.includes(':')) {
        const parts = timePart.split(':');
        if (parts.length === 3) {
            hours = parseInt(parts[0]) || 0;
            minutes = parseInt(parts[1]) || 0;
            seconds = parseInt(parts[2]) || 0;
        } else if (parts.length === 2) {
            minutes = parseInt(parts[0]) || 0;
            seconds = parseInt(parts[1]) || 0;
        }
    } else {
        // Handle written formats (e.g., "2g 12phút", "45M14S")
        const hourMatch = timePart.match(/(\d+(?:\.\d+)?)\s*(?:g|h|gio|hour|tieng)/i);
        const minuteMatch = timePart.match(/(\d+(?:\.\d+)?)\s*(?:m|p|ph|phut|min)/i);
        const secondMatch = timePart.match(/(\d+(?:\.\d+)?)\s*(?:s|giay|sec)/i);

        hours = hourMatch ? parseFloat(hourMatch[1]) : 0;
        minutes = minuteMatch ? parseFloat(minuteMatch[1]) : 0;
        seconds = secondMatch ? parseFloat(secondMatch[1]) : 0;

        // Handle decimal hours (e.g., 1.5h)
        if (hours % 1 !== 0) {
            minutes += (hours % 1) * 60;
            hours = Math.floor(hours);
        }

        // If no specific unit is found, try to parse as minutes
        if (!hourMatch && !minuteMatch && !secondMatch) {
            minutes = parseFloat(timePart) || 0;
        }
    }

    // Round seconds to the nearest minute
    if (seconds >= 30) {
        minutes += 1;
    }

    // Round minutes
    minutes = Math.round(minutes);

    // Adjust hours and minutes
    if (minutes >= 60) {
        hours += Math.floor(minutes / 60);
        minutes %= 60;
    }

    if (hours === 0 && minutes === 0 && seconds === 0) {
        return 'Đang cập nhật';
    }

    let result = '';
    if (hours > 0) {
        result += `${hours} tiếng`;
        if (minutes > 0) {
            result += ` ${minutes < 10 ? '0' : ''}${minutes} phút`;
        }
    } else if (minutes > 0) {
        result += `${minutes} phút`;
    } else if (seconds > 0) {
        result += `${seconds} giây`;
    }

    return result.trim();
}

export function mappingNameSlugEpisode(item: { name: string; slug?: string }, index: number) {
    let name = item?.name.trim();
    let slug = item?.slug.trim();

    // Not have name but have slug
    if (!name && slug) {
        // and slug is only number
        if (!isNaN(Number(slug))) {
            name = `Tập ${Number(slug) < 10 ? '0' : ''}${slug}`;
        }
    }

    // Not have name
    if (!name) {
        name = `Tập ${index + 1 < 10 ? '0' : ''}${index + 1}`;
    }

    // Name is only number
    if (!isNaN(Number(name))) {
        name = `Tập ${Number(name) < 10 ? '0' : ''}${name}`;
    }

    // Name can multi episode: "124-125"
    if (name?.includes('-')) {
        const names = name
            ?.split('-')
            .map((a) => a.trim())
            .filter((a) => a !== '');
        name = `Tập ${names?.join('-')}`;
    }
    slug = slugifyVietnamese(name, { lower: true });
    return { name, slug };
}

export function mappingContentRating(age: string): MovieContentRatingEnum {
    switch (age?.trim()?.toLowerCase()) {
        // 18+ category (adult content)
        case 'r': // R in US
        case 'nc-17': // NC-17 in US
        case 'ma15+': // Australia
        case '18': // UK, Germany (DE)
        case '18+':
        case '17+': // Indonesia
        case 'a': // India
        case 'm18': // Singapore
        case 'iib': // Hong Kong
        case 'iii': // Hong Kong
        case 'r-16': // Philippines
        case 't18':
        case 'fsk-18': // Germany explicit
        case 'x': // Used for adult content in some regions
        case 'xxx': // Used for adult content in some regions
            return MovieContentRatingEnum.T18;

        // 16+ category
        case '16+':
        case '15': // UK
        case '15a': // Ireland
        case 'm/14': // Portugal
        case 'b-15': // Mexico
        case 'n-16': // Lithuania
        case '16': // Multiple countries including Germany (DE)
        case 'iia': // Hong Kong
        case 't16':
        case 'fsk-16': // Germany explicit
            return MovieContentRatingEnum.T16;

        // 13+ category
        case '13+':
        case 'pg-13': // PG-13 in US
        case '12': // UK, Switzerland, Germany
        case '12a': // UK
        case 'm': // Australia, New Zealand
        case '14': // Chile
        case '14a': // Canada
        case 'teen': // Alternative notation
        case 't13':
        case 'fsk-12': // Germany explicit
            return MovieContentRatingEnum.T13;

        // Kids category
        case '7+':
        case 'pg': // PG in US
        case '8': // UK
        case 'k-7': // Alternative notation
        case 'k': // Vietnam (often in note field)
        case 'fsk-6': // Germany
        case '6': // Germany
            return MovieContentRatingEnum.K;

        // C category is for banned/restricted content (not suitable for public distribution)
        case 'banned':
        case 'restricted':
        case 'prohibited':
        case 'c':
            return MovieContentRatingEnum.C;

        // P category and general audience ratings
        case 'all': // All ages (Korea)
        case 'e': // E for Everyone (gaming)
        case 'g': // G in US, Japan, Thailand
        case 'u': // U in UK, Malaysia
        case 'tv-y': // US TV
        case 'tv-y7': // US TV
        case 'tp': // France - Tous Publics (All Audiences)
        case 'i': // Hong Kong category I
        case '0+': // Taiwan
        case 'l': // Portugal
        case 'p':
        case 'fsk-0': // Germany
        case '0': // Germany
            return MovieContentRatingEnum.P;

        default:
            return MovieContentRatingEnum.P;
    }
}

export function determineContentRating(
    movieData: MovieReleaseDatesResponse | ShowContentRatingResponse | null,
): MovieContentRatingEnum {
    // Handle null case
    if (!movieData) {
        return MovieContentRatingEnum.P;
    }

    // Type guard to check if it's a MovieReleaseDatesResponse
    const isMovieReleaseDates = (data: any): data is MovieReleaseDatesResponse => {
        return data.results && data.results[0] && 'release_dates' in data.results[0];
    };

    // Handle MovieReleaseDatesResponse
    if (isMovieReleaseDates(movieData)) {
        if (!movieData.results || movieData.results.length === 0) {
            return MovieContentRatingEnum.P;
        }

        // First priority: Find Vietnamese rating
        const vnRelease = movieData.results.find((country) => country.iso_3166_1 === 'VN');

        if (vnRelease?.release_dates) {
            for (const release of vnRelease.release_dates) {
                // Check both certification and note fields for Vietnamese releases
                if (release.iso_639_1 === 'vi' && release.certification) {
                    return mappingContentRating(release.certification);
                }

                if (release.iso_639_1 === 'vi' && release.note) {
                    return mappingContentRating(release.note);
                }

                // If language code isn't specified but we have certification/note
                if (release.certification) {
                    return mappingContentRating(release.certification);
                }

                if (release.note) {
                    return mappingContentRating(release.note);
                }
            }
        }

        // Second priority: Find US rating
        const usRelease = movieData.results.find((country) => country.iso_3166_1 === 'US');

        if (usRelease?.release_dates) {
            for (const release of usRelease.release_dates) {
                if (release.certification) {
                    return mappingContentRating(release.certification);
                }
            }
        }

        // Third priority: Use any available rating from any country
        for (const country of movieData.results) {
            if (country.release_dates) {
                for (const release of country.release_dates) {
                    if (release.certification) {
                        return mappingContentRating(release.certification);
                    }

                    if (release?.note) {
                        const note = release.note.toUpperCase();
                        if (
                            note === 'K' ||
                            note === 'P' ||
                            note === 'T13' ||
                            note === 'T16' ||
                            note === 'T18' ||
                            note === 'C'
                        ) {
                            return mappingContentRating(release.note);
                        }
                    }
                }
            }
        }
    }
    // Handle ShowContentRatingResponse
    else if (movieData.results && movieData.results.length > 0) {
        // First priority: Find Vietnamese rating
        const vnRating = movieData.results.find((country) => country.iso_3166_1 === 'VN');

        if (vnRating?.rating) {
            return mappingContentRating(vnRating.rating);
        }

        // Second priority: Find US rating
        const usRating = movieData.results.find((country) => country.iso_3166_1 === 'US');

        if (usRating?.rating) {
            return mappingContentRating(usRating.rating);
        }

        // Third priority: Use any available rating
        for (const country of movieData.results) {
            if (country.rating) {
                return mappingContentRating(country.rating);
            }
        }
    }

    // If no ratings found, default to P
    return MovieContentRatingEnum.P;
}
