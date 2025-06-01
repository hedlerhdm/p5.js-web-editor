import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import EmailVerificationView from './EmailVerificationView';

// Add mock theme
const mockTheme = {
  primaryTextColor: '#333',
  backgroundColor: '#fff',
  p5ButtonBackground: '#f1f1f1',
  p5ButtonHover: '#e1e1e1',
  p5ButtonActive: '#d1d1d1',
  borderRadius: '4px'
  // Add any other theme properties used by your components
};

// Mock components
jest.mock('../../IDE/components/Header/Nav', () => () => (
  <div data-testid="nav" />
));

// Mock actions
jest.mock('../actions', () => ({
  verifyEmailConfirmation: (token) => ({
    type: 'VERIFY_EMAIL_CONFIRMATION',
    token
  })
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'EmailVerificationView.Title': 'Verify Email',
        'EmailVerificationView.Verify': 'Email Verification',
        'EmailVerificationView.InvalidTokenNull': 'Invalid verification link',
        'EmailVerificationView.Checking': 'Verifying your email...',
        'EmailVerificationView.Verified': 'Email verified successfully!',
        'EmailVerificationView.InvalidState': 'Invalid verification token'
      };
      return translations[key] || key;
    }
  })
}));

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush
  })
}));

describe('<EmailVerificationView />', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: (
        state = { user: { emailVerificationTokenState: 'checking' } },
        action
      ) => {
        switch (action.type) {
          case 'SET_EMAIL_VERIFICATION_STATE':
            return {
              ...state,
              user: {
                ...state.user,
                emailVerificationTokenState: action.state
              }
            };
          default:
            return state;
        }
      },
      middleware: [thunk]
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    mockHistoryPush.mockClear();
  });

  const renderWithRouter = (route = '/verify-email') =>
    render(
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>
          <MemoryRouter initialEntries={[route]}>
            <Route path="/verify-email">
              <EmailVerificationView />
            </Route>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );

  it('renders verification page with nav', () => {
    renderWithRouter();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByText('Email Verification')).toBeInTheDocument();
  });

  it('shows invalid token message when no token provided', () => {
    renderWithRouter('/verify-email');
    expect(screen.getByText('Invalid verification link')).toBeInTheDocument();
  });

  it('shows checking message when verifying token', () => {
    renderWithRouter('/verify-email?t=test-token');
    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();
  });

  it('shows success message and redirects when verification successful', async () => {
    renderWithRouter('/verify-email?t=test-token');

    // Update store state to verified
    store.dispatch({ type: 'SET_EMAIL_VERIFICATION_STATE', state: 'verified' });

    expect(
      screen.getByText('Email verified successfully!')
    ).toBeInTheDocument();

    // Fast-forward timer
    jest.advanceTimersByTime(1000);

    expect(mockHistoryPush).toHaveBeenCalledWith('/');
  });

  it('shows invalid token message when verification fails', async () => {
    renderWithRouter('/verify-email?t=invalid-token');

    // Update store state to invalid
    store.dispatch({ type: 'SET_EMAIL_VERIFICATION_STATE', state: 'invalid' });

    expect(screen.getByText('Invalid verification token')).toBeInTheDocument();
  });
});
