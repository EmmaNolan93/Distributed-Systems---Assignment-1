
export type Movie = {
    movieId: number;
    genre_ids: number[];
    original_language : string;
    overview: string;
    popularity: number;
    release_date: string;
    title: string
    video: boolean;
    vote_average: number;
    vote_count: number
  }

  export type MovieReview = {
    reviewId: number;
    movieId: number;
    userId: number;
    rating: number;
    comment: string;
    timestamp: string; // or use a Date type
  };
  