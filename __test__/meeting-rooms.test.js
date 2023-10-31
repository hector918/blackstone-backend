const request = require('supertest');
const express = require('express');
const meetingRooms = require('./meetingRooms'); // Import your Express Router here

const app = express();
app.use(express.json());
app.use('../controllers/meeting-rooms', meetingRooms);

describe('Meeting Rooms Router Unit Tests', () => {
  it('should list all meeting rooms', async () => {
    const response = await request(app)
      .get('/meeting-rooms')
      .expect(200);

    // Add assertions to check the response, such as the response body.
  });

  it('should create a meeting room', async () => {
    const newMeetingRoom = {
      name: 'Room 101',
      capacity: 20,
      floor: 1,
    };

    const response = await request(app)
      .post('/meeting-rooms')
      .send(newMeetingRoom)
      .expect(200);

    // Add assertions to check the response, such as the response body.
  });

  it('should get room details by ID', async () => {
    const roomId = 1; // Replace with a valid room ID

    const response = await request(app)
      .get(`/meeting-rooms/${roomId}`)
      .expect(200);

    // Add assertions to check the response, such as the response body.
  });

  it('should list future bookings by meeting room ID', async () => {
    const roomId = 1; // Replace with a valid room ID

    const response = await request(app)
      .get(`/meeting-rooms/${roomId}/bookings`)
      .expect(200);

    // Add assertions to check the response, such as the response body.
  });

  it('should search available rooms', async () => {
    const searchCriteria = {
      startDate: '2023-11-01',
      endDate: '2023-11-02',
      capacity: 10,
      capacityOp: 'greater',
      floor: 2,
      floorOp: 'equal',
    };

    const response = await request(app)
      .post('/meeting-rooms/available')
      .send(searchCriteria)
      .expect(200);

    // Add assertions to check the response, such as the response body.
  });

  // Add more test cases for other routes and scenarios
});
