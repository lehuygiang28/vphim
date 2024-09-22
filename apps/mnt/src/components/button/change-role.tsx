import { useState } from 'react';
import { Button, Modal, Select } from 'antd';
import { BaseKey, useGetIdentity, useUpdate } from '@refinedev/core';

import type { UpdateUserDto, UserDto } from '~api/app/users/dtos';
import { UserRoleEnum } from '~api/app/users/users.enum';

const { Option } = Select;

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
                <Button onClick={() => setIsUpdateModalVisible(true)}>Change Role</Button>
            )}

            <Modal
                title="Update User Role"
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
                <p>Please select a new role for this user:</p>
                <Select
                    title="Select Role"
                    defaultValue="Select a role"
                    value={selectedRole}
                    onChange={handleRoleChange}
                    style={{ width: '100%' }}
                >
                    {Object.entries(UserRoleEnum).map(([_, role]) => (
                        <Option key={role} value={role}>
                            {role}
                        </Option>
                    ))}
                </Select>
            </Modal>
        </>
    );
}
