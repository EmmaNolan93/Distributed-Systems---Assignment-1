import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as schema from '../shared/types.schema.json';

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {

        const parameters = event?.pathParameters;
const reviewerName = parameters?.reviewername ? parameters.reviewername : undefined;
console.log('Received event:', JSON.stringify(event));
console.log(reviewerName);
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
        const reviews = await getReviewsByReviewer(reviewerName);
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
// Lambda function to get reviews by reviewerName
async function getReviewsByReviewer(reviewerName: string) {
    // DynamoDB query to fetch reviews by reviewerName
    const params = {
        TableName: 'MovieReviews',
        IndexName: 'ReviewerIndex',
        KeyConditionExpression: 'reviewerName = :reviewerName',
        ExpressionAttributeValues: {
            ':reviewerName': reviewerName,
        },
    };
    try {
        const response = await ddbDocClient.send(new QueryCommand(params));
        return response.Items || [];
    } catch (error) {
        console.error('Error getting reviews by reviewerName:', error);
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