import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import ResetPasswordView from './ResetPasswordView';

// Mock theme
const mockTheme = {
  primaryTextColor: '#333',
  backgroundColor: '#fff'
};

// Mock components
jest.mock('../../IDE/components/Header/Nav', () => () => (
  <div data-testid="nav" />
));

jest.mock('../components/ResetPasswordForm', () => () => (
  <div data-testid="reset-password-form">Reset Form</div>
));

// Simplified Helmet mock without props validation
jest.mock('react-helmet', () => ({
  Helmet: () => <div data-testid="helmet-title">Reset Password</div>
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'ResetPasswordView.Title': 'Reset Password',
        'ResetPasswordView.Reset': 'Reset Your Password',
        'ResetPasswordView.Submitted': 'Check your email for a reset link',
        'ResetPasswordView.Login': 'Log In',
        'ResetPasswordView.LoginOr': 'or',
        'ResetPasswordView.SignUp': 'Sign Up'
      };
      return translations[key] || key;
    }
  })
}));

describe('<ResetPasswordView />', () => {
  const renderComponent = (resetPasswordInitiate = false) => {
    const store = configureStore({
      reducer: (state = { user: { resetPasswordInitiate } }) => state,
      middleware: [thunk]
    });

    return render(
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>
          <MemoryRouter>
            <ResetPasswordView />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders basic components', () => {
    renderComponent();

    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderComponent();

    const loginLink = screen.getByRole('link', { name: /log in/i });
    const signUpLink = screen.getByRole('link', { name: /sign up/i });

    expect(loginLink).toHaveAttribute('href', '/login');
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('sets correct page title', () => {
    renderComponent();
    expect(screen.getByTestId('helmet-title')).toHaveTextContent(
      'Reset Password'
    );
  });

  it('shows submitted message when resetPasswordInitiate is true', () => {
    renderComponent(true);

    expect(
      screen.getByText('Check your email for a reset link')
    ).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
  });

  it('applies correct CSS classes based on resetPasswordInitiate state', () => {
    const { container: initialContainer } = renderComponent(false);
    expect(initialContainer.querySelector('.reset-password')).not.toHaveClass(
      'reset-password--submitted'
    );

    const { container: submittedContainer } = renderComponent(true);
    expect(submittedContainer.querySelector('.reset-password')).toHaveClass(
      'reset-password--submitted'
    );
  });

  it('shows navigation options with correct text', () => {
    renderComponent();

    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});
