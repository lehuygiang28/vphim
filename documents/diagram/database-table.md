# VePhim Database Schema Documentation

This document describes the database schema for the VePhim application, implemented using MongoDB (NoSQL).

## Collections

### User Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| email | string | NOT NULL, UNIQUE | User's email address |
| emailVerified | boolean | DEFAULT(false) | Email verification status |
| password | string | | Hashed password |
| fullName | string | NOT NULL | User's full name |
| role | string | NOT NULL, ENUM | User role (Member, Admin, etc.) |
| avatar | AvatarSchema | | User's avatar information |
| block | UserBlockSchema | | User block status information |
| followMovies | ObjectId[] | | Array of Movie references user follows |

### Movie Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| name | string | NOT NULL | Movie name |
| slug | string | NOT NULL, UNIQUE | URL-friendly identifier |
| originName | string | | Original name in source language |
| content | string | | Movie description/synopsis |
| type | string | | Movie type |
| status | string | | Movie status |
| lang | string | | Movie language |
| notify | string | | Notification text |
| quality | string | | Video quality |
| showtimes | string | | Show times information |
| time | string | | Duration information |
| thumbUrl | string | | Thumbnail image URL |
| posterUrl | string | | Poster image URL |
| trailerUrl | string | | Trailer video URL |
| isCopyright | boolean | DEFAULT(false) | Copyright status |
| episodeCurrent | string | | Current episode info |
| episodeTotal | string | | Total episode count |
| subDocquyen | boolean | DEFAULT(false) | Exclusive subtitle flag |
| cinemaRelease | boolean | DEFAULT(false) | Cinema release status |
| year | number | | Release year |
| view | number | DEFAULT(0) | View count |
| actors | ObjectId[] | | References to actors |
| directors | ObjectId[] | | References to directors |
| categories | ObjectId[] | | References to categories |
| countries | ObjectId[] | | References to regions/countries |
| episode | Episode[] | | Array of episodes |
| lastSyncModified | LastSyncModified | | Sync information |
| tmdb | TmdbSchema | | TMDB metadata |
| imdb | ImdbSchema | | IMDB metadata |
| deletedAt | Date | | Soft delete timestamp |

### Actor Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| name | string | NOT NULL | Actor name |
| originalName | string | NOT NULL | Original name in native language |
| slug | string | NOT NULL | URL-friendly identifier |
| tmdbPersonId | number | | TMDB person identifier |
| content | string | | Biographical information |
| thumbUrl | string | | Thumbnail image URL |
| posterUrl | string | | Poster/profile image URL |

### Director Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| name | string | NOT NULL | Director name |
| originalName | string | NOT NULL | Original name in native language |
| slug | string | NOT NULL | URL-friendly identifier |
| tmdbPersonId | number | | TMDB person identifier |
| content | string | | Biographical information |
| thumbUrl | string | | Thumbnail image URL |
| posterUrl | string | | Poster/profile image URL |

### Category Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| name | string | NOT NULL | Category name |
| slug | string | NOT NULL, UNIQUE | URL-friendly identifier |

### Region Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| name | string | NOT NULL | Region/country name |
| slug | string | NOT NULL, UNIQUE | URL-friendly identifier |

### Comment Collection

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | Primary Key | Unique identifier |
| createdAt | Date | | Document creation timestamp |
| updatedAt | Date | | Document update timestamp |
| user | ObjectId | NOT NULL, REF | Reference to comment author |
| movie | ObjectId | NOT NULL, REF | Reference to commented movie |
| content | string | NOT NULL | Comment text content |
| replyCount | number | DEFAULT(0) | Count of replies |
| parentComment | ObjectId | REF | Reference to parent comment |
| nestingLevel | number | DEFAULT(0) | Comment nesting depth |
| rootParentComment | ObjectId | REF | Reference to top-level parent |
| mentionedUsers | ObjectId[] | | References to mentioned users |
| editedAt | number | | Timestamp of last edit |

## Embedded Documents

These schemas are embedded within parent documents and do not exist as separate collections.

### UserBlockSchema

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| isBlocked | boolean | DEFAULT(false) | User block status |
| activityLogs | BlockActivityLog[] | | History of block actions |

### BlockActivityLog

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| action | string | NOT NULL, ENUM | Action type (block/unblock) |
| actionAt | Date | NOT NULL | Timestamp of action |
| actionBy | ObjectId | NOT NULL, REF | Admin who performed action |
| reason | string | NOT NULL | Reason for action |
| note | string | DEFAULT('') | Additional notes |

### AvatarSchema

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| url | string | NOT NULL | Avatar image URL |

### Episode

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| originSrc | string | DEFAULT('vephim') | Source of episode |
| serverName | string | NOT NULL | Server name |
| serverData | EpisodeServerData[] | NOT NULL | Server data array |

### EpisodeServerData

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| filename | string | DEFAULT('default') | File name |
| name | string | DEFAULT('default') | Display name |
| slug | string | NOT NULL | URL-friendly identifier |
| linkEmbed | string | | Embed link URL |
| linkM3u8 | string | | M3U8 stream URL |

### TmdbSchema

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| type | string | | Content type (tv/movie) |
| id | string | | TMDB ID |
| season | number | | Season number |
| voteAverage | number | DEFAULT(0) | Average vote score |
| voteCount | number | DEFAULT(0) | Total vote count |

### ImdbSchema

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | string | | IMDB ID |

### LastSyncModified

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| ophim | number | | Ophim sync timestamp |
| kkphim | number | | KKphim sync timestamp |
| nguonc | number | | Nguonc sync timestamp |

## Relationships

- **User → Movie**: Many-to-many (users follow multiple movies)
- **Movie → Actor**: Many-to-many (movies have multiple actors)
- **Movie → Director**: Many-to-many (movies have multiple directors)
- **Movie → Category**: Many-to-many (movies belong to multiple categories)
- **Movie → Region**: Many-to-many (movies belong to multiple regions)
- **User → Comment**: One-to-many (users make multiple comments)
- **Movie → Comment**: One-to-many (movies have multiple comments)
- **Comment → Comment**: One-to-many (comments can have replies)