export const STATUS_CODES = {
  // Success Codes
  SUCCESS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
  },
  // Error Codes
  ERROR: {
    UNAUTHORIZED: 401,
    SERVER_ERROR: 500,
  },
};

export const isSuccessfulRequest = (httpStatus) =>
  Object.entries(STATUS_CODES.SUCCESS)
    .map(([key, val]) => val)
    .includes(httpStatus);
