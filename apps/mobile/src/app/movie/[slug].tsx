import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
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

const { width, height } = Dimensions.get('window');

export default function MovieScreen() {
    const theme = useTheme();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const navigation = useNavigation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);
    const [selectedServerIndex, setSelectedServerIndex] = useState(new IndexPath(0));
    const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(new IndexPath(0));
    const [error, setError] = useState<string | null>(null);
    const [useEmbedLink, setUseEmbedLink] = useState(false);
    const [isM3u8Available, setIsM3u8Available] = useState(true);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const webViewRef = useRef<WebView>(null);

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

    const preFetchM3u8 = useCallback(async (url: string) => {
        try {
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                throw new Error('M3U8 file not available');
            }
            setIsM3u8Available(true);
            setUseEmbedLink(false);
        } catch (error) {
            setIsM3u8Available(false);
            setUseEmbedLink(true);
        }
    }, []);

    useEffect(() => {
        if (movie?.data?.episode && movie.data.episode.length > 0) {
            const initialEpisode = movie.data.episode[0].serverData[0];
            setSelectedEpisode(initialEpisode);
            if (initialEpisode.linkM3u8) {
                preFetchM3u8(initialEpisode.linkM3u8);
            } else if (initialEpisode.linkEmbed) {
                setUseEmbedLink(true);
                setIsM3u8Available(false);
            } else {
                setError('Phim đang được cập nhật, vui lòng quay lại sau.');
                setIsErrorModalVisible(true);
            }
        } else {
            setError('Phim đang được cập nhật, vui lòng quay lại sau.');
            setIsErrorModalVisible(true);
            return;
        }
    }, [movie, preFetchM3u8]);

    const getVideoUrl = (): string => {
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
    };

    const videoUrl = useMemo(
        () => getVideoUrl(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedEpisode, isM3u8Available, useEmbedLink, movie],
    );
    const handlePlayPress = useCallback(() => {
        if (!error) {
            setIsPlaying(true);
        } else {
            setIsErrorModalVisible(true);
        }
    }, [error]);

    const handleServerChange = (_index: IndexPath | IndexPath[]) => {
        const index = Array.isArray(_index) ? _index[0] : _index;
        setSelectedServerIndex(index);
        setSelectedEpisodeIndex(new IndexPath(0));
        updateSelectedEpisode(index, new IndexPath(0));
    };

    const handleEpisodeChange = (_index: IndexPath | IndexPath[]) => {
        const index = Array.isArray(_index) ? _index[0] : _index;
        setSelectedEpisodeIndex(index);
        updateSelectedEpisode(selectedServerIndex, index);
    };

    const updateSelectedEpisode = (serverIndex: IndexPath, episodeIndex: IndexPath) => {
        const newEpisode = movie?.data?.episode?.[serverIndex.row]?.serverData[episodeIndex.row];
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
                setError('Không thể phát video. Vui lòng thử lại sau hoặc chọn một nguồn khác.');
            }
        } else {
            setError('Tập phim chưa khả dụng. Vui lòng thử lại sau!');
            setIsErrorModalVisible(true);
            return;
        }
    };

    const handleVideoError = () => {
        if (isM3u8Available && !useEmbedLink && selectedEpisode?.linkEmbed) {
            setUseEmbedLink(true);
            setIsM3u8Available(false);
        } else {
            setError('Không thể phát video. Vui lòng thử lại sau hoặc chọn một nguồn khác.');
            setIsErrorModalVisible(true);
            setIsPlaying(false);
        }
    };

    const renderBackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...props} color={theme['text-basic-color']} />}
            onPress={() => navigation.goBack()}
        />
    );

    const renderServerOptions = () => {
        return movie?.data?.episode?.map((server: EpisodeType, index: number) => (
            <SelectItem key={index} title={server.serverName} />
        ));
    };

    const renderEpisodeOptions = () => {
        const currentServer = movie?.data?.episode?.[selectedServerIndex.row];
        return currentServer?.serverData.map((episode: EpisodeServerDataType, index: number) => (
            <SelectItem key={index} title={episode.name} />
        ));
    };

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

    return (
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                    <TouchableOpacity onPress={handlePlayPress} style={styles.posterContainer}>
                        <Image
                            source={{ uri: movie.data.posterUrl || movie.data.thumbUrl }}
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
                                (movie?.data?.episode?.[selectedServerIndex.row]?.serverData
                                    ?.length || 0) -
                                    1
                            }
                        />
                    </View>
                )}
                <View style={styles.selectionContainer}>
                    <Select
                        style={styles.select}
                        label="Máy chủ"
                        value={movie?.data?.episode?.[selectedServerIndex.row]?.serverName}
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
                        {movie.data.name}
                    </Text>
                    <Text category="s1" appearance="hint" style={styles.originalTitle}>
                        {movie.data.originName}
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
                            {movie.data.year || 'N/A'}
                        </Button>
                        <Button
                            appearance="ghost"
                            status="basic"
                            accessoryLeft={(props) => (
                                <Clock {...props} color={theme['text-hint-color']} />
                            )}
                            size="small"
                        >
                            {movie.data.time || 'N/A'}
                        </Button>
                        {movie.data.tmdb?.voteAverage && (
                            <Button
                                appearance="ghost"
                                status="warning"
                                accessoryLeft={(props) => (
                                    <Star {...props} color={theme['color-warning-500']} />
                                )}
                                size="small"
                            >
                                {movie.data.tmdb.voteAverage.toFixed(1)}
                            </Button>
                        )}
                    </View>
                    <Divider style={styles.divider} />
                    <Text category="s1" style={styles.description}>
                        {movie.data.content}
                    </Text>
                    {movie?.data?.categories && movie?.data?.categories?.length > 0 && (
                        <View style={styles.categoriesContainer}>
                            <Text category="s1" style={styles.categoriesTitle}>
                                Thể loại:
                            </Text>
                            <View style={styles.categoriesList}>
                                {movie.data.categories.map((category) => (
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
            </ScrollView>
            {renderErrorModal()}
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
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
        width: '100%',
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
        marginBottom: 16,
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
