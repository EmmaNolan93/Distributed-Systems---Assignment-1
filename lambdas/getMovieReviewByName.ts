import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as schema from '../shared/types.schema.json';

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const movieId = event.pathParameters?.movieId;
        const reviewerName = event.pathParameters?.reviewerName;
        console.log('Received event:', JSON.stringify(event));
        console.log('Extracted parameters - movieId:', movieId, 'reviewerName:', reviewerName);

        if (!movieId) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing movie ID in the request path" }),
            };
        }

        if (!reviewerName) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing reviewer name in the request path" }),
            };
        }

        // Query reviews for the specified movie with the given reviewer name
        const reviews = await getMovieReviewsByReviewer(movieId, reviewerName);
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

async function getMovieReviewsByReviewer(movieId: string, reviewerName: string): Promise<any[] | { statusCode: number; headers: { "content-type": string }; body: string }> {
    try {
        // ... existing code ...

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
            FilterExpression: 'username = :reviewerName',
            ExpressionAttributeValues: {
                ':movieId': movieIdAsNumber,
                ':reviewerName': reviewerName,
            },
        };

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
