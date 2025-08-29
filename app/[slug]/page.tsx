import { notFound } from 'next/navigation';
import BusinessFlow from '@/components/BusinessFlow';

// This creates the dynamic business pages
export default function BusinessPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  return <BusinessFlow slug={params.slug} />;
}

// Generate metadata for each business
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // In production, you'd fetch the business name from Supabase here
  const businessName = params.slug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `Share Your Experience - ${businessName} | Reviewly`,
    description: `Tell us about your experience at ${businessName}. Your feedback helps us improve!`,
  };
}