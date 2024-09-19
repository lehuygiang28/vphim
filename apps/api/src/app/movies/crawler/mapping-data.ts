import { removeTone, removeDiacritics } from '@vn-utils/text';
import { words } from 'capitalize';

export const MOVIE_TYPE_MAP = {
    'phim lẻ': 'single',
    'phim bộ': 'series',
    'tv shows': 'tvshows',
    'phim hoạt hình': 'hoathinh',
};

export const mapQuality = (quality: string) => {
    switch (quality.toUpperCase()) {
        case '4K':
            return '4K';
        case 'HD':
        case 'FHD':
        case 'FULL HD':
        case 'FULLHD':
        case 'HD 720P':
        case '^HD':
            return 'HD';
        case 'SD':
        case '360P':
            return 'SD';
        case 'CAM':
            return 'CAM';
        default:
            return quality;
    }
};

export const mapLanguage = (language: string): string => {
    let langRes = '';
    switch (language?.trim()?.toUpperCase()) {
        case 'VIỆT NAM':
        case 'VIETSUB':
        case 'VIETSUB (AI)':
        case '1':
            langRes = 'VIETSUB';
            break;
        case 'LỒNG TIẾNG':
        case 'LỒNG TIẾNG VIỆT':
            langRes = 'LỒNG TIẾNG';
            break;
        case 'THUYẾT MINH ':
        case 'THUYẾT MINH':
            langRes = 'THUYẾT MINH';
            break;
        case 'VIETSUB + THUYẾT MINH':
        case 'VIETSUB + TM':
            langRes = 'VIETSUB + THUYẾT MINH';
            break;
        case 'THUYẾT MINH + LỒNG TIẾNG':
            langRes = 'THUYẾT MINH + LỒNG TIẾNG';
            break;
        case 'NOSUB':
            langRes = 'CHƯA CÓ PHỤ ĐỀ';
            break;
        case 'ENGSUB':
            langRes = 'PHỤ ĐỀ TIẾNG ANH';
            break;
        case 'VIETSUB + LT':
        case 'VIETSUB + LỒNG TIẾNG':
            langRes = 'VIETSUB + LỒNG TIẾNG';
            break;
        case 'VIETSUB + THUYẾT MINH + LỒNG TIẾNG':
            langRes = 'VIETSUB + THUYẾT MINH + LỒNG TIẾNG';
            break;
        default:
            langRes = language?.trim()?.toUpperCase();
            break;
    }

    return words(langRes);
};

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
    console.log(`timeString: ${timeString}`);
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
