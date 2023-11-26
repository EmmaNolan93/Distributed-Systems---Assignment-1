import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as schema from '../shared/types.schema.json';

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const movieId = event.pathParameters?.movieId;
        const year = event.pathParameters?.year;
        console.log('Received event:', JSON.stringify(event));
        console.log('Extracted parameters - movieId:', movieId, 'year:', year);

        if (!movieId) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing movie ID in the request path" }),
            };
        }

        if (!year) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing year in the request path" }),
            };
        }

        // Validate year format as needed

        // Query reviews for the specified movie in the given year
        const reviews = await getMovieReviewsByYear(movieId, year);
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

async function getMovieReviewsByYear(movieId: string, year: string): Promise<any[] | { statusCode: number; headers: { "content-type": string }; body: string }> {
    try {
        const movieIdAsNumber = parseInt(movieId, 10);

        if (isNaN(movieIdAsNumber)) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Invalid movie ID in the request path" }),
            };
        }

        const params: any = {
            TableName: 'MovieReviews',
            KeyConditionExpression: 'movieId = :movieId',
            FilterExpression: 'begins_with(#timestamp, :year)',
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp',
            },
            ExpressionAttributeValues: {
                ':movieId': movieIdAsNumber,
                ':year': year,
            },
        };

        console.log("DynamoDB query parameters:", params);
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
