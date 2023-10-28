const request = require('supertest');
const app = require('../app'); // Import your Express app here

describe('Express App Unit Tests', () => {
  it('should respond with user profile when authenticated for /is_auth', async () => {
    // You may need to mock the OIDC authentication to simulate an authenticated user
    // Set variable.single_user_mode to false to simulate non-single user mode

    const response = await request(app)
      .get('/is_auth')
      .set('Authorization', 'Bearer YOUR_AUTH_TOKEN') // Add a valid authorization token here
      .expect(200);

    // Add assertions to check the response, such as the user profile
    // For example, you can check if response.body.payload.user_profile exists.
  });

  it('should respond with a 401 when not authenticated for /is_auth', async () => {
    // Set variable.single_user_mode to false to simulate non-single user mode

    const response = await request(app)
      .get('/is_auth')
      .expect(401);

    // Add assertions to check the response, such as the status code.
  });

  it('should respond with a 404 for catch-all route', async () => {
    const response = await request(app)
      .get('/some-nonexistent-route')
      .expect(404);

    // Add assertions to check the response, such as the status code and response body.
  });

  // Add more test cases for other routes
});
