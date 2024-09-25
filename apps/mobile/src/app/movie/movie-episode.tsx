import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme, Text, Title, Chip, Portal, Modal, IconButton } from 'react-native-paper';
import { ChevronRight, Server } from 'lucide-react-native';
import { EpisodeServerDataType, EpisodeType } from '~api/app/movies/movie.type';
import { randomString } from '@/libs/utils/common';
import { CustomDarkTheme } from '~mb/config/theme';

type MovieEpisodeProps = {
    movie: {
        episode?: EpisodeType[];
        trailerUrl?: string;
    };
    activeEpisodeSlug?: string;
    activeServerIndex?: number;
    onEpisodePress: (episode: EpisodeServerDataType) => void;
    onServerChange?: (index: number) => void;
};

const EpisodeItem = React.memo(
    ({
        item,
        isActive,
        onPress,
        theme,
    }: {
        item: EpisodeServerDataType;
        isActive: boolean;
        onPress: () => void;
        theme: typeof CustomDarkTheme;
    }) => (
        <Chip
            mode={isActive ? 'flat' : 'outlined'}
            onPress={onPress}
            style={[
                styles.episodeChip,
                isActive && { backgroundColor: theme.colors.primaryContainer },
            ]}
            textStyle={[
                styles.episodeChipText,
                isActive && { color: theme.colors.onPrimaryContainer },
            ]}
        >
            {item.slug === 'trailer' ? 'Trailer' : item.name}
        </Chip>
    ),
);

export default function MovieEpisode({
    movie,
    activeEpisodeSlug,
    activeServerIndex = 0,
    onEpisodePress,
    onServerChange,
}: MovieEpisodeProps) {
    const theme = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [serverModalVisible, setServerModalVisible] = useState(false);
    const episodeListRef = useRef<FlatList>(null);
    const [selectedServer, setSelectedServer] = useState(activeServerIndex);

    const allEpisodes = useMemo(() => {
        const episodes = movie.episode?.[selectedServer]?.serverData || [];
        return movie.trailerUrl
            ? [
                  {
                      slug: 'trailer',
                      name: 'Trailer',
                      filename: 'trailer',
                      linkM3u8: movie.trailerUrl,
                      linkEmbed: movie.trailerUrl,
                  },
                  ...episodes,
              ]
            : episodes;
    }, [movie.episode, movie.trailerUrl, selectedServer]);

    const visibleEpisodes = useMemo(() => {
        const activeEpisodeIndex = allEpisodes.findIndex((ep) => ep.slug === activeEpisodeSlug);
        if (activeEpisodeIndex === -1 || activeEpisodeIndex === 0) {
            return allEpisodes.slice(0, 5);
        }

        const start = Math.max(0, Math.min(activeEpisodeIndex - 2, allEpisodes.length - 5));
        return allEpisodes.slice(start, start + 5);
    }, [allEpisodes, activeEpisodeSlug]);

    const renderEpisodeItem = useCallback(
        ({ item }: { item: EpisodeServerDataType }) => (
            <EpisodeItem
                item={item}
                isActive={activeEpisodeSlug === item.slug}
                onPress={() => {
                    onEpisodePress(item);
                    setModalVisible(false);
                }}
                theme={theme}
            />
        ),
        [activeEpisodeSlug, onEpisodePress, theme],
    );

    const keyExtractor = useCallback(
        (item: EpisodeServerDataType) => `${item.slug}-${randomString(6)}`,
        [],
    );

    const handleServerChange = useCallback(
        (index: number) => {
            setSelectedServer(index);
            if (onServerChange) {
                onServerChange(index);
            }
            setServerModalVisible(false);
        },
        [onServerChange],
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Title style={[styles.title, { color: theme.colors.primary }]}>Tập phim</Title>
                <View style={styles.headerButtons}>
                    {movie.episode && movie.episode.length > 1 && (
                        <IconButton
                            icon={() => <Server color={theme.colors.primary} size={24} />}
                            onPress={() => setServerModalVisible(true)}
                        />
                    )}
                    <IconButton
                        icon={() => <ChevronRight color={theme.colors.primary} size={24} />}
                        onPress={() => setModalVisible(true)}
                    />
                </View>
            </View>
            <FlatList
                data={visibleEpisodes}
                renderItem={renderEpisodeItem}
                keyExtractor={keyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowEpisodeList}
                ListEmptyComponent={() => (
                    <Text style={{ color: theme.colors.error }}>Phim đang cập nhật...</Text>
                )}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
            />
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={[
                        styles.modalContent,
                        { backgroundColor: theme.colors.background },
                    ]}
                >
                    <Title style={[styles.modalTitle, { color: theme.colors.primary }]}>
                        Danh sách tập phim
                    </Title>
                    <FlatList
                        ref={episodeListRef}
                        data={allEpisodes}
                        renderItem={renderEpisodeItem}
                        keyExtractor={keyExtractor}
                        numColumns={3}
                        contentContainerStyle={styles.modalEpisodeList}
                        columnWrapperStyle={styles.columnWrapper}
                        initialNumToRender={15}
                        maxToRenderPerBatch={15}
                        windowSize={5}
                        removeClippedSubviews={true}
                    />
                </Modal>
                <Modal
                    visible={serverModalVisible}
                    onDismiss={() => setServerModalVisible(false)}
                    contentContainerStyle={[
                        styles.modalContent,
                        { backgroundColor: theme.colors.background },
                    ]}
                >
                    <Title style={[styles.modalTitle, { color: theme.colors.primary }]}>
                        Chọn máy chủ
                    </Title>
                    <FlatList
                        data={movie.episode}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity onPress={() => handleServerChange(index)}>
                                <View
                                    style={[
                                        styles.serverItem,
                                        index === selectedServer && styles.selectedServerItem,
                                    ]}
                                >
                                    <Text style={{ color: theme.colors.onBackground }}>
                                        {item.serverName}
                                    </Text>
                                    {index === selectedServer && (
                                        <Text style={{ color: theme.colors.primary }}>✓</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => `server-${index}`}
                    />
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerButtons: {
        flexDirection: 'row',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    rowEpisodeList: {
        gap: 8,
    },
    episodeChip: {
        marginBottom: 8,
    },
    episodeChipText: {
        fontSize: 12,
    },
    modalContent: {
        padding: 20,
        margin: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    modalEpisodeList: {
        flexGrow: 1,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    serverItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectedServerItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});
