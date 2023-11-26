import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import * as schema from '../shared/types.schema.json';

const ajv = new Ajv();
const ddbDocClient = createDynamoDBDocClient();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReview"] || {});
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const movieId = event.pathParameters?.movieId;
        const reviewerName = event.pathParameters?.reviewerName;
        console.log('Received event:', JSON.stringify(event));
        console.log('Extracted parameters - movieId:', movieId, 'reviewerName:', reviewerName);
        console.log("Event: ", event);
        const requestBody = event.body ? JSON.parse(event.body) : {};
        if (!requestBody) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing request body" }),
            };
        }
        // Check if required parameters are present
        if (!movieId || !reviewerName) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing movie ID or reviewer name in the request path" }),
            };
        }

        if (!isValidBodyParams(requestBody)) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    error: "Incorrect type. Must match MovieReview schema",
                    schema: schema.definitions["MovieReview"],
                }),
            };
        }


// Now you can use 'requestBody.comment' in your code
const updatedComment = String(requestBody.comment);
console.log(requestBody.comment)
        // Update the review text in the DynamoDB table
        const updateResult = await updateReviewText(movieId, reviewerName, updatedComment);

        // Check the result and respond accordingly
        if (updateResult) {
            return {
                statusCode: 200,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ message: "Review text updated successfully" }),
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Review not found" }),
            };
        }
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

async function updateReviewText(movieId: string, reviewerName: string, updatedReviewText: string) {
    let params;

    try {
        console.log("Updating review text for movie with ID:", movieId, "and reviewer:", reviewerName);

        if (!movieId || !reviewerName) {
            console.error("Error updating review text: movieId or reviewerName is null");
            return false;
        }

        params = {
            TableName: 'MovieReviews',
            Key: {
                'movieId': parseInt(movieId, 10),
                'username': reviewerName,
            },
            UpdateExpression: 'SET #comment = :updatedReviewText', // Use expression attribute name for 'comment'
            ExpressionAttributeNames: {
                '#comment': 'comment',
            },
            ExpressionAttributeValues: {
                ':updatedReviewText': { S: updatedReviewText },
            },
        };

        const response = await ddbDocClient.send(new UpdateCommand(params));

        console.log("DynamoDB response:", response);

        return true; // Update successful
    } catch (error) {
        console.error("Error updating review text:", error);
        console.log("Failed update params:", JSON.stringify(params, null, 2));
        return false; // Update failed
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
