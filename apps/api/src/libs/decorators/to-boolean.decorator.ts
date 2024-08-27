/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transform } from 'class-transformer';

const ToBoolean = () => {
    const toPlain = Transform(
        ({ value }) => {
            return value;
        },
        {
            toPlainOnly: true,
        },
    );
    const toClass = (target: any, key: string) => {
        return Transform(
            ({ obj }) => {
                return valueToBoolean(obj[key]);
            },
            {
                toClassOnly: true,
            },
        )(target, key);
    };
    return function (target: any, key: string) {
        toPlain(target, key);
        toClass(target, key);
    };
};

const valueToBoolean = (value: any) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (['true', 'on', 'yes', '1'].includes(value.toLowerCase())) {
        return true;
    }
    if (['false', 'off', 'no', '0'].includes(value.toLowerCase())) {
        return false;
    }
    return undefined;
};

export { ToBoolean };
