import { removeTone, removeDiacritics } from '@vn-utils/text';
import { slugifyVietnamese } from 'apps/api/src/libs/utils/common';
import { MovieQualityEnum } from '../movie.constant';

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
        case 'hd':
        case 'fhd':
        case 'full hd':
        case 'fullhd':
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
