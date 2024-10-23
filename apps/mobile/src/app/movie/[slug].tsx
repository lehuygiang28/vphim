/* eslint-disable react/jsx-no-useless-fragment */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Dimensions,
} from 'react-native';
import { useOne } from '@refinedev/core';
import {
    Layout,
    Text,
    Card,
    Button,
    Spinner,
    TopNavigation,
    TopNavigationAction,
    Divider,
    useTheme,
    Select,
    SelectItem,
    IndexPath,
    Modal,
} from '@ui-kitten/components';
import { Image } from 'expo-image';
import {
    ArrowLeft,
    Calendar,
    Clock,
    PlayCircle,
    Star,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react-native';
import WebView from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import { EpisodeServerDataType, MovieType, EpisodeType } from '~api/app/movies/movie.type';
import { GET_MOVIE_QUERY } from '~fe/queries/movies';
import { truncateText } from '~fe/libs/utils/movie.util';

import MovieRatings from '~mb/components/card/movie-ratings';
import MovieContent from '~mb/components/text/movie-content';
import { MovieRelated } from '~mb/components/list/movie-related';
import { MovieComments } from '~mb/components/comment';

const { width, height } = Dimensions.get('window');

export default function MovieScreen() {
    const theme = useTheme();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const navigation = useNavigation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);
    const [selectedServerIndex, setSelectedServerIndex] = useState(new IndexPath(0));
    const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(new IndexPath(0));
    const [useEmbedLink, setUseEmbedLink] = useState(false);
    const [isM3u8Available, setIsM3u8Available] = useState(true);
    const webViewRef = useRef<WebView>(null);
    const [error, setError] = useState<string | null>(null);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    const { data: movie, isLoading } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: {
            gqlQuery: GET_MOVIE_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    slug: slug,
                },
            },
        },
        id: Array.isArray(slug) ? slug[0] : slug,
    });

    const preFetchM3u8 = useCallback(
        async (url: string) => {
            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) {
                    throw new Error('M3U8 file not available');
                }
                setIsM3u8Available(true);
                setUseEmbedLink(false);
                setError(null);
                setIsErrorModalVisible(false);
            } catch (error) {
                if (retryCount < maxRetries) {
                    setRetryCount((prevCount) => prevCount + 1);
                    setTimeout(() => preFetchM3u8(url), 500); // Retry after 0.5 second
                } else {
                    setIsM3u8Available(false);
                    setUseEmbedLink(true);
                }
            }
        },
        [retryCount, maxRetries],
    );

    const updateSelectedEpisode = useCallback(
        (serverIndex: IndexPath, episodeIndex: IndexPath) => {
            const newEpisode =
                movie?.data?.episode?.[serverIndex.row]?.serverData[episodeIndex.row];
            if (newEpisode) {
                setSelectedEpisode(newEpisode);
                setUseEmbedLink(false);
                setIsM3u8Available(true);
                setError(null);
                if (newEpisode.linkM3u8) {
                    preFetchM3u8(newEpisode.linkM3u8);
                } else if (newEpisode.linkEmbed) {
                    setUseEmbedLink(true);
                    setIsM3u8Available(false);
                } else {
                    setError(
                        'Không thể phát video. Vui lòng thử lại sau hoặc chọn một nguồn khác.',
                    );
                }
            } else {
                setError('Tập phim chưa khả dụng. Vui lòng thử lại sau!');
                setIsErrorModalVisible(true);
            }
        },
        [movie?.data?.episode, preFetchM3u8],
    );

    const handleServerChange = useCallback(
        (_index: IndexPath | IndexPath[]) => {
            const index = Array.isArray(_index) ? _index[0] : _index;
            setSelectedServerIndex(index);
            setSelectedEpisodeIndex(new IndexPath(0));
            updateSelectedEpisode(index, new IndexPath(0));
        },
        [updateSelectedEpisode],
    );

    const handleEpisodeChange = useCallback(
        (_index: IndexPath | IndexPath[]) => {
            const index = Array.isArray(_index) ? _index[0] : _index;
            setSelectedEpisodeIndex(index);
            updateSelectedEpisode(selectedServerIndex, index);
        },
        [selectedServerIndex, updateSelectedEpisode],
    );

    const handleVideoError = useCallback(() => {
        if (isM3u8Available && !useEmbedLink && selectedEpisode?.linkEmbed) {
            setUseEmbedLink(true);
            setIsM3u8Available(false);
        } else if (retryCount < maxRetries) {
            setRetryCount((prevCount) => prevCount + 1);
            setTimeout(() => {
                if (webViewRef.current) {
                    webViewRef.current.reload();
                }
            }, 1000); // Retry after 1 second
        } else {
            setError('Không thể phát video. Vui lòng thử lại sau hoặc chọn một nguồn khác.');
            setIsErrorModalVisible(true);
            setIsPlaying(false);
        }
    }, [isM3u8Available, useEmbedLink, selectedEpisode, retryCount, maxRetries]);

    const getVideoUrl = useCallback((): string => {
        if (!selectedEpisode) return '';

        if (!isM3u8Available || useEmbedLink) {
            return selectedEpisode.linkEmbed || '';
        }

        if (!selectedEpisode.linkM3u8) {
            return '';
        }

        return `${process.env.EXPO_PUBLIC_BASE_PLAYER_URL}/player/${encodeURIComponent(
            selectedEpisode.linkM3u8,
        )}?movieSlug=${encodeURIComponent(movie?.data.slug || '')}&ep=${encodeURIComponent(
            selectedEpisode.slug,
        )}`;
    }, [isM3u8Available, useEmbedLink, selectedEpisode, movie?.data?.slug]);

    const videoUrl = useMemo(() => getVideoUrl(), [getVideoUrl]);

    const handlePlayPress = useCallback(() => {
        if (!error) {
            setIsPlaying(true);
        } else {
            setIsErrorModalVisible(true);
        }
    }, [error]);

    const renderBackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...props} color={theme['text-basic-color']} />}
            onPress={() => navigation.goBack()}
        />
    );

    const renderServerOptions = useCallback(() => {
        return movie?.data?.episode?.map((server: EpisodeType, index: number) => (
            <SelectItem key={index} title={server.serverName} />
        ));
    }, [movie?.data?.episode]);

    const renderEpisodeOptions = useCallback(() => {
        const currentServer = movie?.data?.episode?.[selectedServerIndex.row];
        return currentServer?.serverData.map((episode: EpisodeServerDataType, index: number) => (
            <SelectItem key={index} title={episode.name} />
        ));
    }, [movie?.data?.episode, selectedServerIndex.row]);

    const renderErrorModal = () => (
        <Modal
            visible={isErrorModalVisible}
            backdropStyle={styles.backdrop}
            onBackdropPress={() => setIsErrorModalVisible(false)}
            style={styles.modalContainer}
        >
            <Card disabled={true} style={styles.modalCard}>
                <AlertTriangle
                    color={theme['color-danger-500']}
                    size={48}
                    style={styles.modalIcon}
                />
                <Text category="h6" style={styles.modalTitle}>
                    Oops! Đã xảy ra lỗi
                </Text>
                <Text style={styles.modalText}>{error?.toString()}</Text>
                <Button onPress={() => setIsErrorModalVisible(false)}>OK</Button>
            </Card>
        </Modal>
    );

    const renderItem = useCallback(
        ({ item }: { item: { type: string } }) => {
            switch (item.type) {
                case 'header':
                    return (
                        <>
                            {isPlaying && selectedEpisode && !error ? (
                                <View style={styles.playerContainer}>
                                    <WebView
                                        ref={webViewRef}
                                        source={{
                                            uri: videoUrl,
                                            headers: {
                                                'User-Agent':
                                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36',
                                            },
                                        }}
                                        style={styles.webView}
                                        allowsFullscreenVideo
                                        onError={handleVideoError}
                                        javaScriptEnabled
                                        domStorageEnabled
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handlePlayPress}
                                    style={styles.posterContainer}
                                >
                                    <Image
                                        source={{
                                            uri: movie?.data.posterUrl || movie?.data.thumbUrl,
                                        }}
                                        style={styles.poster}
                                        contentFit="cover"
                                    />
                                    <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
                                        <PlayCircle color={theme['text-basic-color']} size={64} />
                                    </BlurView>
                                </TouchableOpacity>
                            )}
                            {isPlaying && !error && (
                                <View style={styles.controls}>
                                    <Button
                                        accessoryLeft={(props) => <ChevronLeft {...props} />}
                                        onPress={() => {
                                            if (selectedEpisodeIndex.row > 0) {
                                                handleEpisodeChange(
                                                    new IndexPath(selectedEpisodeIndex.row - 1),
                                                );
                                            }
                                        }}
                                        appearance="ghost"
                                        disabled={selectedEpisodeIndex.row === 0}
                                    />
                                    <Button
                                        accessoryRight={(props) => <ChevronRight {...props} />}
                                        onPress={() => {
                                            const currentServer =
                                                movie?.data?.episode?.[selectedServerIndex.row];
                                            if (
                                                selectedEpisodeIndex.row <
                                                (currentServer?.serverData?.length || 0) - 1
                                            ) {
                                                handleEpisodeChange(
                                                    new IndexPath(selectedEpisodeIndex.row + 1),
                                                );
                                            }
                                        }}
                                        appearance="ghost"
                                        disabled={
                                            selectedEpisodeIndex.row ===
                                            (movie?.data?.episode?.[selectedServerIndex.row]
                                                ?.serverData?.length || 0) -
                                                1
                                        }
                                    />
                                </View>
                            )}
                            <View style={styles.selectionContainer}>
                                <Select
                                    style={styles.select}
                                    label="Máy chủ"
                                    value={
                                        movie?.data?.episode?.[selectedServerIndex.row]?.serverName
                                    }
                                    selectedIndex={selectedServerIndex}
                                    onSelect={handleServerChange}
                                >
                                    {renderServerOptions()}
                                </Select>
                                <Select
                                    style={styles.select}
                                    label="Chọn tập"
                                    value={selectedEpisode?.name}
                                    selectedIndex={selectedEpisodeIndex}
                                    onSelect={handleEpisodeChange}
                                >
                                    {renderEpisodeOptions()}
                                </Select>
                            </View>
                            <Card style={styles.infoCard} status="basic">
                                <Text category="h5" style={styles.title}>
                                    {movie?.data.name}
                                </Text>
                                <Text category="s1" appearance="hint" style={styles.originalTitle}>
                                    {movie?.data.originName}
                                </Text>
                                <View style={styles.metaInfo}>
                                    <Button
                                        appearance="ghost"
                                        status="basic"
                                        accessoryLeft={(props) => (
                                            <Calendar {...props} color={theme['text-hint-color']} />
                                        )}
                                        size="small"
                                    >
                                        {movie?.data.year || 'N/A'}
                                    </Button>
                                    <Button
                                        appearance="ghost"
                                        status="basic"
                                        accessoryLeft={(props) => (
                                            <Clock {...props} color={theme['text-hint-color']} />
                                        )}
                                        size="small"
                                    >
                                        {movie?.data.time || 'N/A'}
                                    </Button>
                                    {movie?.data.tmdb?.voteAverage && (
                                        <Button
                                            appearance="ghost"
                                            status="warning"
                                            accessoryLeft={(props) => (
                                                <Star
                                                    {...props}
                                                    color={theme['color-warning-500']}
                                                />
                                            )}
                                            size="small"
                                        >
                                            {movie?.data.tmdb.voteAverage.toFixed(1)}
                                        </Button>
                                    )}
                                </View>
                                <Divider style={styles.divider} />
                                {(movie?.data?.imdb?.id || movie?.data?.tmdb?.id) && (
                                    <>
                                        <Text category="s1" style={styles.categoriesTitle}>
                                            Đánh giá:
                                        </Text>
                                        <MovieRatings
                                            imdbId={movie?.data?.imdb?.id}
                                            tmdbId={movie?.data?.tmdb?.id}
                                            tmdbType={movie?.data?.tmdb?.type}
                                            size="small"
                                        />
                                        <Divider style={styles.divider} />
                                    </>
                                )}

                                <MovieContent content={movie?.data?.content} maxLines={5} />
                                <Divider style={styles.divider} />

                                {movie?.data?.categories && movie?.data?.categories?.length > 0 && (
                                    <View style={styles.categoriesContainer}>
                                        <Text category="s1" style={styles.categoriesTitle}>
                                            Thể loại:
                                        </Text>
                                        <View style={styles.categoriesList}>
                                            {movie?.data.categories.map((category) => (
                                                <Button
                                                    key={category.slug}
                                                    size="tiny"
                                                    appearance="outline"
                                                    status="basic"
                                                    style={styles.categoryButton}
                                                >
                                                    {category.name}
                                                </Button>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </Card>
                        </>
                    );
                case 'related':
                    return movie?.data ? <MovieRelated movie={movie?.data} /> : <></>;
                case 'comments':
                    return movie?.data ? (
                        <MovieComments movieId={movie?.data?._id?.toString()} />
                    ) : (
                        <></>
                    );
                default:
                    return <></>;
            }
        },
        [
            isPlaying,
            selectedEpisode,
            error,
            videoUrl,
            movie,
            handlePlayPress,
            theme,
            handleVideoError,
            handleEpisodeChange,
            selectedEpisodeIndex,
            selectedServerIndex,
            handleServerChange,
            renderServerOptions,
            renderEpisodeOptions,
        ],
    );

    if (isLoading) {
        return (
            <Layout style={styles.loadingContainer} level="2">
                <Spinner size="large" />
            </Layout>
        );
    }

    if (!movie?.data) {
        return (
            <Layout style={styles.errorContainer} level="2">
                <Text category="h5">Phim đang cập nhật, vui lòng thử lại sau!</Text>
            </Layout>
        );
    }

    const sections = [{ type: 'header' }, { type: 'comments' }, { type: 'related' }];

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme['background-basic-color-2'] }]}
        >
            <Layout style={styles.container} level="2">
                <TopNavigation
                    title={() => (
                        <Text category="h6" ellipsizeMode="tail">
                            {truncateText(movie?.data?.name, 30)}
                        </Text>
                    )}
                    alignment="center"
                    accessoryLeft={renderBackAction}
                    style={styles.topNavigation}
                />
                <FlatList
                    data={sections}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `${item.type}-${index}`}
                    contentContainerStyle={styles.scrollContent}
                />
                {renderErrorModal()}
            </Layout>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
    },
    topNavigation: {
        backgroundColor: 'transparent',
    },
    playerContainer: {
        width: width,
        height: width * (9 / 16),
        position: 'relative',
    },
    webView: {
        width: '100%',
        height: '100%',
    },
    posterContainer: {
        width: '100%',
        height: height * 0.25,
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
    },
    selectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 16,
    },
    select: {
        flex: 1,
        marginHorizontal: 4,
    },
    infoCard: {
        margin: 16,
        backgroundColor: 'transparent',
    },
    title: {
        marginBottom: 4,
    },
    originalTitle: {
        marginBottom: 12,
    },
    metaInfo: {
        flexDirection: 'row',
    },
    divider: {
        marginVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    description: {
        lineHeight: 20,
        marginBottom: 16,
    },
    categoriesContainer: {
        marginTop: 16,
    },
    categoriesTitle: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    categoriesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryButton: {
        marginRight: 8,
        marginBottom: 8,
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '80%',
        maxWidth: 300,
        borderRadius: 8,
        padding: 16,
    },
    modalIcon: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    modalText: {
        textAlign: 'center',
        marginBottom: 16,
    },
});
