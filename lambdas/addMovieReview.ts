import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import * as schema from '../shared/types.schema.json';

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReview"] || {});

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        console.log("Event: ", event);
        const body = event.body ? JSON.parse(event.body) : undefined;

        if (!body) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing request body" }),
            };
        }

        if (!isValidBodyParams(body)) {
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

        const movieId = body.movieId;

        if (!movieId) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: "Missing movie ID in the request body" }),
            };
        }

        // Check if the movie ID exists
        const movieExists = await doesMovieExist(movieId);

        if (!movieExists) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ error: `Movie with ID ${movieId} not found` }),
            };
        }

        // Include movieId in the body
        // Note: Adjust the type conversion if needed based on the actual type of movieId
        body.movieId = parseInt(movieId, 10); // Assuming movieId is a number

        const commandOutput = await ddbDocClient.send(
            new PutCommand({
                TableName: 'MovieReviews',
                Item: body,
            })
        );

        return {
            statusCode: 201,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Movie review added" }),
        };
    } catch (error: any) {
        console.log("Error: ", error);
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error: error.message || "Internal Server Error" }),
        };
    }
};

async function doesMovieExist(movieId: string): Promise<boolean> {
    try {
        console.log("Checking if movie exists with ID:", movieId);
        const response = await ddbDocClient.send(
            new GetCommand({
                TableName: 'Movies',
                Key: {
                    movieId: parseInt(movieId, 10), // Assuming movieId is a number, adjust accordingly
                },
            })
        );

        console.log("DynamoDB response:", response);

        return !!response.Item;
    } catch (error) {
        console.error("Error checking if movie exists:", error);
        return false;
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
