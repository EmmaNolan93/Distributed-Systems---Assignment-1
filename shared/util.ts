import { marshall } from "@aws-sdk/util-dynamodb";
import { Movie } from "./types";
import { MovieReview } from "./types";
export const generateMovieItem = (movie: Movie) => {
  return {
    PutRequest: {
      Item: marshall(movie),
    },
  };
};

export const generateBatch = (data: Movie[]) => {
  return data.map((e) => {
    return generateMovieItem(e);
  });
};

export const generateMovieReviewItem = (movieReview: MovieReview) => {
  return {
    PutRequest: {
      Item: marshall(movieReview),
    },
  };
};

export const generateReviewBatch = (data: MovieReview[]) => {
  return data.map((review) => {
    return generateMovieReviewItem(review);
  });
};
