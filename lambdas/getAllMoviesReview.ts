import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as schema from '../shared/types.schema.json';

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const movieId = event.pathParameters?.movieId;
        const minRating = event.queryStringParameters?.minRating;
        console.log('Received event:', JSON.stringify(event));
        console.log('Extracted parameters - movieId:', movieId, 'minRating:', minRating);

        if (!movieId) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing movie ID in the request path" }),
            };
        }

        // Check if minRating is provided and a valid number
        const minRatingNumber = minRating !== undefined ? parseFloat(minRating) : undefined;

        if (minRating !== undefined && isNaN(minRatingNumber)) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "minRating must be a valid number" }),
            };
        }

        // Query reviews for the specified movie with a rating greater than minRating
        const reviews = await getMovieReviews(movieId, minRatingNumber);
        console.log(reviews);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(reviews),
        };
    } catch (error: any) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error: error.message || "Internal Server Error" }),
        };
    }
};


async function getMovieReviews(movieId: string, minRating?: number): Promise<any[]> {
  try {
      console.log("Getting reviews for movie with ID:", movieId, "and minRating:", minRating);

      const params: any = {
          TableName: 'MovieReviews',
          KeyConditionExpression: 'movieId = :movieId',
          ExpressionAttributeValues: {
              ':movieId': parseInt(movieId, 10),
          },
      };

      // Add a filter condition for minRating if provided
      if (minRating !== undefined) {
          params.FilterExpression = 'rating > :minRating';
          params.ExpressionAttributeValues[':minRating'] = minRating;
      }

      const response = await ddbDocClient.send(new QueryCommand(params));

      console.log("DynamoDB response:", response);
      console.log(response.Items);

      const reviews = response.Items || [];

      return reviews;
  } catch (error) {
      console.error("Error getting movie reviews:", error);
      return [];
  }
}



function createDynamoDBDocClient() {
    const ddbClient = new DynamoDBClient({ region: "eu-north-1" });
    const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
        wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
