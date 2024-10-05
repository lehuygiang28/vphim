import { createHash } from 'node:crypto';

export function getGravatarUrl(email: string, size = 500, defaultImage = 'mp', rating = 'g') {
    const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    return `https://gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}&r=${rating}`;
}
