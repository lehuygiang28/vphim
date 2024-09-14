import { redirect, RedirectType } from 'next/navigation';
import { RouteNameEnum } from '@/constants/route.constant';

export default function MoviePage() {
    return redirect(RouteNameEnum.MOVIE_LIST_PAGE, RedirectType.replace);
}
