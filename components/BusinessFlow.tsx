'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  Copy, 
  RefreshCw, 
  Send, 
  Mail, 
  ExternalLink, 
  Loader2
} from 'lucide-react';
import { Business, Keyword } from '@/types/database';

interface BusinessFlowProps {
  slug: string;
}

export default function BusinessFlow({ slug }: BusinessFlowProps) {
  // API Configuration
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;
  const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!;
  const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;

  const [business, setBusiness] = useState<Business | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'experience' | 'keywords' | 'review' | 'feedback' | 'contact'>('experience');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [generatedReview, setGeneratedReview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    email: '',
    message: ''
  });

  // Load business data from Supabase based on slug
  useEffect(() => {
    loadBusinessData();
  }, [slug]);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);

      // Create a simple mapping for demo purposes
      // In production, you'd have a slug column or use business name to slug conversion
      const slugToIdMap: { [key: string]: string } = {
        'sushi-grill': '16',
        'john-does-restaurant': '15',
      };

      const businessId = slugToIdMap[slug];
      
      if (!businessId) {
        // Business not found
        setIsLoading(false);
        return;
      }
      
      // Fetch business data from Supabase clients table
      const businessResponse = await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${businessId}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        if (businessData.length > 0) {
          const client = businessData[0];
          setBusiness(client);
          
          // Parse keywords from the keywords string
          const keywordsList = client.keywords.split(',').map((keyword: string, index: number) => ({
            id: `${index + 1}`,
            keyword: keyword.trim()
          }));
          setKeywords(keywordsList);
        }
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate review using OpenAI API
  const generateReview = async () => {
    if (!business) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that writes authentic, natural-sounding customer reviews.'
            },
            {
              role: 'user',
              content: `Generate a genuine, positive Google review for "${business.business_name}". The customer specifically appreciated: ${selectedKeywords.join(', ')}.

Requirements:
- Write in first person as a satisfied customer
- Sound natural and conversational, not overly promotional
- Keep it between 100-150 words
- Include specific details based on the keywords
- End with a recommendation or intention to return
- Use varied sentence structure
- Avoid clichés and generic phrases`
            }
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const review = data.choices[0].message.content;
        setGeneratedReview(review);
      } else {
        throw new Error('Failed to generate review');
      }
      
    } catch (error) {
      console.error('Error generating review:', error);
      
      // Fallback review
      const fallbackReview = `I had an amazing experience at ${business.business_name}! The ${selectedKeywords.slice(0, 2).join(' and ')} really stood out. I'll definitely be coming back and recommending this place to friends and family. Highly recommend!`;
      setGeneratedReview(fallbackReview);
      
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy review and redirect to Google
  const copyToClipboard = async () => {
    if (!business) return;
    
    try {
      await navigator.clipboard.writeText(generatedReview);
      
      // In production, redirect to actual Google Reviews
      window.open(business.google_reviews_link, '_blank');
      
    } catch (err) {
      alert('Review copied! Please paste it on Google Reviews.');
    }
  };

  // Submit feedback to Supabase and email business owner
  const submitFeedback = async () => {
    if (!business) return;
    
    setIsSubmitting(true);
    
    try {
      // Save to Supabase (you'd need to create a feedback_submissions table)
      const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback_submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          business_id: business.id,
          customer_email: contactForm.email,
          message: contactForm.message,
        }),
      });

      // Send email via EmailJS
      const emailData = {
        to_email: business.client_email,
        from_email: contactForm.email,
        business_name: business.business_name,
        customer_email: contactForm.email,
        message: contactForm.message,
        customer_name: contactForm.email.split('@')[0],
      };

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: emailData,
        }),
      });

      alert('Thank you for your feedback! We have sent your message to the manager.');
      setContactForm({ email: '', message: '' });
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Thank you for your feedback! We have received your message.');
      setContactForm({ email: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate review when reaching review step
  useEffect(() => {
    if (step === 'review' && selectedKeywords.length > 0 && !generatedReview) {
      generateReview();
    }
  }, [step, selectedKeywords]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
          <p>The business you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom right, ${business.theme_colour}20, ${business.theme_colour}10)` }}>
      {/* Progress Bar */}
      <div className="w-full bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full transition-colors ${
              step === 'experience' ? 'bg-gray-800' : 'bg-gray-300'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${
              step === 'keywords' ? 'bg-gray-800' : 'bg-gray-300'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${
              step === 'review' ? 'bg-gray-800' : 'bg-gray-300'
            }`} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        
        {/* Step 1: Experience Rating */}
        {step === 'experience' && (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Tell us about your experience at
              </CardTitle>
              <h2 className="text-3xl font-bold mt-2 text-gray-800">
                {business.business_name}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setStep('keywords')}
                className="w-full h-16 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <Star className="mr-2 h-6 w-6" />
                I had a great time! ⭐
              </Button>
              <Button 
                onClick={() => setStep('feedback')}
                variant="outline"
                className="w-full h-16 text-lg font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
              >
                I did NOT have a great time 😞
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2a: Negative Feedback Path */}
        {step === 'feedback' && (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                How would you like to share your feedback?
              </CardTitle>
              <p className="text-gray-600 mt-4 leading-relaxed">
                We sincerely apologize that your experience didn't meet expectations. Your feedback is valuable to us, and we'd like to make things right.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setStep('contact')}
                className="w-full h-16 text-lg font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: business.theme_colour }}
              >
                <Mail className="mr-2 h-6 w-6" />
                Reach out to manager
              </Button>
              <Button 
                onClick={() => window.open(business.google_reviews_link, '_blank')}
                variant="outline"
                className="w-full h-16 text-lg font-semibold border-2 rounded-xl transition-all hover:scale-105"
                                      style={{ borderColor: business.theme_colour, color: business.theme_colour }}
                    >
                      <RefreshCw className={`mr-2 h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
                      Regenerate Review
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        {step !== 'experience' && (
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => {
                if (step === 'keywords') setStep('experience');
                else if (step === 'review') setStep('keywords');
                else if (step === 'feedback') setStep('experience');
                else if (step === 'contact') setStep('feedback');
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Reviewly</p>
        </div>
      </div>
    </div>
  );
}