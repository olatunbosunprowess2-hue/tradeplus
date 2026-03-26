import { redirect } from 'next/navigation';

// Redirect /listings to / since the marketplace feed is now the homepage
export default function ListingsRedirect() {
    redirect('/');
}
