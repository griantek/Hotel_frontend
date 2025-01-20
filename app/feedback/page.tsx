import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FeedbackPage = () => {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      validateToken(id);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`/validate-token?token=${token}`);
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      const data = await response.json();
      setBookingId(data.id);
    } catch (error) {
      setError('Invalid or expired feedback link');
    }
  };

  const submitFeedback = async () => {
    if (!rating || !bookingId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback,
          bookingId
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit feedback.');
      }
    } catch (error) {
      setError('An error occurred while submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="m-4 max-w-md mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <Card className="m-4 max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
            <h2 className="text-xl font-semibold">Thank You!</h2>
            <p className="text-center text-muted-foreground">
              We appreciate your valuable feedback. It helps us improve our services.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Share Your Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                onClick={() => setRating(star)}
                className="p-2 hover:bg-transparent"
              >
                <Star
                  className={`w-8 h-8 ${
                    rating && star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="Tell us about your stay..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />

          <Button
            onClick={submitFeedback}
            disabled={!rating || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackPage;