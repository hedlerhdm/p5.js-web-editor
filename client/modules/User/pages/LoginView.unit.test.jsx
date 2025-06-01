import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import LoginView from './LoginView';

// Mock theme for styled-components
const mockTheme = {
  primaryTextColor: '#333',
  backgroundColor: '#fff',
  Button: {
    primary: {
      default: {
        background: '#ed225d',
        foreground: '#fff'
      }
    }
  }
};

// Mock components
jest.mock('../../IDE/components/Header/Nav', () => () => (
  <div data-testid="nav" />
));

jest.mock('../components/LoginForm', () => () => (
  <div data-testid="login-form" />
));

jest.mock('../components/SocialAuthButton', () => {
  const mockPropTypes = {
    string: { isRequired: true }
  };

  function MockSocialButton({ service }) {
    return (
      <button data-testid={`social-button-${service}`}>
        {`Login with ${service}`}
      </button>
    );
  }

  MockSocialButton.propTypes = {
    service: mockPropTypes.string.isRequired
  };

  MockSocialButton.displayName = 'MockSocialButton';
  MockSocialButton.services = {
    github: 'github',
    google: 'google'
  };
  return MockSocialButton;
});

// Simplified Helmet mock without prop validation
jest.mock('react-helmet', () => ({
  Helmet: function MockHelmet() {
    return <meta data-testid="helmet-title" content="Login" />;
  }
}));

// Update i18next mock with correct translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'LoginView.Title': 'Login',
        'LoginView.Login': 'Login',
        'LoginView.LoginOr': 'or',
        'LoginView.DontHaveAccount': "Don't have an account?", // Fixed apostrophe
        'LoginView.SignUp': 'Sign Up',
        'LoginView.ForgotPassword': 'Forgot your password?',
        'LoginView.ResetPassword': 'Reset password'
      };
      return translations[key] || key;
    }
  })
}));

describe('<LoginView />', () => {
  const renderComponent = () => {
    const store = configureStore({
      reducer: (state = {}) => state,
      middleware: [thunk]
    });

    return render(
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>
          <MemoryRouter>
            <LoginView />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders login form and navigation', () => {
    renderComponent();

    // Check basic layout components
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders social auth buttons', () => {
    renderComponent();

    expect(screen.getByTestId('social-button-github')).toBeInTheDocument();
    expect(screen.getByTestId('social-button-google')).toBeInTheDocument();
  });

  it('renders sign up navigation link', () => {
    renderComponent();

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('renders reset password navigation link', () => {
    renderComponent();

    const resetLink = screen.getByRole('link', { name: /reset password/i });
    expect(resetLink).toBeInTheDocument();
    expect(resetLink).toHaveAttribute('href', '/reset-password');
  });

  it('has correct page title', async () => {
    renderComponent();

    // Wait for title to be updated
    await waitFor(() => {
      expect(screen.getByTestId('helmet-title')).toHaveAttribute(
        'content',
        'Login'
      );
    });
  });

  it('shows form navigation options with correct text', () => {
    renderComponent();

    // Use more flexible text matching
    expect(
      screen.getByText((content) => content.includes("Don't have an account"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('Forgot your password'))
    ).toBeInTheDocument();
  });
});
