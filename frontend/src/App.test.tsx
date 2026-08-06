import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { test as testApi } from './services/index.service';

jest.mock('./services/index.service', () => ({
  test: jest.fn(),
}));

test('renders the app heading', async () => {
  (testApi as jest.Mock).mockResolvedValue({
    cached: false,
    message: 'API is working',
  });

  render(<App />);
  expect(screen.getByText(/welcome codegenitor/i)).toBeInTheDocument();
  expect(await screen.findByText(/message: API is working/i)).toBeInTheDocument();
});
