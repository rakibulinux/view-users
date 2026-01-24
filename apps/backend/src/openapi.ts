export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Users API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3030" }],
  paths: {
    "/health": {
      get: {
        responses: {
          "200": {
            description: "Health check",
          },
        },
      },
    },
    "/users": {
      get: {
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "role",
            in: "query",
            required: false,
            schema: { $ref: "#/components/schemas/Role" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
    },
    "/users/{id}/toggle-active": {
      patch: {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Updated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      Role: {
        type: "string",
        enum: ["admin", "editor", "viewer"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { $ref: "#/components/schemas/Role" },
          active: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "email", "role", "active", "createdAt"],
      },
    },
  },
} as const;
