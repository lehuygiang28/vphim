import { Tag } from 'antd';

enum ServerOriginSrc {
    Ophim = 'ophim',
    Kkphim = 'kkphim',
    Nguonc = 'nguonc',
    Vephim = 'vephim',
}

export const ServerOriginSrcTag = ({ originSrc }: { originSrc: string }) => {
    switch (originSrc.toLowerCase()) {
        case ServerOriginSrc.Ophim:
            return <Tag color="green">{originSrc}</Tag>;
        case ServerOriginSrc.Kkphim:
            return <Tag color="blue">{originSrc}</Tag>;
        case ServerOriginSrc.Nguonc:
            return <Tag color="orange">{originSrc}</Tag>;
        case ServerOriginSrc.Vephim:
        default:
            return <Tag color="purple">{originSrc}</Tag>;
    }
};
