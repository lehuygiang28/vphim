import { useState } from 'react';
import { Button, Modal, Select, Input } from 'antd';
import { BaseKey, useGetIdentity, useUpdate } from '@refinedev/core';

import { type UserType } from '~api/app/users/user.type';
import { BlockUserDto } from '~api/app/users/dtos';

const DEFAULT_BLOCK_REASON = 'Spam';
const { TextArea } = Input;
const { Option } = Select;

export type BlockOrUnblockUserProps = Readonly<{
    user: UserType;
    idParam: BaseKey;
}>;

export function BlockOrUnblockUser(props: BlockOrUnblockUserProps) {
    const { user, idParam } = props;
    const { data: me, isLoading: isIdentityLoading } = useGetIdentity<UserType>();

    const { mutate } = useUpdate({
        mutationOptions: {},
    });

    const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);
    const [isUnblockModalVisible, setIsUnblockModalVisible] = useState(false);
    const [blockReason, setBlockReason] = useState(DEFAULT_BLOCK_REASON);
    const [customReason, setCustomReason] = useState('');

    const handleBlock = (data: BlockUserDto) => {
        mutate({
            resource: 'users/block',
            id: user?._id.toString(),
            values: { ...data, reason: blockReason === 'Other' ? customReason : blockReason },
            invalidates: ['all'],
        });
        setIsBlockModalVisible(false);
    };

    const handleUnblock = () => {
        mutate({
            resource: 'users/unblock',
            id: user?._id.toString(),
            values: {},
            invalidates: ['all'],
        });
        setIsUnblockModalVisible(false);
    };

    const handleBlockReasonChange = (value: string) => {
        setBlockReason(value);
        if (value !== 'Khác') {
            setCustomReason('');
        }
    };

    const handleCustomReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCustomReason(e.target.value);
    };

    const restoreDefault = () => {
        setBlockReason(DEFAULT_BLOCK_REASON);
        setCustomReason('');
        setIsBlockModalVisible(false);
        setIsUnblockModalVisible(false);
    };

    return (
        <>
            {!isIdentityLoading &&
                me?._id?.toString() !== idParam?.toString() &&
                (user?.block?.isBlocked ? (
                    <Button onClick={() => setIsUnblockModalVisible(true)}>Bỏ chặn</Button>
                ) : (
                    <Button danger onClick={() => setIsBlockModalVisible(true)}>
                        Chặn
                    </Button>
                ))}

            <>
                <Modal
                    title="Xác nhận chặn"
                    open={isBlockModalVisible}
                    onOk={() => {
                        handleBlock({
                            reason: blockReason === 'Khác' ? customReason : blockReason,
                        });
                        restoreDefault();
                    }}
                    onCancel={() => {
                        setIsBlockModalVisible(false);
                        restoreDefault();
                    }}
                    destroyOnClose
                >
                    <p>Bạn có chắc chắn muốn chặn người dùng này?</p>
                    <Select
                        title="Vui lòng chọn lý do"
                        defaultValue="Chọn lý do"
                        value={blockReason}
                        onChange={handleBlockReasonChange}
                        style={{ width: '100%' }}
                    >
                        <Option value={DEFAULT_BLOCK_REASON}>{DEFAULT_BLOCK_REASON}</Option>
                        <Option value="Khác">Khác</Option>
                    </Select>
                    {blockReason === 'Khác' && (
                        <TextArea
                            placeholder="Vui lòng nêu rõ lý do"
                            value={customReason}
                            onChange={handleCustomReasonChange}
                            style={{ marginTop: 16 }}
                        />
                    )}
                </Modal>
                <Modal
                    title="Xác nhận bỏ chặn"
                    open={isUnblockModalVisible}
                    onOk={() => {
                        handleUnblock();
                        restoreDefault();
                    }}
                    onCancel={() => {
                        setIsUnblockModalVisible(false);
                        restoreDefault();
                    }}
                >
                    <p>Bạn có chắc chắn muốn bỏ chặn người dùng này?</p>
                </Modal>
            </>
        </>
    );
}
