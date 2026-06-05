import type { Metadata } from 'next';
import CastleQuiz from '@/components/quiz/CastleQuiz';

export const metadata: Metadata = {
  title: 'Which European Castle Should You Visit? | Castle Quiz',
  description: 'Answer 7 questions and discover your perfect European castle match — from fairy-tale palaces to dramatic cliff fortresses.',
};

export default function QuizPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <CastleQuiz />
    </div>
  );
}
