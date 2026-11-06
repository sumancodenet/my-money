export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  return res.status(statusCode).json({ success: true, message, data, pagination });
};
