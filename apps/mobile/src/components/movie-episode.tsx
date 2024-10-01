import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme, Text, Title, Chip, Portal, Modal, IconButton } from 'react-native-paper';
import { ChevronRight, Server } from 'lucide-react-native';
import { EpisodeServerDataType, EpisodeType } from '~api/app/movies/movie.type';
import { randomString } from '@/libs/utils/common';
import { AppTheme } from '~mb/config/theme';

type MovieEpisodeProps = {
    movie: {
        episode?: EpisodeType[];
        trailerUrl?: string;
    };
    onEpisodeSelect: (episode: EpisodeServerDataType, serverIndex: number) => void;
    activeEpisodeSlug: string | null;
    activeServerIndex: number;
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
        theme: AppTheme;
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
    onEpisodeSelect,
    activeEpisodeSlug,
    activeServerIndex,
}: MovieEpisodeProps) {
    const theme = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [serverModalVisible, setServerModalVisible] = useState(false);

    const allEpisodes = useMemo(() => {
        const episodes = movie.episode?.[activeServerIndex]?.serverData || [];
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
    }, [movie.episode, movie.trailerUrl, activeServerIndex]);

    const visibleEpisodes = useMemo(() => {
        const activeEpisodeIndex = allEpisodes.findIndex((ep) => ep.slug === activeEpisodeSlug);
        if (activeEpisodeIndex === -1 || activeEpisodeIndex === 0) {
            return allEpisodes.slice(0, 5);
        }
        const start = Math.max(0, Math.min(activeEpisodeIndex - 2, allEpisodes.length - 5));
        return allEpisodes.slice(start, start + 5);
    }, [allEpisodes, activeEpisodeSlug]);

    const handleEpisodeSelect = useCallback(
        (episode: EpisodeServerDataType) => {
            onEpisodeSelect(episode, activeServerIndex);
            setModalVisible(false);
        },
        [onEpisodeSelect, activeServerIndex],
    );

    const handleServerChange = useCallback(
        (index: number) => {
            const newServerEpisodes = movie.episode?.[index]?.serverData || [];
            const correspondingEpisode =
                newServerEpisodes.find((ep) => ep.name === activeEpisodeSlug) ||
                newServerEpisodes[0];
            if (correspondingEpisode) {
                onEpisodeSelect(correspondingEpisode, index);
            }
            setServerModalVisible(false);
        },
        [movie.episode, activeEpisodeSlug, onEpisodeSelect],
    );

    const renderEpisodeItem = useCallback(
        ({ item }: { item: EpisodeServerDataType }) => (
            <EpisodeItem
                item={item}
                isActive={activeEpisodeSlug === item.slug}
                onPress={() => handleEpisodeSelect(item)}
                theme={theme}
            />
        ),
        [activeEpisodeSlug, handleEpisodeSelect, theme],
    );

    const keyExtractor = useCallback(
        (item: EpisodeServerDataType) => `${item.slug}-${randomString(6)}`,
        [],
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
                        data={allEpisodes}
                        renderItem={renderEpisodeItem}
                        keyExtractor={keyExtractor}
                        numColumns={3}
                        contentContainerStyle={styles.modalEpisodeList}
                        columnWrapperStyle={styles.columnWrapper}
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
                                        index === activeServerIndex && styles.selectedServerItem,
                                    ]}
                                >
                                    <Text style={{ color: theme.colors.onBackground }}>
                                        {item.serverName}
                                    </Text>
                                    {index === activeServerIndex && (
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
