import { MovieReview } from "./types";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Movie, MovieCast } from "./types";

type Entity = Movie | MovieCast;  // NEW
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
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
