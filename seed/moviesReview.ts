import { MovieReview } from '../shared/types';
export const movieReviews: MovieReview[] = [
    {
      reviewId: 1,
      movieId: 1234,
      userId: 789,
      rating: 4.8,
      comment: "Great action scenes and an engaging storyline!",
      timestamp: "2023-11-23T15:45:00Z",
    },
    {
      reviewId: 2,
      movieId: 4567,
      userId: 123,
      rating: 3.5,
      comment: "Interesting concept, but the execution could be better.",
      timestamp: "2023-11-24T09:12:30Z",
    },
    {
      reviewId: 3,
      movieId: 2345,
      userId: 456,
      rating: 4.0,
      comment: "I loved the characters and the twists in the plot.",
      timestamp: "2023-11-25T12:30:15Z",
    },
    {
      reviewId: 4,
      movieId: 3456,
      userId: 789,
      rating: 4.5,
      comment: "A must-watch! The cinematography is stunning.",
      timestamp: "2023-11-26T18:20:45Z",
    },
  ];
  
  export default movieReviews;