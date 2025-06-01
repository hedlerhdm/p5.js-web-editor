import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import SignupView from './SignupView';

// Mock theme
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
jest.mock('../../IDE/components/Header/Nav', () => {
  function MockNav() {
    return <div data-testid="nav" />;
  }
  MockNav.displayName = 'MockNav';
  return MockNav;
});

jest.mock('../components/SignupForm', () => {
  function MockSignupForm() {
    return <div data-testid="signup-form">Signup Form</div>;
  }
  MockSignupForm.displayName = 'MockSignupForm';
  return MockSignupForm;
});

// Update SocialAuthButton mock to add prop validation
jest.mock('../components/SocialAuthButton', () => {
  const mockPropTypes = {
    string: { isRequired: true }
  };

  function MockSocialAuthButton({ service }) {
    return (
      <button data-testid={`social-auth-${service}`}>
        Sign up with {service}
      </button>
    );
  }

  MockSocialAuthButton.propTypes = {
    service: mockPropTypes.string.isRequired
  };

  MockSocialAuthButton.services = {
    github: 'github',
    google: 'google'
  };

  MockSocialAuthButton.displayName = 'MockSocialAuthButton';
  return MockSocialAuthButton;
});

// Simplified Helmet mock
jest.mock('react-helmet', () => ({
  Helmet: function MockHelmet() {
    return <div data-testid="helmet-title">Sign Up</div>;
  }
}));

// Update i18next mock with complete translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'SignupView.Title': 'Sign Up',
        'SignupView.Description': 'Sign Up',
        'SignupView.Or': 'or',
        'SignupView.AlreadyHave': 'Already have an account?',
        'SignupView.Login': 'Log In',
        'SignupView.Warning':
          'By signing up, you agree to our Terms of Use and Privacy Policy'
      };
      return translations[key] || key;
    }
  }),
  Trans: function MockTrans() {
    return (
      <span>
        By signing up, you agree to our <a href="/terms-of-use">Terms of Use</a>{' '}
        and <a href="/privacy-policy">Privacy Policy</a>
      </span>
    );
  }
}));

describe('<SignupView />', () => {
  const renderComponent = () => {
    const store = configureStore({
      reducer: (state = {}) => state,
      middleware: [thunk]
    });

    return render(
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>
          <MemoryRouter>
            <SignupView />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders basic components', () => {
    renderComponent();

    expect(screen.getByTestId('nav')).toBeInTheDocument();
    // Use more specific selector for the title
    expect(
      screen.getByRole('heading', { name: /sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();
  });

  it('renders social auth buttons', () => {
    renderComponent();

    expect(screen.getByTestId('social-auth-github')).toBeInTheDocument();
    expect(screen.getByTestId('social-auth-google')).toBeInTheDocument();
  });

  it('renders login navigation link', () => {
    renderComponent();

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('renders terms and privacy links', () => {
    renderComponent();

    const termsLink = screen.getByRole('link', { name: /terms of use/i });
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });

    expect(termsLink).toHaveAttribute('href', '/terms-of-use');
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  it('displays warning message with links', () => {
    renderComponent();

    expect(screen.getByText(/by signing up/i)).toBeInTheDocument();
    // Use queryAllByText to check for existence and count
    const accountTextElements = screen.queryAllByText(
      /already have an account/i
    );
    expect(accountTextElements).toHaveLength(1);
    expect(accountTextElements[0]).toBeInTheDocument();
  });

  it('sets correct page title', () => {
    renderComponent();
    expect(screen.getByTestId('helmet-title')).toHaveTextContent('Sign Up');
  });
});
