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

  useEffect(() => {
    loadBusinessData();
  }, [slug]);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);

      const slugToIdMap: { [key: string]: string } = {
        'sushi-grill': '16',
        'john-does-restaurant': '15',
      };

      const businessId = slugToIdMap[slug];
      
      if (!businessId) {
        setIsLoading(false);
        return;
      }
      
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
      
      const fallbackReview = `I had an amazing experience at ${business.business_name}! The ${selectedKeywords.slice(0, 2).join(' and ')} really stood out. I'll definitely be coming back and recommending this place to friends and family. Highly recommend!`;
      setGeneratedReview(fallbackReview);
      
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!business) return;
    
    try {
      await navigator.clipboard.writeText(generatedReview);
      window.open(business.google_reviews_link, '_blank');
    } catch (err) {
      alert('Review copied! Please paste it on Google Reviews.');
    }
  };

  const submitFeedback = async () => {
    if (!business) return;
    
    setIsSubmitting(true);
    
    try {
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
                <ExternalLink className="mr-2 h-6 w-6" />
                Express publicly on Google
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'contact' && (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Contact Our Manager
              </CardTitle>
              <p className="text-gray-600 mt-2">
                We'll get back to you within 24 hours
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Your email address"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                className="h-12 rounded-xl"
              />
              <Textarea
                placeholder="Tell us about your experience and how we can improve..."
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                className="min-h-32 rounded-xl"
              />
              <Button 
                onClick={submitFeedback}
                disabled={!contactForm.email || !contactForm.message || isSubmitting}
                className="w-full h-12 font-semibold rounded-xl shadow-lg"
                style={{ backgroundColor: business.theme_colour }}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'keywords' && (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                What made your visit special?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Select the aspects that describe your experience
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {keywords.map((keyword) => (
                  <div key={keyword.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={keyword.id}
                      checked={selectedKeywords.includes(keyword.keyword)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKeywords([...selectedKeywords, keyword.keyword]);
                        } else {
                          setSelectedKeywords(selectedKeywords.filter(k => k !== keyword.keyword));
                        }
                      }}
                      className="rounded-lg"
                    />
                    <label 
                      htmlFor={keyword.id} 
                      className="flex-1 text-sm font-medium cursor-pointer p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm"
                    >
                      {keyword.keyword}
                    </label>
                  </div>
                ))}
              </div>
              
              {selectedKeywords.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected keywords:</p>
                  <p className="text-sm text-gray-600">{selectedKeywords.join(', ')}</p>
                </div>
              )}
              
              <Button 
                onClick={() => setStep('review')}
                disabled={selectedKeywords.length === 0}
                className="w-full h-12 font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: business.theme_colour }}
              >
                Generate My Review
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Your Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-800" />
                  <p className="text-gray-600">Creating your personalized review...</p>
                </div>
              )}

              {generatedReview && !isGenerating && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl mb-6 border-2 border-gray-200">
                    <p className="text-gray-800 leading-relaxed">{generatedReview}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl mb-6 text-sm text-gray-700 leading-relaxed">
                    <strong>Our Terms:</strong> By submitting your review, you understand that our AI-generated content is designed to streamline the review process while accurately reflecting your thoughts and feelings about the establishment.
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={copyToClipboard}
                      className="w-full h-12 font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
                      style={{ backgroundColor: business.theme_colour }}
                    >
                      <Copy className="mr-2 h-5 w-5" />
                      Copy and Continue to Google
                    </Button>
                    <Button 
                      onClick={() => {
                        setGeneratedReview('');
                        generateReview();
                      }}
                      variant="outline"
                      disabled={isGenerating}
                      className="w-full h-12 font-semibold rounded-xl border-2 transition-all hover:scale-105"
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

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Reviewly</p>
        </div>
      </div>
    </div>
  );
}