import { redirect, RedirectType } from 'next/navigation';

export default function NotFound() {
    return redirect('/', RedirectType.replace);
}
