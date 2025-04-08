import { useState } from 'react';
import { Button, Modal, Select } from 'antd';
import { BaseKey, useGetIdentity, useUpdate } from '@refinedev/core';

import type { UpdateUserDto, UserDto } from '~api/app/users/dtos';
import { UserRoleEnum } from '~api/app/users/users.enum';

const { Option } = Select;

// Mapping for role names in Vietnamese
const roleNameMapping: Record<string, string> = {
    [UserRoleEnum.Admin]: 'Quản trị viên',
    [UserRoleEnum.Member]: 'Thành viên',
};

export type UpdateUserRoleProps = Readonly<{
    user: UserDto;
    idParam: BaseKey;
}>;

export function UpdateUserRole(props: UpdateUserRoleProps) {
    const { user, idParam } = props;
    const { data: me, isLoading: isIdentityLoading } = useGetIdentity<UserDto>();

    const { mutate } = useUpdate();

    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRoleEnum>();

    const handleUpdate = (data: UpdateUserDto) => {
        mutate({
            resource: 'users',
            id: user?._id.toString(),
            values: data,
            invalidates: ['all'],
        });
        clearToDefault();
    };

    const handleRoleChange = (value: UserRoleEnum) => {
        setSelectedRole(value);
    };

    const clearToDefault = () => {
        setIsUpdateModalVisible(false);
        setSelectedRole(undefined);
    };

    return (
        <>
            {!isIdentityLoading && me?._id?.toString() !== idParam?.toString() && (
                <Button onClick={() => setIsUpdateModalVisible(true)}>Thay đổi vai trò</Button>
            )}

            <Modal
                title="Cập nhật vai trò người dùng"
                open={isUpdateModalVisible}
                onOk={() => {
                    handleUpdate({
                        role: selectedRole,
                    });
                }}
                onCancel={() => {
                    clearToDefault();
                }}
                destroyOnClose
            >
                <p>Vui lòng chọn vai trò mới cho người dùng này:</p>
                <Select
                    title="Chọn vai trò"
                    placeholder="Chọn vai trò"
                    value={selectedRole}
                    onChange={handleRoleChange}
                    style={{ width: '100%' }}
                >
                    {Object.entries(UserRoleEnum).map(([_, role]) => (
                        <Option key={role} value={role}>
                            {roleNameMapping[role] || role}
                        </Option>
                    ))}
                </Select>
            </Modal>
        </>
    );
}
