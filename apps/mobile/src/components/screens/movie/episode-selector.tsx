import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput, Dimensions } from 'react-native';
import { Text, Modal, Card, useTheme } from '@ui-kitten/components';
import { Search, ChevronDown, X } from 'lucide-react-native';
import type { EpisodeServerDataType, EpisodeType } from '~api/app/movies/movie.type';

interface EpisodeSelectorProps {
    episodes: EpisodeType[];
    selectedEpisode: EpisodeServerDataType | null;
    onEpisodeSelect: (
        episode: EpisodeServerDataType,
        serverIndex: number,
        episodeIndex: number,
    ) => void;
}

export default function EpisodeSelector({
    episodes,
    selectedEpisode,
    onEpisodeSelect,
}: EpisodeSelectorProps) {
    const theme = useTheme();
    const [isServerModalVisible, setIsServerModalVisible] = useState(false);
    const [isEpisodeModalVisible, setIsEpisodeModalVisible] = useState(false);
    const [selectedServerIndex, setSelectedServerIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const episodeListRef = useRef<FlatList>(null);
    const screenWidth = Dimensions.get('window').width;
    const numColumns = Math.floor(screenWidth / 100); // Adjust 100 to change the minimum width of each item

    const handleServerSelect = useCallback(
        (index: number) => {
            setSelectedServerIndex(index);
            setIsServerModalVisible(false);
            if (episodes[index].serverData.length > 0) {
                onEpisodeSelect(episodes[index].serverData[0], index, 0);
            }
        },
        [episodes, onEpisodeSelect],
    );

    const handleEpisodeSelect = useCallback(
        (episode: EpisodeServerDataType, episodeIndex: number) => {
            onEpisodeSelect(episode, selectedServerIndex, episodeIndex);
            setIsEpisodeModalVisible(false);
            setSearchQuery('');
        },
        [onEpisodeSelect, selectedServerIndex, setSearchQuery],
    );

    const filteredEpisodes = useMemo(() => {
        const currentServerData = episodes[selectedServerIndex]?.serverData || [];
        if (!searchQuery) return currentServerData;
        return currentServerData.filter((episode) =>
            episode.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [episodes, selectedServerIndex, searchQuery]);

    const renderServerItem = useCallback(
        ({ item, index }: { item: EpisodeType; index: number }) => (
            <TouchableOpacity
                onPress={() => handleServerSelect(index)}
                style={[
                    styles.serverItem,
                    {
                        backgroundColor:
                            index === selectedServerIndex
                                ? theme['color-primary-500']
                                : theme['background-basic-color-1'],
                    },
                ]}
            >
                <Text
                    style={{
                        color:
                            index === selectedServerIndex
                                ? theme['text-control-color']
                                : theme['text-basic-color'],
                    }}
                >
                    {item.serverName}
                </Text>
            </TouchableOpacity>
        ),
        [handleServerSelect, selectedServerIndex, theme],
    );

    const renderEpisodeItem = useCallback(
        ({ item, index }: { item: EpisodeServerDataType; index: number }) => (
            <TouchableOpacity
                onPress={() => handleEpisodeSelect(item, index)}
                style={[
                    styles.episodeItem,
                    {
                        backgroundColor:
                            item === selectedEpisode
                                ? theme['color-primary-500']
                                : theme['background-basic-color-1'],
                    },
                ]}
            >
                <Text
                    style={{
                        color:
                            item === selectedEpisode
                                ? theme['text-control-color']
                                : theme['text-basic-color'],
                        fontSize: 12,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        ),
        [handleEpisodeSelect, selectedEpisode, theme],
    );

    useEffect(() => {
        if (isEpisodeModalVisible && selectedEpisode && episodeListRef.current) {
            const index = filteredEpisodes.findIndex((ep) => ep === selectedEpisode);
            if (index !== -1) {
                const rowIndex = Math.floor(index / numColumns);
                setTimeout(() => {
                    episodeListRef.current?.scrollToIndex({
                        index: rowIndex,
                        animated: true,
                        viewPosition: 0.5,
                    });
                }, 100);
            }
        }
    }, [isEpisodeModalVisible, selectedEpisode, filteredEpisodes, numColumns]);

    const closeServerModal = () => setIsServerModalVisible(false);
    const closeEpisodeModal = () => setIsEpisodeModalVisible(false);

    const getItemLayout = useCallback(
        (data: unknown, index: number) => ({
            length: 44,
            offset: 44 * index,
            index,
        }),
        [],
    );

    const keyExtractor = useCallback(
        (item: EpisodeServerDataType, index: number) => `episode-${index}`,
        [],
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => setIsServerModalVisible(true)}
                style={[styles.button, { backgroundColor: theme['color-primary-500'] }]}
            >
                <Text
                    style={[styles.buttonText, { color: theme['text-control-color'] }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {episodes[selectedServerIndex]?.serverName || 'Select Server'}
                </Text>
                <ChevronDown color={theme['text-control-color']} size={16} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setIsEpisodeModalVisible(true)}
                style={[styles.button, { backgroundColor: theme['color-primary-500'] }]}
            >
                <Text
                    style={[styles.buttonText, { color: theme['text-control-color'] }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {selectedEpisode?.name || 'Select Episode'}
                </Text>
                <ChevronDown color={theme['text-control-color']} size={16} />
            </TouchableOpacity>

            <Modal
                visible={isServerModalVisible}
                onBackdropPress={closeServerModal}
                style={styles.modal}
            >
                <Card disabled style={{ backgroundColor: theme['background-basic-color-1'] }}>
                    <View style={styles.modalHeader}>
                        <Text category="h6">Select Server</Text>
                        <TouchableOpacity onPress={closeServerModal}>
                            <X color={theme['text-basic-color']} size={24} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={episodes}
                        renderItem={renderServerItem}
                        keyExtractor={(item, index) => `server-${index}`}
                        contentContainerStyle={styles.serverList}
                    />
                </Card>
            </Modal>

            <Modal
                visible={isEpisodeModalVisible}
                onBackdropPress={closeEpisodeModal}
                style={styles.modal}
            >
                <Card disabled style={{ backgroundColor: theme['background-basic-color-1'] }}>
                    <View style={styles.modalHeader}>
                        <Text category="h6">Select Episode</Text>
                        <TouchableOpacity onPress={closeEpisodeModal}>
                            <X color={theme['text-basic-color']} size={24} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={[
                                styles.searchInput,
                                {
                                    backgroundColor: theme['background-basic-color-2'],
                                    color: theme['text-basic-color'],
                                },
                            ]}
                            placeholder="Search episodes..."
                            placeholderTextColor={theme['text-hint-color']}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <Search
                            color={theme['text-hint-color']}
                            size={20}
                            style={styles.searchIcon}
                        />
                    </View>
                    <FlatList
                        ref={episodeListRef}
                        data={filteredEpisodes}
                        renderItem={renderEpisodeItem}
                        keyExtractor={keyExtractor}
                        numColumns={numColumns}
                        contentContainerStyle={styles.episodeGrid}
                        getItemLayout={getItemLayout}
                        onScrollToIndexFailed={(info) => {
                            const wait = new Promise((resolve) => setTimeout(resolve, 500));
                            wait.then(() => {
                                if (episodeListRef.current) {
                                    episodeListRef.current.scrollToIndex({
                                        index: info.index,
                                        animated: true,
                                        viewPosition: 0.5,
                                    });
                                }
                            });
                        }}
                    />
                </Card>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    buttonText: {
        flex: 1,
        marginRight: 8,
    },
    modal: {
        width: '85%',
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    serverList: {
        paddingVertical: 8,
    },
    serverItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingRight: 40,
    },
    searchIcon: {
        position: 'absolute',
        right: 24,
    },
    episodeGrid: {
        paddingHorizontal: 4,
    },
    episodeItem: {
        flex: 1,
        height: 40,
        margin: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        paddingHorizontal: 4,
    },
});
