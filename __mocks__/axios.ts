const requestHandlers: any[] = [];
const responseHandlers: any[] = [];

const axiosMock: any = {
  create: jest.fn(() => axiosMock),
  get: jest.fn(),
  post: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn((fulfilled, rejected) => {
        requestHandlers.push({ fulfilled, rejected });
      }),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn((fulfilled, rejected) => {
        responseHandlers.push({ fulfilled, rejected });
      }),
      eject: jest.fn(),
    },
  },
  defaults: { headers: { common: {} } },
  _requestHandlers: requestHandlers,
  _responseHandlers: responseHandlers,
};

export default axiosMock;
